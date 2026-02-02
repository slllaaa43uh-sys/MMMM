
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

// Updated Config
const firebaseConfig = {
  apiKey: "AIzaSyBvveNXHmdO_j07dHwyLAiLOj1pxsmbjaQ",
  authDomain: "mehnati-d7ab9.firebaseapp.com",
  projectId: "mehnati-d7ab9",
  storageBucket: "mehnati-d7ab9.firebasestorage.app",
  messagingSenderId: "951669845862",
  appId: "1:951669845862:web:6c1939f1d4e6c394eda2a7",
  measurementId: "G-MEASUREMENT_ID"
};

let app = null;
let messaging = null;

try {
  // Initialize App
  app = initializeApp(firebaseConfig);
  
  // Initialize Messaging (Browser only)
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    try {
      messaging = getMessaging(app);
    } catch (e) {
      console.warn("Firebase Messaging initialization failed (Note: Messaging requires HTTPS or localhost)", e);
    }
  }
} catch (error) {
  console.error("Firebase Initialization Error:", error);
}

// Initialize Google Auth Native
GoogleAuth.initialize({
  clientId: '951669845862-ijkmvh127cro19u3d3gkmhb3a2t4l2vi.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
  // Backend only needs a Firebase ID token; offline access (server auth code) is not required.
  // Disabling it avoids extra network calls that can time out on some Android setups.
  grantOfflineAccess: false,
});

// Auth & Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { app, messaging, getToken, onMessage, GoogleAuth };
