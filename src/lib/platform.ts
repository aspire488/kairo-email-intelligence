import { Capacitor } from '@capacitor/core';

export type AppPlatform = 'web' | 'desktop' | 'android' | 'ios';
export type OperatingSystem = 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'unknown';

export interface PlatformCapabilities {
  platform: AppPlatform;
  os: OperatingSystem;
  isNativeMobile: boolean;
  isDesktop: boolean;
  isWeb: boolean;
  hasSystemTray: boolean;
  hasHaptics: boolean;
  hasBiometrics: boolean;
  hasPushNotifications: boolean;
  hasGlobalShortcuts: boolean;
  supportsSwipeActions: boolean;
}

/**
 * Detects the runtime environment and operating system.
 */
export function getPlatformCapabilities(): PlatformCapabilities {
  const isCapacitor = Capacitor.isNativePlatform();
  const capacitorPlatform = Capacitor.getPlatform(); // 'android' | 'ios' | 'web'
  const isTauri = typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__);

  let platform: AppPlatform = 'web';
  if (isCapacitor && capacitorPlatform === 'android') platform = 'android';
  else if (isCapacitor && capacitorPlatform === 'ios') platform = 'ios';
  else if (isTauri) platform = 'desktop';
  else {
    // Check userAgent for web-mobile view
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
    if (/android/i.test(ua)) platform = 'web';
    else if (/iphone|ipad|ipod/i.test(ua)) platform = 'web';
  }

  // OS detection
  let os: OperatingSystem = 'unknown';
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('win')) os = 'windows';
    else if (ua.includes('mac') && !ua.includes('iphone') && !ua.includes('ipad')) os = 'macos';
    else if (ua.includes('linux') && !ua.includes('android')) os = 'linux';
    else if (ua.includes('android')) os = 'android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'ios';
  }

  const isNativeMobile = platform === 'android' || platform === 'ios';
  const isDesktop = platform === 'desktop' || (!isNativeMobile && (os === 'windows' || os === 'macos' || os === 'linux'));

  return {
    platform,
    os,
    isNativeMobile,
    isDesktop,
    isWeb: platform === 'web',
    hasSystemTray: platform === 'desktop',
    hasHaptics: isNativeMobile,
    hasBiometrics: isNativeMobile || platform === 'desktop',
    hasPushNotifications: true,
    hasGlobalShortcuts: isDesktop || platform === 'web',
    supportsSwipeActions: isNativeMobile,
  };
}

export const currentPlatform = getPlatformCapabilities();
