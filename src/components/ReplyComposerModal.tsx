import React, { useState } from 'react';
import { X, Send, FileEdit, CheckCircle2 } from 'lucide-react';
import { EmailMessage } from '../types/index.ts';

interface ReplyComposerModalProps {
  email: EmailMessage | null;
  isOpen: boolean;
  onClose: () => void;
  onCreateDraft: (to: string, subject: string, body: string, threadId: string) => Promise<void>;
  onSendMessage: (to: string, subject: string, body: string, threadId: string) => Promise<void>;
}

export const ReplyComposerModal: React.FC<ReplyComposerModalProps> = ({
  email,
  isOpen,
  onClose,
  onCreateDraft,
  onSendMessage,
}) => {
  if (!isOpen || !email) return null;

  const replySubject = email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`;
  const defaultTo = email.fromAddress;

  const [to] = useState<string>(defaultTo);
  const [subject] = useState<string>(replySubject);
  const [body, setBody] = useState<string>('');
  const [tone, setTone] = useState<'concise' | 'technical' | 'friendly' | 'defer'>('concise');
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [rationale, setRationale] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleGenerateDraft = async (customTone?: 'concise' | 'technical' | 'friendly' | 'defer') => {
    setIsGenerating(true);
    setStatusMessage(null);
    try {
      const activeTone = customTone || tone;
      const res = await fetch('/api/ai/draft-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailSubject: email.subject,
          sender: email.from,
          threadSummary: email.snippet,
          latestMessage: email.bodyText.slice(0, 1500),
          userInstruction: userPrompt || undefined,
          tone: activeTone,
        }),
      });

      if (!res.ok) throw new Error('Drafting service returned error');
      const data = await res.json();
      setBody(data.draft || '');
      setRationale(data.rationale || '');
    } catch {
      setStatusMessage('Draft generated with heuristic fallback. You may refine text directly.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateDraft = async () => {
    if (!body.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateDraft(to, subject, body, email.threadId);
      setStatusMessage('Draft created in Gmail.');
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSend = async () => {
    if (!body.trim()) return;
    setIsSubmitting(true);
    try {
      await onSendMessage(to, subject, body, email.threadId);
      setStatusMessage('Message transmitted.');
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[var(--color-surface-main)] border border-[var(--color-border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50">
          <div>
            <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">
              Contextual Drafting
            </span>
            <h2 className="font-editorial text-2xl text-[var(--color-text-primary)] font-normal mt-0.5">
              Formulate Response
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
          {/* Tone Selector */}
          <div className="flex items-center gap-1 p-1 bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
            {[
              { id: 'concise', label: 'Concise & Direct' },
              { id: 'technical', label: 'Technical' },
              { id: 'friendly', label: 'Warm & Professional' },
              { id: 'defer', label: 'Defer / Buy Time' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTone(t.id as any);
                  handleGenerateDraft(t.id as any);
                }}
                className={`px-3 py-1 text-xs transition-colors ${
                  tone === t.id
                    ? 'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] font-medium shadow-xs'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* User Instruction Prompt */}
          <div className="flex gap-2">
            <input
              type="text"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateDraft()}
              placeholder="Custom instructions (e.g., 'Confirm availability for Tuesday at 2pm PT')..."
              className="flex-1 px-3 py-2 bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-forest)]"
            />
            <button
              onClick={() => handleGenerateDraft()}
              disabled={isGenerating}
              className="px-3.5 py-1.5 bg-[var(--color-forest)] text-[var(--color-canvas)] font-medium hover:opacity-90 disabled:opacity-50"
            >
              {isGenerating ? 'Synthesizing...' : 'Draft with KAIRO'}
            </button>
          </div>

          {rationale && (
            <p className="text-[11px] text-[var(--color-text-secondary)] italic font-editorial">
              Draft strategy: {rationale}
            </p>
          )}

          {/* Recipient & Subject Info */}
          <div className="space-y-1 font-mono-tech text-[11px] text-[var(--color-text-secondary)] border-y border-[var(--color-border)] py-2">
            <div>To: <span className="text-[var(--color-text-primary)]">{to}</span></div>
            <div>Subject: <span className="text-[var(--color-text-primary)]">{subject}</span></div>
          </div>

          {/* Message Area */}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            placeholder="Write or review your response..."
            className="w-full p-3 bg-[var(--color-surface-secondary)]/30 border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-forest)] font-sans leading-relaxed resize-none"
          />

          {statusMessage && (
            <p className="text-xs text-[var(--color-forest)] font-mono-tech">
              {statusMessage}
            </p>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50 flex items-center justify-between">
          <span className="font-mono-tech text-[10px] text-[var(--color-text-secondary)]">
            Changes require explicit confirmation before sending
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateDraft}
              disabled={isSubmitting || !body.trim()}
              className="px-3.5 py-1.5 text-xs border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-forest)] transition-colors disabled:opacity-50"
            >
              Save as Gmail Draft
            </button>
            <button
              onClick={handleSend}
              disabled={isSubmitting || !body.trim()}
              className="px-4 py-1.5 text-xs font-medium bg-[var(--color-forest)] text-[var(--color-canvas)] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
