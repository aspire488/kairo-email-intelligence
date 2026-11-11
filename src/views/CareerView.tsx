import React from 'react';
import { Briefcase, AlertCircle, ExternalLink, Reply, ChevronRight } from 'lucide-react';
import { EmailMessage } from '../types/index.ts';

interface CareerViewProps {
  emails: EmailMessage[];
  onSelectEmail: (email: EmailMessage) => void;
  onOpenReply: (email: EmailMessage) => void;
}

export const CareerView: React.FC<CareerViewProps> = ({
  emails,
  onSelectEmail,
  onOpenReply,
}) => {
  const careerEmails = emails.filter((e) => e.classification?.category === 'CAREER');

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Editorial Header */}
      <header className="border-b border-[var(--color-border)] pb-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <span className="font-mono-tech text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
              Professional Opportunities
            </span>
            <h1 className="font-editorial text-4xl text-[var(--color-text-primary)] font-normal mt-0.5">
              Career & Recruitment
            </h1>
            <p className="font-sans text-[var(--color-text-secondary)] text-sm mt-1 max-w-2xl">
              Recruiter communications, technical interview invitations, and internship offers.
            </p>
          </div>

          <span className="font-mono-tech text-xs text-[var(--color-forest)] font-medium">
            {careerEmails.length} active opportunities
          </span>
        </div>
      </header>

      {/* List */}
      <div className="bg-[var(--color-surface-main)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
        {careerEmails.length > 0 ? (
          careerEmails.map((email) => (
            <div
              key={email.id}
              onClick={() => onSelectEmail(email)}
              className="p-5 hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4 group"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono-tech text-[11px] text-[var(--color-forest)] font-medium">
                    OPPORTUNITY
                  </span>
                  <span className="text-[var(--color-border)]">·</span>
                  <span className="font-medium text-[var(--color-text-primary)] truncate">
                    {email.fromName}
                  </span>
                  <span className="text-[var(--color-text-secondary)] font-mono-tech text-[11px] truncate">
                    &lt;{email.fromAddress}&gt;
                  </span>
                </div>

                <div className="text-sm font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-forest)] transition-colors truncate">
                  {email.subject}
                </div>

                <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                  {email.snippet}
                </p>

                {email.classification?.action && (
                  <div className="pt-1 flex items-center gap-1.5 text-xs text-[var(--color-oxide)] font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{email.classification.action}</span>
                  </div>
                )}
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0">
                <span className="font-mono-tech text-[11px] text-[var(--color-text-secondary)]">
                  {new Date(email.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenReply(email);
                  }}
                  className="px-3 py-1 bg-[var(--color-forest)] text-[var(--color-canvas)] text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1"
                >
                  <Reply className="w-3.5 h-3.5" />
                  <span>Draft Reply</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-[var(--color-text-secondary)]">
            <p className="font-editorial text-xl italic text-[var(--color-text-primary)]">
              No active career inquiries recorded.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
