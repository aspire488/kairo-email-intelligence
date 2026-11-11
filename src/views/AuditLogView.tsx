import React from 'react';
import { History, Tag, Archive, FileEdit, Send, Sliders } from 'lucide-react';
import { AuditLogEntry } from '../types/index.ts';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
  onClearLogs: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs, onClearLogs }) => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Editorial Header */}
      <header className="border-b border-[var(--color-border)] pb-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <span className="font-mono-tech text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
              Immutability Audit
            </span>
            <h1 className="font-editorial text-4xl text-[var(--color-text-primary)] font-normal mt-0.5">
              Operations History
            </h1>
            <p className="font-sans text-[var(--color-text-secondary)] text-sm mt-1 max-w-2xl">
              Chronological ledger of non-destructive operations, label applications, and dry-run simulations.
            </p>
          </div>

          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-forest)] transition-colors"
            >
              Reset Audit Ledger
            </button>
          )}
        </div>
      </header>

      {/* Log list */}
      <div className="bg-[var(--color-surface-main)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
        {logs.length > 0 ? (
          logs.map((entry) => (
            <div
              key={entry.id}
              className="p-4 hover:bg-[var(--color-surface-hover)] transition-colors flex items-start justify-between gap-4 text-xs"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono-tech text-[10px] text-[var(--color-forest)] font-medium">
                    {entry.actionType}
                  </span>
                  {entry.status === 'preview' && (
                    <span className="font-mono-tech text-[10px] text-[var(--color-brass)] font-medium">
                      [SIMULATED]
                    </span>
                  )}
                  <span className="text-[var(--color-border)]">·</span>
                  <span className="font-mono-tech text-[11px] text-[var(--color-text-secondary)]">
                    {new Date(entry.timestamp).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                <p className="font-medium text-[var(--color-text-primary)]">
                  {entry.description}
                </p>

                {entry.details && Object.keys(entry.details).length > 0 && (
                  <p className="font-mono-tech text-[11px] text-[var(--color-text-secondary)] truncate">
                    {JSON.stringify(entry.details)}
                  </p>
                )}
              </div>

              <span className="font-mono-tech text-[11px] text-[var(--color-text-secondary)] shrink-0">
                {new Date(entry.timestamp).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-[var(--color-text-secondary)]">
            <p className="font-editorial text-xl italic text-[var(--color-text-primary)]">
              No operations recorded in this session.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
