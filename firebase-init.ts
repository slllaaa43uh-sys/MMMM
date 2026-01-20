
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// تحميل المتغيرات من ملف .env.local
const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
};

let app = null;
let messaging = null;

try {
  // التحقق من وجود المفاتيح قبل التهيئة لتجنب الأخطاء
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    
    // التحقق من دعم المتصفح للإشعارات
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        messaging = getMessaging(app);
      } catch (e) {
        console.warn("Firebase Messaging failed to initialize (supported only in secure context/https)", e);
      }
    }
  } else {
    console.warn("Firebase Config keys are missing.");
  }
} catch (error) {
  console.error("Firebase Initialization Error:", error);
}

export { messaging, getToken, onMessage };
