import React from 'react';
import { WifiOff, RefreshCw, Clock } from 'lucide-react';

interface OfflineSyncBannerProps {
  isOnline: boolean;
  lastSyncedTimestamp: number | null;
  pendingQueueCount: number;
  onManualSync: () => void;
  isSyncing: boolean;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({
  isOnline,
  lastSyncedTimestamp,
  pendingQueueCount,
  onManualSync,
  isSyncing,
}) => {
  if (isOnline && pendingQueueCount === 0) return null;

  return (
    <div
      className={`px-4 py-2.5 border-b text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors ${
        !isOnline
          ? 'bg-[var(--color-surface-secondary)] border-[var(--color-brass)]/50 text-[var(--color-text-primary)]'
          : 'bg-[var(--color-surface-secondary)] border-[var(--color-forest)]/30 text-[var(--color-forest)]'
      }`}
    >
      <div className="flex items-center gap-2 font-mono-tech">
        {!isOnline ? (
          <WifiOff className="w-4 h-4 text-[var(--color-brass)] shrink-0" />
        ) : (
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''} shrink-0`} />
        )}
        <span>
          {!isOnline ? 'Offline Mode · Cached View' : 'Pending Operations Syncing'}
          {lastSyncedTimestamp && (
            <span className="text-[var(--color-text-secondary)] ml-2">
              (Synced: {new Date(lastSyncedTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
            </span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {pendingQueueCount > 0 && (
          <span className="px-1.5 py-0.5 bg-[var(--color-brass)]/20 text-[var(--color-brass)] font-mono-tech text-[10px] rounded">
            {pendingQueueCount} queued {pendingQueueCount === 1 ? 'action' : 'actions'}
          </span>
        )}

        <button
          onClick={onManualSync}
          disabled={!isOnline || isSyncing}
          className="px-2.5 py-1 text-[11px] font-mono-tech bg-[var(--color-surface-main)] border border-[var(--color-border)] hover:border-[var(--color-forest)] disabled:opacity-40 flex items-center gap-1.5"
        >
          <Clock className="w-3 h-3" />
          <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      </div>
    </div>
  );
};
