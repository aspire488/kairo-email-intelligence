import React from 'react';
import { X, ShieldAlert } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  actionLabel?: string;
  isDestructive?: boolean;
  details?: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  actionLabel = 'Confirm Action',
  isDestructive = false,
  details,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[var(--color-surface-main)] border border-[var(--color-border)] shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-start justify-between border-b border-[var(--color-border)] pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className={`w-4 h-4 ${isDestructive ? 'text-[var(--color-oxide)]' : 'text-[var(--color-forest)]'}`} />
            <h3 className="font-editorial text-xl text-[var(--color-text-primary)] font-normal">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <p className="text-[var(--color-text-secondary)] leading-relaxed font-sans">{description}</p>

          {details && details.length > 0 && (
            <div className="p-3 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] space-y-1 font-mono-tech">
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
                Affected Item Ledger
              </div>
              {details.map((detail, idx) => (
                <div key={idx} className="truncate">
                  • {detail}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border)]">
            <button
              onClick={onCancel}
              className="px-3.5 py-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`px-3.5 py-1.5 text-xs font-medium text-[var(--color-canvas)] transition-opacity hover:opacity-90 ${
                isDestructive ? 'bg-[var(--color-oxide)]' : 'bg-[var(--color-forest)]'
              }`}
            >
              {actionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
