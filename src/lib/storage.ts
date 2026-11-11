import {
  AuditLogEntry,
  EmailClassification,
  UserPreferences,
  ChatConversation,
  ThemeMode,
} from '../types/index.ts';

const PREFS_KEY = 'kairo_user_preferences_v1';
const AUDIT_LOG_KEY = 'kairo_audit_log_v1';
const CLASSIFICATION_CACHE_KEY = 'kairo_classifications_cache_v1';
const ONBOARDING_COMPLETED_KEY = 'kairo_onboarding_completed_v1';
const CHAT_CONVERSATIONS_KEY = 'kairo_chat_conversations_v1';
const THEME_KEY = 'kairo_theme_mode_v1';

export const DEFAULT_PREFERENCES: UserPreferences = {
  dryRunMode: true, // Always start in dry-run mode as mandated by Section 8!
  autoArchiveNoise: false,
  autoLabelCritical: true,
  autoLabelOSS: true,
  requireApprovalForArchiving: true,
  alwaysPrioritizeSenders: [],
  neverArchiveSenders: [],
  senderCategoryOverrides: {},
};

export function loadUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveUserPreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error('Failed to save preferences:', err);
  }
}

export function loadAuditLog(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
  const fullEntry: AuditLogEntry = {
    ...entry,
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const current = loadAuditLog();
    const updated = [fullEntry, ...current].slice(0, 500); // keep last 500
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to record audit log:', err);
  }

  return fullEntry;
}

export function loadClassificationCache(): Record<string, EmailClassification> {
  try {
    const raw = localStorage.getItem(CLASSIFICATION_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveClassificationCache(cache: Record<string, EmailClassification>): void {
  try {
    localStorage.setItem(CLASSIFICATION_CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.error('Failed to save classification cache:', err);
  }
}

export function isOnboardingCompleted(): boolean {
  return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
}

export function setOnboardingCompleted(completed: boolean): void {
  localStorage.setItem(ONBOARDING_COMPLETED_KEY, completed ? 'true' : 'false');
}

export function loadChatConversations(): ChatConversation[] {
  try {
    const raw = localStorage.getItem(CHAT_CONVERSATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveChatConversations(conversations: ChatConversation[]): void {
  try {
    localStorage.setItem(CHAT_CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (err) {
    console.error('Failed to save chat conversations:', err);
  }
}

export function loadTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    return raw === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function saveTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (err) {
    console.error('Failed to save theme:', err);
  }
}
