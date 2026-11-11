import { LocalNotifications } from '@capacitor/local-notifications';
import { currentPlatform } from './platform.ts';

export type NotificationCategory = 'critical' | 'important' | 'oss_action' | 'career' | 'academic' | 'general';

export interface NotificationPayload {
  id?: number;
  title: string;
  body: string;
  category: NotificationCategory;
  threadId?: string;
  emailId?: string;
  includeBodyPreview?: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  categories: Record<NotificationCategory, boolean>;
  lockScreenPrivacy: boolean; // Omits sensitive body text on lock screen
  sound: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  categories: {
    critical: true,
    important: true,
    oss_action: true,
    career: true,
    academic: true,
    general: false, // Avoid noise
  },
  lockScreenPrivacy: true,
  sound: true,
};

/**
 * Initializes notification channels for Android.
 */
export async function initializeNotificationChannels(): Promise<void> {
  if (!currentPlatform.isNativeMobile) return;

  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }

    // Register channels on Android
    await LocalNotifications.createChannel({
      id: 'kairo_critical',
      name: 'KAIRO Critical Alerts',
      description: 'Urgent security and immediate deadline alerts',
      importance: 5,
      visibility: 1,
      vibration: true,
    });

    await LocalNotifications.createChannel({
      id: 'kairo_important',
      name: 'KAIRO Important Updates',
      description: 'Important correspondence and academic/career notifications',
      importance: 4,
      visibility: 1,
    });

    await LocalNotifications.createChannel({
      id: 'kairo_oss',
      name: 'KAIRO Open Source Activity',
      description: 'Pull requests, maintainer reviews, and CI failure notices',
      importance: 3,
      visibility: 0,
    });
  } catch (err) {
    console.warn('Channel creation error:', err);
  }
}

/**
 * Dispatches a notification across mobile and desktop.
 */
export async function dispatchNotification(
  payload: NotificationPayload,
  settings: NotificationSettings = DEFAULT_NOTIFICATION_SETTINGS
): Promise<void> {
  if (!settings.enabled || !settings.categories[payload.category]) {
    return;
  }

  const sanitizedBody = settings.lockScreenPrivacy
    ? `${payload.category.toUpperCase().replace('_', ' ')} · Notification pending in KAIRO`
    : payload.body;

  const channelMap: Record<NotificationCategory, string> = {
    critical: 'kairo_critical',
    important: 'kairo_important',
    oss_action: 'kairo_oss',
    career: 'kairo_important',
    academic: 'kairo_important',
    general: 'kairo_important',
  };

  if (currentPlatform.isNativeMobile) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: payload.id || Math.floor(Math.random() * 1000000),
            title: payload.title,
            body: sanitizedBody,
            channelId: channelMap[payload.category],
            extra: {
              threadId: payload.threadId,
              emailId: payload.emailId,
              category: payload.category,
            },
          },
        ],
      });
    } catch (e) {
      console.warn('Mobile local notification failed:', e);
    }
    return;
  }

  // Desktop Web / Tauri notification
  if (typeof Notification !== 'undefined') {
    if (Notification.permission === 'granted') {
      new Notification(payload.title, {
        body: sanitizedBody,
        icon: '/favicon.ico',
        tag: payload.category,
      });
    } else if (Notification.permission !== 'denied') {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        new Notification(payload.title, {
          body: sanitizedBody,
          icon: '/favicon.ico',
          tag: payload.category,
        });
      }
    }
  }
}
