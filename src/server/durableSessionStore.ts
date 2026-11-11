export interface DeviceSession {
  deviceId: string;
  deviceName: string;
  platform: 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'web';
  accessToken: string;
  email: string;
  createdAt: number;
  lastSeen: number;
  expiresAt: number;
  pushToken?: string;
}

export interface UserStateSyncDocument {
  uid: string;
  classifications: Record<string, any>;
  preferences: Record<string, any>;
  chatConversations: any[];
  auditLogs: any[];
  lastUpdated: number;
}

// In-memory durable store with support for multi-device topology
class DurableSessionStore {
  // Key: `${uid}:${deviceId}` -> DeviceSession
  private sessions = new Map<string, DeviceSession>();
  // Key: uid -> UserStateSyncDocument
  private userSyncDocs = new Map<string, UserStateSyncDocument>();

  private getKey(uid: string, deviceId: string): string {
    return `${uid}:${deviceId}`;
  }

  public registerDeviceSession(
    uid: string,
    session: Omit<DeviceSession, 'createdAt' | 'lastSeen'>
  ): DeviceSession {
    const now = Date.now();
    const fullSession: DeviceSession = {
      ...session,
      createdAt: now,
      lastSeen: now,
    };
    this.sessions.set(this.getKey(uid, session.deviceId), fullSession);
    return fullSession;
  }

  public getDeviceSession(uid: string, deviceId: string): DeviceSession | null {
    const session = this.sessions.get(this.getKey(uid, deviceId));
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(this.getKey(uid, deviceId));
      return null;
    }

    session.lastSeen = Date.now();
    return session;
  }

  // Find any active session for uid (for single device fallback or web)
  public getAnyActiveSessionForUser(uid: string): DeviceSession | null {
    const prefix = `${uid}:`;
    const now = Date.now();

    for (const [key, session] of this.sessions.entries()) {
      if (key.startsWith(prefix)) {
        if (now <= session.expiresAt) {
          session.lastSeen = now;
          return session;
        } else {
          this.sessions.delete(key);
        }
      }
    }
    return null;
  }

  public listUserDevices(uid: string): Array<Omit<DeviceSession, 'accessToken'>> {
    const prefix = `${uid}:`;
    const now = Date.now();
    const result: Array<Omit<DeviceSession, 'accessToken'>> = [];

    for (const [key, session] of this.sessions.entries()) {
      if (key.startsWith(prefix)) {
        if (now <= session.expiresAt) {
          const { accessToken, ...safeData } = session;
          result.push(safeData);
        } else {
          this.sessions.delete(key);
        }
      }
    }
    return result;
  }

  public revokeDeviceSession(uid: string, deviceId: string): boolean {
    return this.sessions.delete(this.getKey(uid, deviceId));
  }

  public revokeAllUserSessions(uid: string): void {
    const prefix = `${uid}:`;
    for (const key of this.sessions.keys()) {
      if (key.startsWith(prefix)) {
        this.sessions.delete(key);
      }
    }
  }

  // Sync operations
  public getOrCreateSyncDoc(uid: string): UserStateSyncDocument {
    let doc = this.userSyncDocs.get(uid);
    if (!doc) {
      doc = {
        uid,
        classifications: {},
        preferences: {},
        chatConversations: [],
        auditLogs: [],
        lastUpdated: Date.now(),
      };
      this.userSyncDocs.set(uid, doc);
    }
    return doc;
  }

  public applyIncrementalPush(uid: string, updates: Partial<UserStateSyncDocument>): UserStateSyncDocument {
    const doc = this.getOrCreateSyncDoc(uid);
    if (updates.classifications) {
      doc.classifications = { ...doc.classifications, ...updates.classifications };
    }
    if (updates.preferences) {
      doc.preferences = { ...doc.preferences, ...updates.preferences };
    }
    if (Array.isArray(updates.chatConversations)) {
      doc.chatConversations = updates.chatConversations;
    }
    if (Array.isArray(updates.auditLogs)) {
      doc.auditLogs = [...updates.auditLogs, ...doc.auditLogs].slice(0, 200);
    }
    doc.lastUpdated = Date.now();
    return doc;
  }
}

export const durableSessionStore = new DurableSessionStore();
