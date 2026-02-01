
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

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

// Auth & Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { app, messaging, getToken, onMessage };
