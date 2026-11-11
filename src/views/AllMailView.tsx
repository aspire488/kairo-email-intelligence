import React, { useState } from 'react';
import {
  Search,
  Archive,
  CheckSquare,
  Square,
  ExternalLink,
  Sliders,
  Filter,
} from 'lucide-react';
import { EmailMessage } from '../types/index.ts';

interface AllMailViewProps {
  emails: EmailMessage[];
  onSelectEmail: (email: EmailMessage) => void;
  onBatchArchive: (emailIds: string[]) => void;
  onOpenCorrection: (email: EmailMessage) => void;
  onSearchQuerySubmit?: (query: string) => void;
}

export const AllMailView: React.FC<AllMailViewProps> = ({
  emails,
  onSelectEmail,
  onBatchArchive,
  onOpenCorrection,
  onSearchQuerySubmit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = emails.filter((email) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.snippet.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' || email.classification?.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((e) => e.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleArchiveSelected = () => {
    if (selectedIds.size === 0) return;
    onBatchArchive(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Editorial Header */}
      <header className="border-b border-[var(--color-border)] pb-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <span className="font-mono-tech text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
              Complete Ledger
            </span>
            <h1 className="font-editorial text-4xl text-[var(--color-text-primary)] font-normal mt-0.5">
              All Communications
            </h1>
            <p className="font-sans text-[var(--color-text-secondary)] text-sm mt-1 max-w-2xl">
              Unfiltered chronological index of all synchronized inbox communications.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <button
                onClick={handleArchiveSelected}
                className="px-3.5 py-1.5 text-xs font-medium bg-[var(--color-forest)] text-[var(--color-canvas)] hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive ({selectedIds.size})</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-xs">
            {['ALL', 'CRITICAL', 'IMPORTANT', 'OSS', 'CAREER', 'ACADEMIC', 'NEWSLETTER', 'PROMOTION'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] font-medium shadow-xs'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search all..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--color-surface-main)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-forest)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
            />
          </div>
        </div>
      </header>

      {/* Table-Like Editorial List */}
      <div className="bg-[var(--color-surface-main)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
        {/* Table Header Row */}
        <div className="p-3 bg-[var(--color-surface-secondary)]/50 flex items-center gap-4 text-xs font-mono-tech text-[var(--color-text-secondary)]">
          <button
            onClick={toggleSelectAll}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            {selectedIds.size === filtered.length && filtered.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-[var(--color-forest)]" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
          <span className="w-32">Priority / Category</span>
          <span className="w-40">Sender</span>
          <span className="flex-1">Subject & Preview</span>
          <span className="w-24 text-right">Date</span>
        </div>

        {/* Rows */}
        {filtered.length > 0 ? (
          filtered.map((email) => {
            const isSelected = selectedIds.has(email.id);
            const isCritical = email.classification?.priority === 0;

            return (
              <div
                key={email.id}
                onClick={() => onSelectEmail(email)}
                className={`p-4 hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors flex items-center gap-4 text-xs ${
                  isSelected ? 'bg-[var(--color-surface-secondary)]/70' : ''
                }`}
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(email.id);
                  }}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-[var(--color-forest)]" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </div>

                <div className="w-32 font-mono-tech text-[11px] truncate">
                  <span
                    className={
                      isCritical
                        ? 'text-[var(--color-oxide)] font-semibold'
                        : email.classification?.priority === 1
                        ? 'text-[var(--color-forest)] font-medium'
                        : 'text-[var(--color-text-secondary)]'
                    }
                  >
                    P{email.classification?.priority ?? 1} · {email.classification?.category || 'DIRECT'}
                  </span>
                </div>

                <div className="w-40 font-medium text-[var(--color-text-primary)] truncate">
                  {email.fromName}
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {email.subject}
                  </span>
                  <span className="text-[var(--color-text-secondary)] ml-2 text-[11px] truncate">
                    — {email.snippet}
                  </span>
                </div>

                <div className="w-24 font-mono-tech text-[11px] text-[var(--color-text-secondary)] text-right shrink-0">
                  {new Date(email.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-[var(--color-text-secondary)]">
            <p className="font-editorial text-xl italic text-[var(--color-text-primary)]">
              No communications found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
