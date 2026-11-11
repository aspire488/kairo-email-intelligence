import React from 'react';
import {
  Sparkles,
  RefreshCw,
  ArrowRight,
  GitPullRequest,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
  AlertCircle,
  Inbox,
  Calendar,
  ChevronRight,
  BookmarkCheck,
} from 'lucide-react';
import { EmailMessage, ExecutiveBriefing, OSSContributionItem } from '../types/index.ts';

interface OverviewViewProps {
  emails: EmailMessage[];
  ossItems: OSSContributionItem[];
  briefing: ExecutiveBriefing | null;
  isGeneratingBriefing: boolean;
  onRefreshBriefing: () => void;
  onSelectEmail: (email: EmailMessage) => void;
  onNavigateTab: (tab: string) => void;
  dryRunMode: boolean;
  isDemoMode: boolean;
  onSync: () => void;
  isSyncing: boolean;
  userName?: string;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  emails,
  ossItems,
  briefing,
  isGeneratingBriefing,
  onRefreshBriefing,
  onSelectEmail,
  onNavigateTab,
  dryRunMode,
  isDemoMode,
  onSync,
  isSyncing,
  userName = 'Joel',
}) => {
  // Priority communications
  const criticalEmails = emails.filter((e) => e.classification?.priority === 0);
  const importantEmails = emails.filter((e) => e.classification?.priority === 1);
  const priorityEmails = [...criticalEmails, ...importantEmails];

  // Action items
  const actionEmails = emails.filter((e) => e.classification?.action_required);

  // Recent conversations (non-promotional)
  const recentEmails = emails.filter(
    (e) => e.classification?.category !== 'PROMOTION' && e.classification?.category !== 'NEWSLETTER'
  ).slice(0, 5);

  // Active OSS items with action needed
  const activeOssItems = ossItems.filter((i) => i.ossStatus === 'ACTION_REQUIRED');

  // Quiet metrics calculation
  const totalEmails = emails.length;
  const filteredNoiseCount = emails.filter(
    (e) => (e.classification?.priority ?? 3) >= 3
  ).length;

  return (
    <div className="space-y-12 max-w-6xl mx-auto pb-16">
      {/* Editorial Page Header */}
      <header className="border-b border-[var(--color-border)] pb-8 pt-2">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
          <div>
            <h1 className="font-editorial text-4xl sm:text-5xl text-[var(--color-text-primary)] font-normal tracking-tight">
              Your correspondence, considered.
            </h1>
            <p className="font-sans text-[var(--color-text-secondary)] text-base mt-2">
              An overview of what deserves your attention.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isDemoMode && (
              <span className="font-mono-tech text-xs px-2.5 py-1 bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                Archive Sandbox
              </span>
            )}
            {dryRunMode && (
              <span className="font-mono-tech text-xs px-2.5 py-1 bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                Dry-run Active
              </span>
            )}
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="px-3.5 py-1.5 text-xs font-medium bg-[var(--color-forest)] text-[var(--color-canvas)] hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Reviewing...' : 'Sync Inbox'}</span>
            </button>
          </div>
        </div>

        {/* Quiet Editorial Ledger Bar */}
        <div className="flex flex-wrap items-center gap-6 mt-6 pt-4 border-t border-[var(--color-border)]/60 text-xs text-[var(--color-text-secondary)]">
          <div>
            <span className="font-mono-tech text-[var(--color-text-primary)] font-medium mr-1.5">
              {priorityEmails.length}
            </span>
            Priority Items
          </div>
          <span className="text-[var(--color-border)]">/</span>
          <div>
            <span className="font-mono-tech text-[var(--color-oxide)] font-medium mr-1.5">
              {actionEmails.length}
            </span>
            Pending Actions
          </div>
          <span className="text-[var(--color-border)]">/</span>
          <div>
            <span className="font-mono-tech text-[var(--color-text-primary)] font-medium mr-1.5">
              {activeOssItems.length}
            </span>
            OSS Threads Awaiting You
          </div>
          <span className="text-[var(--color-border)]">/</span>
          <div>
            <span className="font-mono-tech text-[var(--color-text-secondary)] mr-1.5">
              {filteredNoiseCount} of {totalEmails}
            </span>
            Communications Archived
          </div>
        </div>
      </header>

      {/* Two-Column Editorial Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* LEFT COLUMN: Important Communications, Pending Actions, Recent Conversations */}
        <div className="lg:col-span-7 space-y-12">
          {/* Section 1: Important Communications */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-[var(--color-border)] pb-2.5">
              <h2 className="font-editorial text-2xl text-[var(--color-text-primary)] font-normal">
                Important Communications
              </h2>
              <button
                onClick={() => onNavigateTab('priority')}
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1"
              >
                <span>View priority inbox</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {priorityEmails.length === 0 ? (
              <div className="p-8 text-center bg-[var(--color-surface-main)] border border-[var(--color-border)]">
                <p className="font-editorial text-lg text-[var(--color-text-primary)] italic">
                  No urgent correspondence pending.
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  All critical personal, academic, and career matters have been addressed.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] bg-[var(--color-surface-main)]">
                {priorityEmails.slice(0, 4).map((email) => {
                  const isCritical = email.classification?.priority === 0;
                  return (
                    <div
                      key={email.id}
                      onClick={() => onSelectEmail(email)}
                      className="p-5 hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors group"
                    >
                      <div className="flex items-baseline justify-between gap-3 text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono-tech text-[11px] ${
                              isCritical ? 'text-[var(--color-oxide)] font-semibold' : 'text-[var(--color-forest)]'
                            }`}
                          >
                            {isCritical ? 'CRITICAL' : 'IMPORTANT'}
                          </span>
                          <span className="text-[var(--color-border)]">·</span>
                          <span className="font-medium text-[var(--color-text-primary)] truncate max-w-[200px]">
                            {email.fromName}
                          </span>
                        </div>
                        <span className="font-mono-tech text-[11px] text-[var(--color-text-secondary)] shrink-0">
                          {new Date(email.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <h3 className="font-medium text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-forest)] dark:group-hover:text-[var(--color-forest)] transition-colors line-clamp-1">
                        {email.subject}
                      </h3>

                      {email.classification?.key_takeaway ? (
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 line-clamp-2 leading-relaxed">
                          {email.classification.key_takeaway}
                        </p>
                      ) : (
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 line-clamp-2 leading-relaxed">
                          {email.snippet}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section 2: Pending Actions */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-[var(--color-border)] pb-2.5">
              <h2 className="font-editorial text-2xl text-[var(--color-text-primary)] font-normal">
                Pending Actions
              </h2>
              <span className="font-mono-tech text-xs text-[var(--color-text-secondary)]">
                {actionEmails.length} items requiring decisions
              </span>
            </div>

            {actionEmails.length === 0 ? (
              <div className="p-6 bg-[var(--color-surface-main)] border border-[var(--color-border)] text-center">
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Zero pending actions. Inbox operations are current.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {actionEmails.slice(0, 4).map((email) => (
                  <div
                    key={email.id}
                    onClick={() => onSelectEmail(email)}
                    className="p-4 bg-[var(--color-surface-main)] border border-[var(--color-border)] hover:border-[var(--color-forest)] cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono-tech text-[11px] text-[var(--color-oxide)] font-medium">
                            ACTION REQUIRED
                          </span>
                          <span className="text-[var(--color-border)]">·</span>
                          <span className="text-[var(--color-text-secondary)]">
                            {email.fromName}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-[var(--color-text-primary)]">
                          {email.classification?.action || email.subject}
                        </p>
                      </div>

                      <span className="text-xs font-mono-tech text-[var(--color-forest)] shrink-0 group-hover:underline">
                        Review →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 3: Recent Conversations */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-[var(--color-border)] pb-2.5">
              <h2 className="font-editorial text-2xl text-[var(--color-text-primary)] font-normal">
                Recent Conversations
              </h2>
              <button
                onClick={() => onNavigateTab('all')}
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                All communications →
              </button>
            </div>

            <div className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] bg-[var(--color-surface-main)]">
              {recentEmails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => onSelectEmail(email)}
                  className="p-4 hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors flex items-center justify-between gap-4 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-[var(--color-text-primary)] truncate">
                        {email.fromName}
                      </span>
                      <span className="text-[var(--color-border)]">·</span>
                      <span className="text-[var(--color-text-secondary)] truncate">
                        {email.classification?.category || 'DIRECT'}
                      </span>
                    </div>
                    <p className="text-[var(--color-text-secondary)] truncate">
                      {email.subject}
                    </p>
                  </div>

                  <span className="font-mono-tech text-[11px] text-[var(--color-text-secondary)] shrink-0">
                    {new Date(email.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Daily Intelligence Briefing, OSS Activity, Upcoming Milestones */}
        <div className="lg:col-span-5 space-y-10">
          {/* Daily Intelligence Briefing */}
          <section className="bg-[var(--color-surface-main)] border border-[var(--color-border)] p-6 space-y-5">
            <div className="flex items-baseline justify-between border-b border-[var(--color-border)] pb-3">
              <div>
                <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Intelligence Dispatch
                </span>
                <h2 className="font-editorial text-2xl text-[var(--color-text-primary)] font-normal mt-0.5">
                  Daily Briefing
                </h2>
              </div>
              <button
                onClick={onRefreshBriefing}
                disabled={isGeneratingBriefing}
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isGeneratingBriefing ? 'animate-spin' : ''}`} />
                <span>{isGeneratingBriefing ? 'Synthesizing...' : 'Re-synthesize'}</span>
              </button>
            </div>

            {briefing ? (
              <div className="space-y-4">
                <p className="font-editorial text-lg text-[var(--color-text-primary)] italic leading-relaxed">
                  &ldquo;{briefing.headline}&rdquo;
                </p>

                {briefing.importantUpdates && briefing.importantUpdates.length > 0 && (
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {briefing.importantUpdates[0]?.detail || 'High-priority synthesis ready.'}
                  </p>
                )}

                {briefing.recommendedActions && briefing.recommendedActions.length > 0 && (
                  <div className="pt-3 border-t border-[var(--color-border)] space-y-2">
                    <span className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--color-text-primary)]">
                      Recommended Directives
                    </span>
                    <ul className="space-y-2 text-xs text-[var(--color-text-secondary)]">
                      {briefing.recommendedActions.map((action: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 leading-relaxed">
                          <span className="font-mono-tech text-[var(--color-forest)] text-xs mt-0.5">
                            {(idx + 1).toString().padStart(2, '0')}.
                          </span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Briefing has not yet been synthesized for this session.
                </p>
                <button
                  onClick={onRefreshBriefing}
                  className="px-3 py-1.5 text-xs bg-[var(--color-forest)] text-[var(--color-canvas)] font-medium"
                >
                  Generate Daily Briefing
                </button>
              </div>
            )}
          </section>

          {/* OSS Activity Timeline */}
          <section className="bg-[var(--color-surface-main)] border border-[var(--color-border)] p-6 space-y-4">
            <div className="flex items-baseline justify-between border-b border-[var(--color-border)] pb-3">
              <div>
                <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Contribution Ledger
                </span>
                <h2 className="font-editorial text-2xl text-[var(--color-text-primary)] font-normal mt-0.5">
                  OSS Activity
                </h2>
              </div>
              <button
                onClick={() => onNavigateTab('oss')}
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                Ledger →
              </button>
            </div>

            {ossItems.length === 0 ? (
              <p className="text-xs text-[var(--color-text-secondary)] py-4 text-center">
                No recent open-source activity detected.
              </p>
            ) : (
              <div className="space-y-3">
                {ossItems.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.relatedEmails[0]) onSelectEmail(item.relatedEmails[0]);
                    }}
                    className="p-3 bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)] hover:border-[var(--color-forest)] cursor-pointer transition-colors text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-mono-tech text-[11px]">
                      <span className="text-[var(--color-text-primary)] font-medium truncate max-w-[200px]">
                        {item.repository} #{item.prNumber}
                      </span>
                      <span
                        className={
                          item.ciStatus === 'failing'
                            ? 'text-[var(--color-oxide)] font-semibold'
                            : item.state === 'merged'
                            ? 'text-[var(--color-forest)] font-semibold'
                            : 'text-[var(--color-text-secondary)]'
                        }
                      >
                        {item.ciStatus === 'failing'
                          ? 'CI FAILING'
                          : item.state === 'merged'
                          ? 'MERGED'
                          : item.ossStatus.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="font-sans text-[var(--color-text-secondary)] line-clamp-1">
                      {item.title}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Upcoming Deadlines & Time-Sensitive Milestones */}
          <section className="bg-[var(--color-surface-main)] border border-[var(--color-border)] p-6 space-y-4">
            <div className="border-b border-[var(--color-border)] pb-3">
              <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">
                Chronology
              </span>
              <h2 className="font-editorial text-2xl text-[var(--color-text-primary)] font-normal mt-0.5">
                Upcoming Milestones
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 border-l-2 border-[var(--color-oxide)] bg-[var(--color-surface-secondary)]/40 space-y-1">
                <div className="flex items-center justify-between font-mono-tech text-[11px]">
                  <span className="text-[var(--color-oxide)] font-medium">TOMORROW 11:00 AM PT</span>
                  <span className="text-[var(--color-text-secondary)]">Cloudflare</span>
                </div>
                <p className="font-medium text-[var(--color-text-primary)]">
                  Live Walkthrough: Zero-Trust Network Architectures
                </p>
              </div>

              <div className="p-3 border-l-2 border-[var(--color-forest)] bg-[var(--color-surface-secondary)]/40 space-y-1">
                <div className="flex items-center justify-between font-mono-tech text-[11px]">
                  <span className="text-[var(--color-forest)] font-medium">MAY 15 DEADLINE</span>
                  <span className="text-[var(--color-text-secondary)]">CS 4720</span>
                </div>
                <p className="font-medium text-[var(--color-text-primary)]">
                  Capstone Presentation & Raft Consensus Deliverables
                </p>
              </div>

              <div className="p-3 border-l-2 border-[var(--color-brass)] bg-[var(--color-surface-secondary)]/40 space-y-1">
                <div className="flex items-center justify-between font-mono-tech text-[11px]">
                  <span className="text-[var(--color-brass)] font-medium">NEXT TUESDAY</span>
                  <span className="text-[var(--color-text-secondary)]">Anthropic</span>
                </div>
                <p className="font-medium text-[var(--color-text-primary)]">
                  Technical Screen: Systems & Infrastructure Internship
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
