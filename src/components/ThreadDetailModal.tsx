import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Archive,
  Tag,
  Reply,
  Sliders,
  AlertCircle,
  GitPullRequest,
  CheckCircle2,
  Clock,
  Shield,
} from 'lucide-react';
import { EmailMessage, PriorityLevel } from '../types/index.ts';
import { KAIRO_STANDARD_LABELS } from '../lib/gmail.ts';

interface ThreadDetailModalProps {
  email: EmailMessage | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReply: (email: EmailMessage) => void;
  onOpenCorrection: (email: EmailMessage) => void;
  onArchive: (email: EmailMessage) => void;
  onApplyLabel: (email: EmailMessage, labelName: string) => void;
}

export const ThreadDetailModal: React.FC<ThreadDetailModalProps> = ({
  email,
  isOpen,
  onClose,
  onOpenReply,
  onOpenCorrection,
  onArchive,
  onApplyLabel,
}) => {
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);

  if (!isOpen || !email) return null;

  const classification = email.classification;
  const priority = (classification?.priority ?? 1) as PriorityLevel;

  const openGmail = () => {
    window.open(`https://mail.google.com/mail/u/0/#inbox/${email.threadId}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-[var(--color-surface-main)] border border-[var(--color-border)] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50">
          <div className="flex items-center gap-3">
            <span
              className={`font-mono-tech text-xs font-semibold ${
                priority === 0 ? 'text-[var(--color-oxide)]' : 'text-[var(--color-forest)]'
              }`}
            >
              PRIORITY {priority} · {classification?.category || 'DIRECT'}
            </span>
            <span className="text-[var(--color-border)]">·</span>
            <span className="font-mono-tech text-xs text-[var(--color-text-secondary)]">
              {Math.round((classification?.confidence ?? 0.88) * 100)}% Confidence
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openGmail}
              className="px-2.5 py-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] flex items-center gap-1.5 transition-colors"
              title="Open conversation in Gmail"
            >
              <span>Open in Gmail</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={onClose}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-main)] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenReply(email)}
              className="px-3 py-1.5 bg-[var(--color-forest)] text-[var(--color-canvas)] font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <Reply className="w-3.5 h-3.5" />
              <span>Draft Reply</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowLabelDropdown(!showLabelDropdown)}
                className="px-3 py-1.5 border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-forest)] flex items-center gap-1.5 transition-colors"
              >
                <Tag className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                <span>Apply Label</span>
              </button>

              {showLabelDropdown && (
                <div className="absolute left-0 mt-1 w-56 bg-[var(--color-surface-main)] border border-[var(--color-border)] shadow-xl py-1 z-30 max-h-60 overflow-y-auto">
                  <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)] font-mono-tech">
                    KAIRO Label Taxonomy
                  </div>
                  {KAIRO_STANDARD_LABELS.map((lbl) => (
                    <button
                      key={lbl}
                      onClick={() => {
                        onApplyLabel(email, lbl);
                        setShowLabelDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] font-mono-tech truncate"
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => onArchive(email)}
              className="px-3 py-1.5 border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-forest)] flex items-center gap-1.5 transition-colors"
            >
              <Archive className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
              <span>Archive</span>
            </button>
          </div>

          <button
            onClick={() => onOpenCorrection(email)}
            className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Recalibrate AI Classification</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Header Details */}
          <div>
            <h2 className="font-editorial text-2xl sm:text-3xl text-[var(--color-text-primary)] font-normal leading-snug">
              {email.subject}
            </h2>

            <div className="mt-3 pt-3 border-t border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] flex flex-wrap items-baseline justify-between gap-2">
              <div className="space-y-0.5">
                <p className="text-[var(--color-text-primary)] font-medium">
                  {email.from}
                </p>
                <p className="font-mono-tech text-[11px] text-[var(--color-text-secondary)]">
                  To: {email.to}
                </p>
              </div>

              <div className="font-mono-tech text-[11px]">
                {new Date(email.date).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </div>
            </div>
          </div>

          {/* AI Synthesis Box */}
          {classification && (
            <div className="p-4 bg-[var(--color-surface-secondary)]/60 border border-[var(--color-border)] text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono-tech">
                <span className="uppercase tracking-wider text-[var(--color-text-secondary)]">
                  KAIRO Assessment
                </span>
                <span className="text-[var(--color-forest)] font-medium">
                  Source: {classification.source}
                </span>
              </div>

              {classification.key_takeaway && (
                <p className="text-[var(--color-text-primary)] font-medium leading-relaxed">
                  {classification.key_takeaway}
                </p>
              )}

              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                {classification.reason}
              </p>

              {classification.action && (
                <div className="pt-2 border-t border-[var(--color-border)]/60 flex items-center gap-1.5 text-[var(--color-oxide)] font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Required Action: {classification.action}</span>
                </div>
              )}
            </div>
          )}

          {/* Email Body Text */}
          <div className="prose prose-sm max-w-none text-sm text-[var(--color-text-primary)] font-sans leading-relaxed whitespace-pre-wrap">
            {email.bodyText || email.snippet}
          </div>
        </div>
      </div>
    </div>
  );
};
