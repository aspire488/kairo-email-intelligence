import React, { useState, useEffect } from 'react';
import {
  Search,
  Reply,
  Sliders,
  Archive,
  Paperclip,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react';
import { EmailMessage } from '../types/index.ts';

interface PriorityInboxViewProps {
  emails: EmailMessage[];
  onSelectEmail: (email: EmailMessage) => void;
  onOpenReply: (email: EmailMessage) => void;
  onOpenCorrection: (email: EmailMessage) => void;
  onArchiveEmail?: (email: EmailMessage) => void;
}

export const PriorityInboxView: React.FC<PriorityInboxViewProps> = ({
  emails,
  onSelectEmail,
  onOpenReply,
  onOpenCorrection,
  onArchiveEmail,
}) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'important' | 'action_required' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter to P0 & P1 priority emails
  const priorityEmails = emails.filter((e) => {
    const pri = e.classification?.priority;
    return pri === 0 || pri === 1;
  });

  const filteredEmails = priorityEmails.filter((e) => {
    if (filter === 'critical' && e.classification?.priority !== 0) return false;
    if (filter === 'important' && e.classification?.priority !== 1) return false;
    if (filter === 'action_required' && !e.classification?.action_required) return false;
    if (filter === 'unread' && !e.isUnread) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        e.subject.toLowerCase().includes(q) ||
        e.from.toLowerCase().includes(q) ||
        e.snippet.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Selected email state for split pane (default to first email if available)
  const [activeEmailId, setActiveEmailId] = useState<string | null>(
    filteredEmails[0]?.id || null
  );

  // Keep selection in sync when filtered items change
  useEffect(() => {
    if (!filteredEmails.some((e) => e.id === activeEmailId)) {
      setActiveEmailId(filteredEmails[0]?.id || null);
    }
  }, [filter, searchQuery, filteredEmails, activeEmailId]);

  const activeEmail = emails.find((e) => e.id === activeEmailId) || filteredEmails[0] || null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Editorial Header */}
      <div className="border-b border-[var(--color-border)] pb-5 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <span className="font-mono-tech text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
              Curation Docket
            </span>
            <h1 className="font-editorial text-4xl text-[var(--color-text-primary)] font-normal mt-0.5">
              Priority Inbox
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono-tech text-[var(--color-text-secondary)]">
            <span>{filteredEmails.length} messages</span>
            <span>·</span>
            <span>{priorityEmails.filter((e) => e.isUnread).length} unread</span>
          </div>
        </div>

        {/* Filter controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-5">
          {/* Segmented Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs transition-colors ${
                filter === 'all'
                  ? 'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] font-medium shadow-xs'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              All Priority ({priorityEmails.length})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-3 py-1 text-xs transition-colors ${
                filter === 'critical'
                  ? 'bg-[var(--color-surface-elevated)] text-[var(--color-oxide)] font-medium shadow-xs'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setFilter('important')}
              className={`px-3 py-1 text-xs transition-colors ${
                filter === 'important'
                  ? 'bg-[var(--color-surface-elevated)] text-[var(--color-forest)] font-medium shadow-xs'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Important
            </button>
            <button
              onClick={() => setFilter('action_required')}
              className={`px-3 py-1 text-xs transition-colors ${
                filter === 'action_required'
                  ? 'bg-[var(--color-surface-elevated)] text-[var(--color-brass)] font-medium shadow-xs'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Action Required
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-xs transition-colors ${
                filter === 'unread'
                  ? 'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] font-medium shadow-xs'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Unread
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter priority..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--color-surface-main)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-forest)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
            />
          </div>
        </div>
      </div>

      {/* Split-Pane Layout */}
      {filteredEmails.length === 0 ? (
        <div className="p-12 text-center bg-[var(--color-surface-main)] border border-[var(--color-border)]">
          <p className="font-editorial text-2xl text-[var(--color-text-primary)]">
            No communications meet this criterion.
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">
            Your high-priority communication docket is currently clear.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 border border-[var(--color-border)] bg-[var(--color-surface-main)] min-h-[680px]">
          {/* LEFT PANE: Message List (5 cols on lg) */}
          <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[var(--color-border)] flex flex-col h-[700px] overflow-y-auto divide-y divide-[var(--color-border)]">
            {filteredEmails.map((email) => {
              const isSelected = activeEmail?.id === email.id;
              const isCritical = email.classification?.priority === 0;

              return (
                <div
                  key={email.id}
                  onClick={() => {
                    setActiveEmailId(email.id);
                    onSelectEmail(email);
                  }}
                  className={`p-4 cursor-pointer transition-colors relative text-left ${
                    isSelected
                      ? 'bg-[var(--color-surface-secondary)]/80'
                      : 'hover:bg-[var(--color-surface-hover)]'
                  }`}
                >
                  {/* Active Indicator Bar */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-forest)]" />
                  )}

                  <div className="flex items-baseline justify-between gap-2 text-xs mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {email.isUnread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-oxide)] shrink-0" />
                      )}
                      <span className="font-medium text-[var(--color-text-primary)] truncate">
                        {email.fromName}
                      </span>
                    </div>

                    <span className="font-mono-tech text-[10px] text-[var(--color-text-secondary)] shrink-0">
                      {new Date(email.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`font-mono-tech text-[10px] ${
                        isCritical ? 'text-[var(--color-oxide)] font-semibold' : 'text-[var(--color-forest)] font-medium'
                      }`}
                    >
                      {isCritical ? 'CRITICAL' : 'IMPORTANT'}
                    </span>
                    {email.classification?.action_required && (
                      <>
                        <span className="text-[var(--color-border)] text-xs">·</span>
                        <span className="font-mono-tech text-[10px] text-[var(--color-brass)]">
                          ACTION REQ
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="text-xs font-medium text-[var(--color-text-primary)] line-clamp-1 mb-1">
                    {email.subject}
                  </h3>

                  <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                    {email.snippet}
                  </p>
                </div>
              );
            })}
          </div>

          {/* RIGHT PANE: Conversation Reading Panel (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col h-[700px] overflow-y-auto bg-[var(--color-surface-main)]">
            {activeEmail ? (
              <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col">
                {/* Panel Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--color-border)] text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono-tech text-xs font-semibold px-2 py-0.5 ${
                        activeEmail.classification?.priority === 0
                          ? 'bg-[var(--color-oxide)]/10 text-[var(--color-oxide)]'
                          : 'bg-[var(--color-forest)]/10 text-[var(--color-forest)]'
                      }`}
                    >
                      PRIORITY {activeEmail.classification?.priority} — {activeEmail.classification?.category}
                    </span>
                    {activeEmail.classification?.action_required && (
                      <span className="font-mono-tech text-xs px-2 py-0.5 bg-[var(--color-brass)]/10 text-[var(--color-brass)]">
                        ACTION REQUIRED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenReply(activeEmail)}
                      className="px-3 py-1 bg-[var(--color-forest)] text-[var(--color-canvas)] text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>Draft Reply</span>
                    </button>
                    {onArchiveEmail && (
                      <button
                        onClick={() => onArchiveEmail(activeEmail)}
                        title="Archive from Priority Inbox"
                        className="px-2.5 py-1 text-xs border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Archive</span>
                      </button>
                    )}
                    <button
                      onClick={() => onOpenCorrection(activeEmail)}
                      title="Adjust AI Classification"
                      className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Email Subject Heading */}
                <div>
                  <h2 className="font-editorial text-2xl sm:text-3xl text-[var(--color-text-primary)] font-normal leading-snug">
                    {activeEmail.subject}
                  </h2>

                  {/* Sender & Metadata Strip */}
                  <div className="mt-3 pt-3 border-t border-[var(--color-border)]/60 text-xs text-[var(--color-text-secondary)] flex flex-wrap items-baseline justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="text-[var(--color-text-primary)] font-medium">
                        {activeEmail.from}
                      </p>
                      <p className="font-mono-tech text-[11px] text-[var(--color-text-tertiary)]">
                        To: {activeEmail.to}
                      </p>
                    </div>

                    <div className="font-mono-tech text-[11px] text-right">
                      {new Date(activeEmail.date).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </div>
                  </div>
                </div>

                {/* AI Intelligence Briefing / Synthesis Card */}
                {activeEmail.classification && (
                  <div className="p-4 bg-[var(--color-surface-secondary)]/60 border border-[var(--color-border)] text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono-tech uppercase tracking-wider text-[var(--color-text-secondary)]">
                        KAIRO Intelligence Assessment
                      </span>
                      <span className="font-mono-tech text-[var(--color-forest)]">
                        {Math.round(activeEmail.classification.confidence * 100)}% Confidence
                      </span>
                    </div>

                    {activeEmail.classification.key_takeaway && (
                      <p className="text-[var(--color-text-primary)] font-medium leading-relaxed">
                        {activeEmail.classification.key_takeaway}
                      </p>
                    )}

                    <p className="text-[var(--color-text-secondary)] leading-relaxed">
                      {activeEmail.classification.reason}
                    </p>

                    {activeEmail.classification.action && (
                      <div className="pt-2 border-t border-[var(--color-border)]/50 flex items-center gap-2 text-[var(--color-oxide)] font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Recommended: {activeEmail.classification.action}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Email Body Content */}
                <div className="flex-1 py-2">
                  <div className="prose prose-sm max-w-none text-[var(--color-text-primary)] font-sans leading-relaxed whitespace-pre-wrap font-normal text-sm">
                    {activeEmail.bodyText || activeEmail.snippet}
                  </div>
                </div>

                {/* Attachments Section if present */}
                {activeEmail.hasAttachments && (
                  <div className="pt-4 border-t border-[var(--color-border)]">
                    <div className="flex items-center gap-2 text-xs font-mono-tech text-[var(--color-text-secondary)]">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>1 or more attachments included in thread</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="m-auto text-center p-8 text-[var(--color-text-secondary)]">
                <p className="font-editorial text-xl italic text-[var(--color-text-primary)]">
                  Select correspondence from the list to review.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
