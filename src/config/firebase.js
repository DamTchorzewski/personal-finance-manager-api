import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// On Google Cloud (Cloud Run) the app uses the credentials of the service it runs as, so there is no key to store.
// Locally, set GOOGLE_APPLICATION_CREDENTIALS, or FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST to use the
// emulators.
const projectId = process.env.FIREBASE_PROJECT_ID;

if (!getApps().length) initializeApp(projectId ? { projectId } : undefined);

export const auth = getAuth();
export const db = getFirestore();
