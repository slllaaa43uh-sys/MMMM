
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// إعدادات فايربيس (تم التحديث بالمفتاح الجديد AIzaSyCu...)
const firebaseConfig = {
  apiKey: "AIzaSyCuH5K2NQhtLmeFtJ19ylnZ3FdcJ_AuOdU",
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
  // تهيئة التطبيق
  app = initializeApp(firebaseConfig);
  
  // تهيئة خدمة الإشعارات (Messaging)
  // نتأكد أننا في المتصفح وأن الخدمة مدعومة
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

// تصدير الأدوات لكي تستخدمها الملفات الأخرى مثل App.tsx
export { app, messaging, getToken, onMessage };
