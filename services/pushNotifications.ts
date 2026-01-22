
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';

const CHANNEL_ID = 'mehnati_pro_channel_v7';

export const isNativePlatform = (): boolean => {
  return Capacitor.getPlatform() !== 'web';
};

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
        sound: 'notify',
      });
      console.log('✅ Notification channel created:', CHANNEL_ID);
    } catch (error) {
      console.error('❌ Error creating notification channel:', error);
    }
  }
};

export const checkPermissions = async (): Promise<boolean> => {
  if (!isNativePlatform()) return false;
  const status = await PushNotifications.checkPermissions();
  return status.receive === 'granted';
};

export const requestPermissions = async (): Promise<boolean> => {
  if (!isNativePlatform()) {
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

export const registerForPushNotifications = async (): Promise<string | null> => {
  if (!isNativePlatform()) return null;

  const hasPermission = await requestPermissions();
  if (!hasPermission) return null;

  return new Promise((resolve) => {
    // 1. Remove previous listeners to avoid duplicates during re-registration
    PushNotifications.removeAllListeners();

    // 2. Setup one-time listeners to capture the token
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('✅ FCM Token generated:', token.value);
      localStorage.setItem('fcmToken', token.value);
      resolve(token.value);
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('❌ FCM Registration Error:', error);
      resolve(null);
    });

    // 3. Trigger registration
    PushNotifications.register();
  });
};

export const getStoredToken = () => {
  return localStorage.getItem('fcmToken');
};

export const addListeners = (
  onReceived: (notification: PushNotificationSchema) => void,
  onActionPerformed: (notification: ActionPerformed) => void
) => {
  if (!isNativePlatform()) return;

  PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
    console.log('🔔 Notification Received:', notification);
    onReceived(notification);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
    console.log('👉 Notification Action Performed:', notification);
    onActionPerformed(notification);
  });
};
