import React, { useState } from 'react';
import { GraduationCap, UserCheck, AlertCircle, ExternalLink, Reply } from 'lucide-react';
import { EmailMessage } from '../types/index.ts';

interface PersonalAcademicViewProps {
  emails: EmailMessage[];
  onSelectEmail: (email: EmailMessage) => void;
  onOpenReply: (email: EmailMessage) => void;
}

export const PersonalAcademicView: React.FC<PersonalAcademicViewProps> = ({
  emails,
  onSelectEmail,
  onOpenReply,
}) => {
  const [filter, setFilter] = useState<'all' | 'academic' | 'personal'>('all');

  const items = emails.filter((e) => {
    const cat = e.classification?.category;
    if (filter === 'academic') return cat === 'ACADEMIC';
    if (filter === 'personal') return cat === 'PERSONAL';
    return cat === 'ACADEMIC' || cat === 'PERSONAL';
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Editorial Header */}
      <header className="border-b border-[var(--color-border)] pb-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <span className="font-mono-tech text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
              Faculty & Private Correspondence
            </span>
            <h1 className="font-editorial text-4xl text-[var(--color-text-primary)] font-normal mt-0.5">
              Personal & Academic
            </h1>
            <p className="font-sans text-[var(--color-text-secondary)] text-sm mt-1 max-w-2xl">
              Coursework deadlines, faculty advisement, research groups, and individual personal correspondence.
            </p>
          </div>

          {/* Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-xs">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'academic', label: 'Academic & Courses' },
              { id: 'personal', label: 'Personal Messages' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
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
        </div>
      </header>

      {/* List */}
      <div className="bg-[var(--color-surface-main)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
        {items.length > 0 ? (
          items.map((email) => (
            <div
              key={email.id}
              onClick={() => onSelectEmail(email)}
              className="p-5 hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4 group"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono-tech text-[11px] text-[var(--color-forest)] font-medium">
                    {email.classification?.category === 'ACADEMIC' ? 'ACADEMIC' : 'PERSONAL'}
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
              No correspondence found in this section.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
