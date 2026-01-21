
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { API_BASE_URL } from '../constants';

const CHANNEL_ID = 'mehnati_pro_channel_v7'; // Updated Channel ID

export const createNotificationChannel = async () => {
  if (Capacitor.getPlatform() === 'android') {
    try {
      await PushNotifications.createChannel({
        id: CHANNEL_ID,
        name: 'Mehnati Notifications',
        description: 'General app notifications',
        importance: 5,
        visibility: 1,
        lights: true,
        vibration: true,
        sound: 'notify', // Custom sound
      });
      console.log('✅ Notification channel created:', CHANNEL_ID);
    } catch (error) {
      console.error('❌ Error creating notification channel:', error);
    }
  }
};

export const requestPermissions = async (): Promise<boolean> => {
  if (Capacitor.getPlatform() === 'web') {
    if (typeof Notification !== 'undefined') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  } else {
    const result = await PushNotifications.requestPermissions();
    return result.receive === 'granted';
  }
};

export const registerForPushNotifications = async (authToken: string) => {
  if (Capacitor.getPlatform() === 'web') return;

  try {
    const hasPermission = await requestPermissions();
    if (hasPermission) {
      await PushNotifications.register();
      addListeners(authToken);
    }
  } catch (error) {
    console.error('❌ Error registering for push notifications:', error);
  }
};

export const getStoredToken = () => {
  return localStorage.getItem('fcmToken');
};

const addListeners = (authToken: string) => {
  PushNotifications.removeAllListeners();

  // Registration success
  PushNotifications.addListener('registration', async (token: Token) => {
    console.log('✅ FCM Token:', token.value);
    localStorage.setItem('fcmToken', token.value);
    
    // Send token to server
    try {
      await fetch(`${API_BASE_URL}/api/v1/users/fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ 
          fcmToken: token.value,
          platform: Capacitor.getPlatform() 
        })
      });
      console.log('✅ FCM Token synced with server');
    } catch (e) {
      console.error('❌ Failed to sync FCM token:', e);
    }
  });

  // Registration error
  PushNotifications.addListener('registrationError', (error: any) => {
    console.error('❌ FCM Registration Error:', error);
  });

  // Received notification (Foreground)
  PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
    console.log('🔔 Notification Received:', notification);
    // You can dispatch a global event or show a toast here if needed
    window.dispatchEvent(new CustomEvent('notification-received', { detail: notification }));
  });

  // Notification Action (Click)
  PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
    console.log('👉 Notification Action Performed:', notification);
    const data = notification.notification.data;
    handleNotificationClick(data);
  });
};

export const handleNotificationClick = (data: any) => {
  console.log('Handling notification data:', data);
  // Dispatch a custom event that App.tsx will listen to for navigation
  window.dispatchEvent(new CustomEvent('notification-clicked', { detail: data }));
};
