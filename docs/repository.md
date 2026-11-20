# Repozytorium: opis i tagi

Rzeczy, które ustawia się na GitHubie ręcznie (nie da się ich zapisać w plikach repozytorium). Przegląd projektu: [README](../README.md).

## Nazwa repozytorium: `personal-finance-manager-api`

Standard nazw repozytoriów: `reops/standards/repo-names.md`. Repozytorium nazywało się wcześniej `wallet`; od 2026-11-20 nazywa się `personal-finance-manager-api` (nazwa mówi, czym jest projekt: fraza szukana na GitHubie; rola, `-api`, jest na końcu, jak w standardzie). To API aplikacji z repozytorium `personal-finance-manager`. GitHub przekierowuje stary adres repozytorium. Hosting przeniesiono z Render na Google Cloud Run, z logowaniem Firebase i bazą Firestore (zamiast własnego JWT i MongoDB).

## Opis i tagi (About)

GitHub: strona repozytorium → ⚙ obok „About” → pola poniżej. Opis ma limit 350 znaków, tagi (topics) pisze się małymi literami z myślnikami, najwyżej 20.

**Opis (Description):**

```text
REST API for a personal finance app: Node.js, Express, Firestore, Firebase Auth and Swagger docs, on Cloud Run.
```

**Tagi (Topics):**

```text
nodejs express firebase firestore firebase-auth google-cloud cloud-run rest-api swagger openapi personal-finance joi
```

Z GitHub CLI (`gh`) to samo jedną komendą:

```bash
gh repo edit DamTchorzewski/personal-finance-manager-api --description "REST API for a personal finance app: Node.js, Express, Firestore, Firebase Auth and Swagger docs, on Cloud Run." --add-topic nodejs --add-topic express --add-topic firebase --add-topic firestore --add-topic firebase-auth --add-topic google-cloud --add-topic cloud-run --add-topic rest-api --add-topic swagger --add-topic openapi --add-topic personal-finance --add-topic joi
```

## Ustawienia do włączenia

| Gdzie (GitHub)                      | Co ustawić                                                                        |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| Settings → General → Default branch | `main` (już jest)                                                                 |
| Settings → Environments → `production` | zmienne wdrożenia na Cloud Run, patrz [deployment.md](deployment.md) |
