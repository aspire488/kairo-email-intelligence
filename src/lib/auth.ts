import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

// Firebase browser configuration is injected at build time instead of committed
// as a live project config. These values are public client identifiers, not
// server secrets; restrict the API key to Firebase APIs and approved origins.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const requiredFirebaseConfig: Array<keyof typeof firebaseConfig> = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId',
];

const missingFirebaseConfig = requiredFirebaseConfig.filter((key) => !firebaseConfig[key]);
if (missingFirebaseConfig.length > 0) {
  throw new Error(
    `Missing Firebase configuration: ${missingFirebaseConfig.join(', ')}. Set the VITE_FIREBASE_* variables before building.`
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels',
];

const provider = new GoogleAuthProvider();
GMAIL_SCOPES.forEach((scope) => provider.addScope(scope));

// Memory-only access token caching (Never store tokens in localStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // Attempt recovery from server-side session bridge using verified Firebase ID token
        try {
          const idToken = await user.getIdToken();
          const res = await fetch('/api/auth/session', {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.authenticated && typeof data?.accessToken === 'string' && data.accessToken) {
              const validToken: string = data.accessToken;
              cachedAccessToken = validToken;
              if (onAuthSuccess) {
                onAuthSuccess(user, validToken);
                return;
              }
            }
          }
        } catch (e) {
          console.warn('Session recovery check failed:', e);
        }

        if (!isSigningIn) {
          cachedAccessToken = null;
          if (onAuthFailure) onAuthFailure();
        }
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Auth');
    }

    cachedAccessToken = credential.accessToken;

    // Register session bridge with backend server using verified ID token
    try {
      const idToken = await result.user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ accessToken: cachedAccessToken }),
      });
    } catch (e) {
      console.warn('Server session registration failed:', e);
    }

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => cachedAccessToken;

export const logout = async () => {
  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (idToken) {
      await fetch('/api/auth/session', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });
    }
  } catch (e) {
    console.warn('Server session cleanup failed:', e);
  }
  await auth.signOut();
  cachedAccessToken = null;
};
