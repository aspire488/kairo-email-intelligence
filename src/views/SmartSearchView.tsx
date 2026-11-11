import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronRight,
  Filter,
  Calendar,
  User,
  GitPullRequest,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { EmailMessage } from '../types/index.ts';

interface SmartSearchViewProps {
  emails: EmailMessage[];
  onSelectEmail: (email: EmailMessage) => void;
  onExecuteGmailQuery?: (gmailQuery: string) => Promise<void>;
}

const SAMPLE_QUERIES = [
  'Show all PRs awaiting my response',
  'Show failed CI notifications',
  'Find internship and job opportunities',
  'Find emails mentioning deadlines or deliverables',
  'Find maintainer replies on active pull requests',
  'Show critical security alerts',
];

export const SmartSearchView: React.FC<SmartSearchViewProps> = ({
  emails,
  onSelectEmail,
  onExecuteGmailQuery,
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [senderFilter, setSenderFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'OSS' | 'CAREER' | 'ACADEMIC' | 'CRITICAL'>('ALL');
  const [searchMetadata, setSearchMetadata] = useState<{
    gmailQuery: string;
    explanation: string;
  } | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [rawResults, setRawResults] = useState<EmailMessage[]>(emails);

  const handleSearch = async (targetQuery?: string) => {
    const q = targetQuery || query;
    if (!q.trim() && !senderFilter) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const res = await fetch('/api/ai/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) throw new Error('Query parse error');
      const data = await res.json();
      setSearchMetadata(data);

      const matched = emails.filter((email) => {
        const fullText = `${email.subject} ${email.snippet} ${email.from} ${email.bodyText}`.toLowerCase();
        const searchLower = q.toLowerCase();

        if (data.categoryFilter && email.classification?.category !== data.categoryFilter) {
          if (!searchLower.includes('pr') || email.classification?.category !== 'OSS') {
            return false;
          }
        }

        if (typeof data.priorityFilter === 'number' && email.classification?.priority !== data.priorityFilter) {
          return false;
        }

        if (searchLower.includes('ci') || searchLower.includes('fail')) {
          return fullText.includes('failed') || fullText.includes('failure') || fullText.includes('ci');
        }
        if (searchLower.includes('intern') || searchLower.includes('job') || searchLower.includes('recruit')) {
          return email.classification?.category === 'CAREER' || fullText.includes('interview') || fullText.includes('recruiting');
        }
        if (searchLower.includes('deadline') || searchLower.includes('deliverable')) {
          return fullText.includes('deadline') || fullText.includes('presentation') || fullText.includes('deliverable');
        }
        if (searchLower.includes('awaiting') || searchLower.includes('response')) {
          return email.classification?.action_required;
        }

        const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
        return words.length === 0 || words.some((word) => fullText.includes(word));
      });

      setRawResults(matched);

      if (onExecuteGmailQuery && data.gmailQuery) {
        onExecuteGmailQuery(data.gmailQuery);
      }
    } catch {
      const fallback = emails.filter((e) =>
        e.subject.toLowerCase().includes(q.toLowerCase()) ||
        e.snippet.toLowerCase().includes(q.toLowerCase()) ||
        e.from.toLowerCase().includes(q.toLowerCase())
      );
      setRawResults(fallback);
      setSearchMetadata({
        gmailQuery: q,
        explanation: `Text search across inbox messages for "${q}"`,
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Client-side date and sender refinement
  const finalResults = useMemo(() => {
    return rawResults.filter((email) => {
      // Sender filter
      if (senderFilter.trim()) {
        const s = senderFilter.toLowerCase();
        if (!email.from.toLowerCase().includes(s) && !email.fromName.toLowerCase().includes(s)) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== 'ALL') {
        if (categoryFilter === 'CRITICAL' && email.classification?.priority !== 0) return false;
        if (categoryFilter !== 'CRITICAL' && email.classification?.category !== categoryFilter) return false;
      }

      // Date range filter
      if (dateRangeFilter !== 'all') {
        const emailTime = new Date(email.date).getTime();
        const now = Date.now();
        const diffHours = (now - emailTime) / (1000 * 60 * 60);

        if (dateRangeFilter === '24h' && diffHours > 24) return false;
        if (dateRangeFilter === '7d' && diffHours > 24 * 7) return false;
        if (dateRangeFilter === '30d' && diffHours > 24 * 30) return false;
      }

      return true;
    });
  }, [rawResults, senderFilter, categoryFilter, dateRangeFilter]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Editorial Header */}
      <header className="border-b border-[var(--color-border)] pb-6 pt-2">
        <span className="font-mono-tech text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
          Unified Catalog Search
        </span>
        <h1 className="font-editorial text-4xl text-[var(--color-text-primary)] font-normal mt-0.5">
          Archive Search
        </h1>
        <p className="font-sans text-[var(--color-text-secondary)] text-sm mt-1 max-w-2xl">
          Search with natural phrasing, technical query parameters, or granular sender and timeframe filters.
        </p>
      </header>

      {/* Main Search Panel */}
      <div className="bg-[var(--color-surface-main)] border border-[var(--color-border)] p-6 space-y-5">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search communications (e.g., 'failing CI on vite', 'internship invitations')..."
            className="w-full px-4 py-3 pl-11 text-sm bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-forest)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
          />
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />

          <button
            onClick={() => handleSearch()}
            disabled={isSearching}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[var(--color-forest)] text-[var(--color-canvas)] text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSearching ? 'Translating...' : 'Search Archive'}
          </button>
        </div>

        {/* Refinement Filters Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          {/* Sender Filter Input */}
          <div>
            <label className="block font-mono-tech text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">
              Sender Filter
            </label>
            <input
              type="text"
              value={senderFilter}
              onChange={(e) => setSenderFilter(e.target.value)}
              placeholder="e.g. github, aws, stripe..."
              className="w-full px-2.5 py-1.5 bg-[var(--color-surface-secondary)]/40 border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-forest)]"
            />
          </div>

          {/* Timeframe Filter */}
          <div>
            <label className="block font-mono-tech text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">
              Timeframe
            </label>
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-[var(--color-surface-secondary)]/40 border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-forest)]"
            >
              <option value="all">All Available Records</option>
              <option value="24h">Past 24 Hours</option>
              <option value="7d">Past 7 Days</option>
              <option value="30d">Past 30 Days</option>
            </select>
          </div>

          {/* Category Scope */}
          <div>
            <label className="block font-mono-tech text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">
              Category Scope
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-[var(--color-surface-secondary)]/40 border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-forest)]"
            >
              <option value="ALL">All Categories</option>
              <option value="CRITICAL">Critical Alerts</option>
              <option value="OSS">Open Source / GitHub</option>
              <option value="CAREER">Career & Opportunities</option>
              <option value="ACADEMIC">Academic & Research</option>
            </select>
          </div>
        </div>

        {/* Suggested Queries */}
        <div className="pt-2 flex flex-wrap items-center gap-1.5">
          <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)] mr-1">
            Example Queries:
          </span>
          {SAMPLE_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(q);
                handleSearch(q);
              }}
              className="px-2 py-0.5 text-[11px] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-forest)] border border-[var(--color-border)] transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Gmail Query Translation Card */}
      {searchMetadata && (
        <div className="p-4 bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)] text-xs space-y-1 font-mono-tech">
          <div className="flex items-center justify-between text-[var(--color-text-secondary)]">
            <span>Query Translation Result</span>
            <span>Gmail Search Syntax</span>
          </div>
          <p className="text-[var(--color-forest)] font-medium">
            {searchMetadata.gmailQuery}
          </p>
          <p className="font-sans text-[var(--color-text-secondary)] text-[11px]">
            {searchMetadata.explanation}
          </p>
        </div>
      )}

      {/* Search Results Ledger */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between border-b border-[var(--color-border)] pb-2 text-xs">
          <h2 className="font-editorial text-2xl text-[var(--color-text-primary)] font-normal">
            Matching Correspondence ({finalResults.length})
          </h2>
          <span className="font-mono-tech text-[var(--color-text-secondary)]">
            {emails.length} total messages in index
          </span>
        </div>

        {finalResults.length === 0 ? (
          <div className="p-12 text-center bg-[var(--color-surface-main)] border border-[var(--color-border)]">
            <p className="font-editorial text-xl italic text-[var(--color-text-primary)]">
              No matching records found.
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Try adjusting query phrasing or resetting filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] bg-[var(--color-surface-main)]">
            {finalResults.map((email) => (
              <div
                key={email.id}
                onClick={() => onSelectEmail(email)}
                className="p-4 hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono-tech text-[10px] ${
                        email.classification?.priority === 0
                          ? 'text-[var(--color-oxide)] font-semibold'
                          : 'text-[var(--color-forest)]'
                      }`}
                    >
                      P{email.classification?.priority ?? 1} · {email.classification?.category || 'DIRECT'}
                    </span>
                    <span className="text-[var(--color-border)]">·</span>
                    <span className="font-medium text-[var(--color-text-primary)] truncate">
                      {email.fromName}
                    </span>
                  </div>

                  <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
                    {email.subject}
                  </h3>

                  <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
