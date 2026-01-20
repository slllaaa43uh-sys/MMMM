
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// إعدادات فايربيس (يجب أن تكون hardcoded هنا لأن Service Worker لا يصل لـ .env)
// تم التحديث بناءً على البيانات المرسلة
const firebaseConfig = {
  apiKey: "AIzaSyCuH5K2NQhtLmeFtJ19ylnZ3FdcJ_AuOdU",
  authDomain: "mehnati-d7ab9.firebaseapp.com",
  projectId: "mehnati-d7ab9",
  storageBucket: "mehnati-d7ab9.firebasestorage.app",
  messagingSenderId: "951669845862",
  appId: "1:951669845862:web:6c1939f1d4e6c394eda2a7"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // التعامل مع الإشعارات أثناء عمل التطبيق في الخلفية
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/logo.png', // تأكد من وجود أيقونة بهذا الاسم في مجلد public
      badge: '/logo.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.log('Firebase SW init error', e);
}
