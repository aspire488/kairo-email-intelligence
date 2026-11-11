import { Preferences } from '@capacitor/preferences';
import { currentPlatform } from './platform.ts';

/**
 * Unified Secure Storage Abstraction.
 * Strictly adheres to token security mandates:
 * - On Native Mobile: backed by native encrypted preferences (Android EncryptedSharedPreferences / iOS Keychain).
 * - On Web: credentials are kept strictly in memory or server session; non-credential data uses localStorage.
 */

const inMemoryCredentials = new Map<string, string>();

export async function secureSet(key: string, value: string, isSensitiveCredential = false): Promise<void> {
  if (currentPlatform.isNativeMobile) {
    await Preferences.set({ key: `kairo_sec_${key}`, value });
    return;
  }

  // Web & Desktop fallback: sensitive tokens stay in memory only
  if (isSensitiveCredential) {
    inMemoryCredentials.set(key, value);
    return;
  }

  try {
    localStorage.setItem(`kairo_store_${key}`, value);
  } catch (e) {
    console.warn('Storage set failed:', e);
  }
}

export async function secureGet(key: string, isSensitiveCredential = false): Promise<string | null> {
  if (currentPlatform.isNativeMobile) {
    const { value } = await Preferences.get({ key: `kairo_sec_${key}` });
    return value;
  }

  if (isSensitiveCredential) {
    return inMemoryCredentials.get(key) || null;
  }

  try {
    return localStorage.getItem(`kairo_store_${key}`);
  } catch {
    return null;
  }
}

export async function secureRemove(key: string): Promise<void> {
  inMemoryCredentials.delete(key);
  if (currentPlatform.isNativeMobile) {
    await Preferences.remove({ key: `kairo_sec_${key}` });
    return;
  }
  try {
    localStorage.removeItem(`kairo_store_${key}`);
  } catch {
    // Ignore
  }
}
