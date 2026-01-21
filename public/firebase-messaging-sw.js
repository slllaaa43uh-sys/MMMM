
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBvveNXHmdO_j07dHwyLAiLOj1pxsmbjaQ",
  authDomain: "mehnati-d7ab9.firebaseapp.com",
  projectId: "mehnati-d7ab9",
  storageBucket: "mehnati-d7ab9.firebasestorage.app",
  messagingSenderId: "951669845862",
  appId: "1:951669845862:web:6c1939f1d4e6c394eda2a7"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message: ', payload);
    
    // Customize notification handling here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/logo.png',
      badge: '/logo.png',
      data: payload.data // Pass data for click handling
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.log('Firebase SW init error', e);
}

// Handle Notification Click
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event.notification.data);
  
  event.notification.close();

  // Open the app or focus the window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Check if there's already a window open
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf('/') > -1 && 'focus' in client) {
          // Send message to the client to handle navigation
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            data: event.notification.data
          });
          return client.focus();
        }
      }
      // If no window is open, open one
      if (clients.openWindow) {
        // You can append query params here if needed, or rely on the client grabbing it from history/storage if persisted
        // Ideally, we open the root and let the app handle the data logic via a mechanism
        // For simplicity, we can pass data as query params if creating a new window
        let url = '/';
        if (event.notification.data) {
            const params = new URLSearchParams(event.notification.data).toString();
            url = `/?${params}`;
        }
        return clients.openWindow(url);
      }
    })
  );
});
