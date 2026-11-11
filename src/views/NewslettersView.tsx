import React from 'react';
import { Archive, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { EmailMessage } from '../types/index.ts';

interface NewslettersViewProps {
  emails: EmailMessage[];
  onSelectEmail: (email: EmailMessage) => void;
  onBatchArchive: (emailIds: string[]) => void;
  dryRunMode: boolean;
}

export const NewslettersView: React.FC<NewslettersViewProps> = ({
  emails,
  onSelectEmail,
  onBatchArchive,
  dryRunMode,
}) => {
  const noiseEmails = emails.filter((e) => {
    const cat = e.classification?.category;
    const pri = e.classification?.priority;
    return cat === 'NEWSLETTER' || cat === 'PROMOTION' || pri === 4;
  });

  const senderMap: Record<string, { count: number; name: string; ids: string[] }> = {};
  noiseEmails.forEach((e) => {
    if (!senderMap[e.fromAddress]) {
      senderMap[e.fromAddress] = { count: 0, name: e.fromName, ids: [] };
    }
    senderMap[e.fromAddress].count++;
    senderMap[e.fromAddress].ids.push(e.id);
  });

  const sortedSenders = Object.entries(senderMap).sort((a, b) => b[1].count - a[1].count);

  const handleArchiveAllNoise = () => {
    const ids = noiseEmails.map((e) => e.id);
    onBatchArchive(ids);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Editorial Header */}
      <header className="border-b border-[var(--color-border)] pb-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <span className="font-mono-tech text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
              Low-Priority Correspondence
            </span>
            <h1 className="font-editorial text-4xl text-[var(--color-text-primary)] font-normal mt-0.5">
              Archive & Newsletters
            </h1>
            <p className="font-sans text-[var(--color-text-secondary)] text-sm mt-1 max-w-2xl">
              Scheduled digests, product updates, and promotional distributions isolated from your primary reading queue.
            </p>
          </div>

          {noiseEmails.length > 0 && (
            <button
              onClick={handleArchiveAllNoise}
              className="px-3.5 py-1.5 text-xs font-medium bg-[var(--color-forest)] text-[var(--color-canvas)] hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>
                {dryRunMode ? 'Simulate Archiving' : 'Archive All Filtered'} ({noiseEmails.length})
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Top Senders Section */}
      {sortedSenders.length > 0 && (
        <section className="bg-[var(--color-surface-main)] border border-[var(--color-border)] p-6 space-y-4">
          <span className="font-mono-tech text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
            High-Volume Senders
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sortedSenders.slice(0, 6).map(([address, data]) => (
              <div
                key={address}
                className="p-3 bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)] flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-medium text-[var(--color-text-primary)] truncate">
                    {data.name}
                  </p>
                  <p className="font-mono-tech text-[10px] text-[var(--color-text-secondary)] truncate">
                    {address}
                  </p>
                </div>
                <button
                  onClick={() => onBatchArchive(data.ids)}
                  className="px-2 py-1 text-[11px] font-mono-tech bg-[var(--color-surface-main)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-forest)] transition-colors shrink-0"
                >
                  Archive ({data.count})
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Noise Emails List */}
      <div className="bg-[var(--color-surface-main)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
        {noiseEmails.length > 0 ? (
          noiseEmails.map((email) => (
            <div
              key={email.id}
              onClick={() => onSelectEmail(email)}
              className="p-4 hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors flex items-center justify-between gap-4 text-xs group"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono-tech text-[10px] text-[var(--color-text-secondary)]">
                    {email.classification?.category || 'PROMOTION'}
                  </span>
                  <span className="text-[var(--color-border)]">·</span>
                  <span className="font-medium text-[var(--color-text-primary)] truncate">
                    {email.fromName}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-primary)] truncate font-medium">
                  {email.subject}
                </p>
                <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-1">
                  {email.snippet}
                </p>
              </div>

              <span className="font-mono-tech text-[11px] text-[var(--color-text-secondary)] shrink-0">
                {new Date(email.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-[var(--color-text-secondary)]">
            <p className="font-editorial text-xl italic text-[var(--color-text-primary)]">
              No low-priority newsletters or clutter found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
