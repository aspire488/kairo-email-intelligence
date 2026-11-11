import { EmailMessage } from '../types/index.ts';

export interface PendingSyncOperation {
  id: string;
  type: 'MARK_READ' | 'APPLY_LABEL' | 'CORRECT_CLASSIFICATION' | 'ARCHIVE_PREVIEW';
  payload: Record<string, any>;
  queuedAt: number;
}

export interface ClientSyncState {
  isOnline: boolean;
  lastSyncedTimestamp: number | null;
  pendingQueue: PendingSyncOperation[];
  syncCursor: string | null;
}

const STORAGE_KEY_SYNC_STATE = 'kairo_sync_state';
const STORAGE_KEY_OFFLINE_EMAILS = 'kairo_offline_emails_cache';

export function loadSyncState(): ClientSyncState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SYNC_STATE);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      };
    }
  } catch {
    // Ignore
  }
  return {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastSyncedTimestamp: null,
    pendingQueue: [],
    syncCursor: null,
  };
}

export function saveSyncState(state: ClientSyncState): void {
  try {
    localStorage.setItem(STORAGE_KEY_SYNC_STATE, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save sync state:', e);
  }
}

export function cacheEmailsForOffline(emails: EmailMessage[]): void {
  try {
    // Save compressed representation of up to 50 recent emails for offline reading
    const sample = emails.slice(0, 50).map((e) => ({
      id: e.id,
      threadId: e.threadId,
      from: e.from,
      fromName: e.fromName,
      subject: e.subject,
      snippet: e.snippet,
      date: e.date,
      bodyText: e.bodyText.slice(0, 1000),
      classification: e.classification,
      isUnread: e.isUnread,
      isStarred: e.isStarred,
    }));
    localStorage.setItem(STORAGE_KEY_OFFLINE_EMAILS, JSON.stringify(sample));
  } catch {
    // Storage quota limits
  }
}

export function loadOfflineCachedEmails(): EmailMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OFFLINE_EMAILS);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return [];
}
