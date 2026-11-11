import React, { useState } from 'react';
import { X, Sliders } from 'lucide-react';
import { EmailCategory, EmailMessage, PriorityLevel, UserPreferences } from '../types/index.ts';

interface ClassificationCorrectionModalProps {
  email: EmailMessage | null;
  isOpen: boolean;
  preferences: UserPreferences;
  onSaveCorrection: (
    emailId: string,
    newCategory: EmailCategory,
    newPriority: PriorityLevel,
    alwaysPrioritize: boolean,
    neverArchive: boolean
  ) => void;
  onClose: () => void;
}

const CATEGORIES: EmailCategory[] = [
  'CRITICAL',
  'IMPORTANT',
  'OSS',
  'ACADEMIC',
  'CAREER',
  'PERSONAL',
  'FINANCIAL',
  'NEWSLETTER',
  'PROMOTION',
  'SUSPICIOUS',
];

export const ClassificationCorrectionModal: React.FC<ClassificationCorrectionModalProps> = ({
  email,
  isOpen,
  preferences,
  onSaveCorrection,
  onClose,
}) => {
  if (!isOpen || !email) return null;

  const currentCat = email.classification?.category || 'IMPORTANT';
  const currentPri = (email.classification?.priority ?? 1) as PriorityLevel;
  const isCurrentlyPrioritized = preferences.alwaysPrioritizeSenders.includes(email.fromAddress);
  const isCurrentlyNeverArchived = preferences.neverArchiveSenders.includes(email.fromAddress);

  const [category, setCategory] = useState<EmailCategory>(currentCat);
  const [priority, setPriority] = useState<PriorityLevel>(currentPri);
  const [alwaysPrioritize, setAlwaysPrioritize] = useState<boolean>(isCurrentlyPrioritized);
  const [neverArchive, setNeverArchive] = useState<boolean>(isCurrentlyNeverArchived);

  const handleSave = () => {
    onSaveCorrection(email.id, category, priority, alwaysPrioritize, neverArchive);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[var(--color-surface-main)] border border-[var(--color-border)] shadow-2xl overflow-hidden p-6 space-y-5">
        <div className="flex items-start justify-between border-b border-[var(--color-border)] pb-3">
          <div>
            <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">
              Manual Override & Training
            </span>
            <h2 className="font-editorial text-2xl text-[var(--color-text-primary)] font-normal mt-0.5">
              Recalibrate Classification
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3 bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)] space-y-1">
            <p className="font-medium text-[var(--color-text-primary)] truncate">
              {email.subject}
            </p>
            <p className="font-mono-tech text-[11px] text-[var(--color-text-secondary)] truncate">
              From: {email.from}
            </p>
          </div>

          {/* Category Select */}
          <div className="space-y-1.5">
            <label className="block font-mono-tech text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">
              Assigned Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as EmailCategory)}
              className="w-full p-2 bg-[var(--color-surface-secondary)]/40 border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-forest)] font-mono-tech"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Select */}
          <div className="space-y-1.5">
            <label className="block font-mono-tech text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">
              Assigned Priority Tier
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { pri: 0, label: 'P0 Critical' },
                { pri: 1, label: 'P1 Important' },
                { pri: 2, label: 'P2 OSS' },
                { pri: 3, label: 'P3 Info' },
                { pri: 4, label: 'P4 Low Value' },
                { pri: 5, label: 'P5 Suspicious' },
              ].map((p) => (
                <button
                  key={p.pri}
                  type="button"
                  onClick={() => setPriority(p.pri as PriorityLevel)}
                  className={`py-1.5 text-xs font-mono-tech border transition-colors ${
                    priority === p.pri
                      ? 'bg-[var(--color-forest)] text-[var(--color-canvas)] border-[var(--color-forest)] font-medium'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Permanent sender learning toggles */}
          <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={alwaysPrioritize}
                onChange={(e) => setAlwaysPrioritize(e.target.checked)}
                className="rounded border-[var(--color-border)] text-[var(--color-forest)] focus:ring-0"
              />
              <span className="text-[var(--color-text-primary)]">
                Always prioritize emails from <strong className="font-mono-tech">{email.fromAddress}</strong>
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={neverArchive}
                onChange={(e) => setNeverArchive(e.target.checked)}
                className="rounded border-[var(--color-border)] text-[var(--color-forest)] focus:ring-0"
              />
              <span className="text-[var(--color-text-primary)]">
                Never archive emails from <strong className="font-mono-tech">{email.fromAddress}</strong>
              </span>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--color-border)]">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-medium bg-[var(--color-forest)] text-[var(--color-canvas)] hover:opacity-90"
            >
              Apply Correction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
