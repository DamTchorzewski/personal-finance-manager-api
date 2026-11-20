# Wdrożenie: Google Cloud Run, Firebase Authentication i Firestore

API działa na **Cloud Run** (kontener budowany przez Google z kodu, bez Dockerfile), użytkownicy są w **Firebase Authentication**,
dane w **Firestore**. Wszystko w jednym projekcie Google, w darmowych limitach: Cloud Run skaluje się do zera, ma najwyżej
dwie instancje i małą pamięć (patrz `.github/workflows/deploy.yml`). Aplikacja (`personal-finance-manager`) stoi na GitHub
Pages i woła to API.

W API nie ma żadnego sekretu: na Cloud Run działa jako konto usługi projektu (`pfm-api`), które ma dostęp do Firestore.
GitHub loguje się do Google przez Workload Identity Federation, więc nie ma też klucza w GitHubie.

Region wszędzie: `europe-west1` (Belgia).

## 1. Projekt Google Cloud i Firebase (w przeglądarce)

1. **console.cloud.google.com** → wybór projektu → *New project* → nazwa `personal-finance-manager`. Zapisz **Project ID**
   (np. `personal-finance-manager-a1b2c`).
2. **Billing** → podepnij konto rozliczeniowe do projektu. Zaraz potem **Billing → Budgets & alerts → Create budget**:
   kwota 5 zł (lub 2 USD), alerty przy 50 %, 90 % i 100 %. Alert tylko ostrzega, więc limit instancji w workflow jest
   drugą zaporą.
3. **console.firebase.google.com** → *Add project* → *Select an existing Google Cloud project* → wybierz projekt z punktu 1
   (Google Analytics wyłącz).
4. W Firebase: **Build → Authentication → Get started → Sign-in method**:
   - **Email/Password**: włącz (zwykłe logowanie, bez „Email link"),
   - **Google**: włącz, wybierz adres e-mail wsparcia projektu i zapisz.
   Potem **Settings → Authorized domains → Add domain** → `damtchorzewski.github.io` (`localhost` już jest).
5. W Firebase: **Project settings (kółko zębate) → General → Your apps → ikona web `</>`** → nazwa `personal-finance-manager`,
   *Register app* (Firebase Hosting nie zaznaczaj). Skopiuj z `firebaseConfig` pięć wartości: `apiKey`, `authDomain`,
   `projectId`, `appId`, `messagingSenderId`. To publiczne identyfikatory aplikacji webowej, nie sekrety.
6. (Opcjonalnie) **Authentication → Templates → Email address verification → Customize action URL** → adres aplikacji
   `https://damtchorzewski.github.io/personal-finance-manager/`. Wtedy link z maila weryfikacyjnego otwiera od razu
   aplikację, która potwierdza adres i loguje użytkownika; bez tego link kończy na stronie Firebase z przyciskiem
   „Continue", który też wraca do aplikacji.

## 2. Jednorazowa konfiguracja w Cloud Shell

W konsoli Google Cloud kliknij ikonę **Activate Cloud Shell** (`>_`, prawy górny róg) i wklej cały blok, po wpisaniu własnego
`PROJECT_ID` w pierwszej linii. Skrypt włącza usługi, tworzy bazę Firestore, konto usługi API i konto usługi dla GitHuba i
łączy GitHub Actions z projektem (bez kluczy). Można go uruchomić ponownie, jeśli któryś krok się nie uda.

```bash
PROJECT_ID="TU-WPISZ-PROJECT-ID"
REGION="europe-west1"
REPO="DamTchorzewski/personal-finance-manager-api"

gcloud config set project "$PROJECT_ID"
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')

gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  iamcredentials.googleapis.com firestore.googleapis.com identitytoolkit.googleapis.com

# Firestore (tryb natywny); reguły domyślne blokują dostęp z zewnątrz, API wchodzi przez konto usługi
gcloud firestore databases create --location="$REGION" --type=firestore-native || true

# konto, jako które działa API
gcloud iam service-accounts create pfm-api --display-name="Personal Finance Manager API" || true
RUN_SA="pfm-api@${PROJECT_ID}.iam.gserviceaccount.com"
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${RUN_SA}" --role="roles/datastore.user"

# konto, którym GitHub wdraża
gcloud iam service-accounts create github-deployer --display-name="GitHub Actions deployer" || true
DEPLOY_SA="github-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
for ROLE in roles/run.admin roles/cloudbuild.builds.editor roles/artifactregistry.writer roles/storage.admin \
            roles/serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${DEPLOY_SA}" --role="$ROLE"
done
gcloud iam service-accounts add-iam-policy-binding "$RUN_SA" \
  --member="serviceAccount:${DEPLOY_SA}" --role="roles/iam.serviceAccountUser"

# budowanie z kodu używa domyślnego konta Compute; konto wdrażające musi móc działać jako ono
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" --role="roles/cloudbuild.builds.builder"
gcloud iam service-accounts add-iam-policy-binding "${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --member="serviceAccount:${DEPLOY_SA}" --role="roles/iam.serviceAccountUser"

# repozytorium obrazów, które Cloud Run tworzy przy pierwszym wdrożeniu z kodu (konto wdrażające nie ma prawa go tworzyć)
gcloud artifacts repositories create cloud-run-source-deploy --repository-format=docker --location="$REGION" \
  --description="Cloud Run source deploys" || true

# GitHub Actions bez klucza: Workload Identity Federation, tylko dla tego repozytorium
gcloud iam workload-identity-pools create github --location=global --display-name="GitHub" || true
gcloud iam workload-identity-pools providers create-oidc github-provider --location=global \
  --workload-identity-pool=github --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='${REPO}'" || true
POOL="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github"
gcloud iam service-accounts add-iam-policy-binding "$DEPLOY_SA" --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${POOL}/attribute.repository/${REPO}"

echo
echo "GCP_PROJECT_ID=${PROJECT_ID}"
echo "GCP_REGION=${REGION}"
echo "GCP_SERVICE_ACCOUNT=${DEPLOY_SA}"
echo "GCP_WORKLOAD_IDENTITY_PROVIDER=${POOL}/providers/github-provider"
```

Na końcu skrypt wypisuje cztery wartości (nazwy zmiennych GitHuba). To nie są sekrety.

Wskazówki, gdy coś się nie uda:
- Wklejaj skrypt częściami (kilka komend naraz): wklejenie całości naraz potrafi skleić ostatnie linie.
- „concurrent policy changes" przy `add-iam-policy-binding` to chwilowy konflikt, wystarczy powtórzyć tę jedną komendę.
- Przy wdrożeniu błąd „caller does not have permission to act as service account <numer>" oznacza brak roli
  `roles/iam.serviceAccountUser` konta wdrażającego na koncie budowania (komenda wyżej); `gcloud iam service-accounts list
  --format="table(email,uniqueId)"` pokaże, które konto ma ten numer.

## 3. GitHub

Repozytorium `personal-finance-manager-api` → **Settings → Environments → New environment** → `production` (*Deployment
branches: Selected branches → `main`*). W tym środowisku **Variables** dodaj pięć zmiennych (wartości z końca skryptu):

| Zmienna                          | Wartość                                          |
| -------------------------------- | ------------------------------------------------ |
| `GCP_PROJECT_ID`                 | Project ID                                       |
| `GCP_REGION`                     | `europe-west1`                                   |
| `GCP_SERVICE_ACCOUNT`            | `github-deployer@<project>.iam.gserviceaccount.com` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | wartość wypisana przez skrypt                    |
| `CORS_ORIGIN`                    | `https://damtchorzewski.github.io`               |

Repozytorium `personal-finance-manager` (aplikacja) → **Settings → Secrets and variables → Actions → Variables** (zmienne
repozytorium): `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`,
`VITE_FIREBASE_MESSAGING_SENDER_ID` (pięć wartości z punktu 1.5) oraz `VITE_API_URL` (adres Cloud Run po pierwszym
wdrożeniu, z `/api` na końcu, np. `https://personal-finance-manager-api-xxxx-ew.a.run.app/api`).

## 4. Pierwsze wdrożenie i sprawdzenie

1. Uruchom workflow **Deploy (Cloud Run)** (zakładka Actions → *Run workflow*, gałąź `main`) albo wypchnij zmianę na `main`.
2. Po zielonym przebiegu adres usługi jest w logu (`Deployed: https://…run.app`). `GET <adres>/health` zwraca
   `{"status":"ok"}`, a `<adres>/api-docs` to dokumentacja Swagger.
3. Wpisz ten adres (z `/api`) do zmiennej `VITE_API_URL` aplikacji i uruchom jej workflow **Deploy (GitHub Pages)**.
4. Na stronie aplikacji: rejestracja e-mailem (przyjdzie wiadomość weryfikacyjna od Firebase), logowanie e-mailem,
   logowanie Google, tryb demo.

## Koszty i bezpieczeństwo

- Brak instancji w stanie gotowości (`--min-instances=0`): pierwsze zapytanie po przerwie trwa dłużej (zimny start).
- `--max-instances=2` ogranicza koszt przy nagłym ruchu. Alert budżetu ostrzega e-mailem.
- API przyjmuje zapytania z przeglądarki tylko z `CORS_ORIGIN`; każda trasa poza `/health` i `/api-docs` wymaga tokenu
  Firebase.
- Reguły Firestore zostają domyślne (odmowa dla wszystkich): dane czyta i zapisuje tylko API.
- Jeśli któraś usługa przekroczy darmowy limit, to rachunek wystawi Google. Dokładne limity są w cennikach Cloud Run,
  Firestore i Firebase Authentication; sprawdź je przed uruchomieniem większego ruchu.
