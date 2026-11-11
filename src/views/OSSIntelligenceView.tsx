import React, { useState } from 'react';
import {
  GitPullRequest,
  GitMerge,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Clock,
  Terminal,
} from 'lucide-react';
import { EmailMessage, OSSContributionItem } from '../types/index.ts';

interface OSSIntelligenceViewProps {
  ossItems: OSSContributionItem[];
  onSelectEmail: (email: EmailMessage) => void;
}

export const OSSIntelligenceView: React.FC<OSSIntelligenceViewProps> = ({
  ossItems,
  onSelectEmail,
}) => {
  const [filter, setFilter] = useState<string>('ALL');

  const filteredItems = ossItems.filter((item) => {
    if (filter === 'ALL') return true;
    if (filter === 'CHANGES_REQUESTED')
      return item.ossStatus === 'ACTION_REQUIRED' && item.ciStatus !== 'failing';
    if (filter === 'CI_FAILURES') return item.ciStatus === 'failing';
    if (filter === 'APPROVED') return item.ossStatus === 'PROGRESS' && item.state !== 'merged';
    if (filter === 'MERGED') return item.state === 'merged';
    if (filter === 'REVIEW_PENDING')
      return item.ossStatus === 'ACTION_REQUIRED' || item.title.toLowerCase().includes('review');
    return true;
  });

  const uniqueRepos = Array.from(new Set(ossItems.map((i) => i.repository)));

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Editorial Header */}
      <header className="border-b border-[var(--color-border)] pb-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <span className="font-mono-tech text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
              Contribution Activity Ledger
            </span>
            <h1 className="font-editorial text-4xl text-[var(--color-text-primary)] font-normal mt-0.5">
              Open Source Intelligence
            </h1>
            <p className="font-sans text-[var(--color-text-secondary)] text-sm mt-1.5 max-w-2xl">
              A chronological timeline of maintainer reviews, continuous integration telemetry, and pull request milestones consolidated from your inbox.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono-tech text-xs text-[var(--color-text-secondary)]">
            <span>{ossItems.length} active threads</span>
            <span>·</span>
            <span>{uniqueRepos.length} repositories</span>
          </div>
        </div>

        {/* Segmented Filter Control */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] mt-6">
          {[
            { id: 'ALL', label: `All Events (${ossItems.length})` },
            { id: 'CHANGES_REQUESTED', label: 'Changes Requested' },
            { id: 'REVIEW_PENDING', label: 'Review Pending' },
            { id: 'CI_FAILURES', label: 'CI Failures' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'MERGED', label: 'Merged' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1 text-xs transition-colors ${
                filter === tab.id
                  ? 'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] font-medium shadow-xs'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Ledger Content */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-[var(--color-surface-main)] border border-[var(--color-border)]">
          <p className="font-editorial text-2xl text-[var(--color-text-primary)]">
            No entries record for this criterion.
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">
            Your open-source contribution stream is clear of matching events.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const isFailingCI = item.ciStatus === 'failing';
            const isMerged = item.state === 'merged';
            const isActionReq = item.ossStatus === 'ACTION_REQUIRED';

            // Determine status badge label
            let statusLabel = 'INFORMATIONAL';
            let statusColor = 'text-[var(--color-text-secondary)]';

            if (isFailingCI) {
              statusLabel = 'CI FAILURE';
              statusColor = 'text-[var(--color-oxide)] font-semibold';
            } else if (isMerged) {
              statusLabel = 'MERGED';
              statusColor = 'text-[var(--color-forest)] font-semibold';
            } else if (item.ossStatus === 'PROGRESS') {
              statusLabel = 'CHANGES APPROVED';
              statusColor = 'text-[var(--color-forest)] font-medium';
            } else if (isActionReq) {
              statusLabel = 'ACTION REQUIRED';
              statusColor = 'text-[var(--color-oxide)] font-medium';
            }

            return (
              <div
                key={item.id}
                className="bg-[var(--color-surface-main)] border border-[var(--color-border)] p-5 hover:border-[var(--color-forest)]/60 transition-colors space-y-3"
              >
                {/* Event Ledger Row Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--color-border)]/60 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono-tech text-sm font-semibold text-[var(--color-text-primary)]">
                      {item.repository}
                    </span>
                    <span className="font-mono-tech text-xs text-[var(--color-text-secondary)]">
                      #{item.prNumber}
                    </span>
                    <span className="text-[var(--color-border)]">·</span>
                    <span className={`font-mono-tech text-xs ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono-tech text-[var(--color-text-secondary)]">
                    <span>
                      {new Date(item.latestUpdate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>·</span>
                    <span>{item.relatedEmails.length} notifications</span>
                  </div>
                </div>

                {/* PR Title and Description */}
                <div>
                  <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
                    {item.title}
                  </h3>
                  {item.nextRequiredAction && (
                    <p className="text-xs text-[var(--color-oxide)] mt-1.5 font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.nextRequiredAction}</span>
                    </p>
                  )}
                </div>

                {/* Underlying Email Thread Records */}
                <div className="pt-2 border-t border-[var(--color-border)]/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-[var(--color-text-secondary)] truncate max-w-md">
                    <span className="font-mono-tech text-[11px] text-[var(--color-text-tertiary)]">
                      Latest subject:
                    </span>
                    <span className="truncate">
                      {item.relatedEmails[0]?.subject || item.title}
                    </span>
                  </div>

                  {item.relatedEmails[0] && (
                    <button
                      onClick={() => onSelectEmail(item.relatedEmails[0])}
                      className="px-2.5 py-1 text-xs border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors flex items-center gap-1"
                    >
                      <span>Inspect Thread</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
