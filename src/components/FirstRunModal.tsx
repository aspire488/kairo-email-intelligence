import React, { useState } from 'react';
import { CheckCircle2, Shield, ArrowRight, Archive } from 'lucide-react';
import { EmailMessage } from '../types/index.ts';

interface FirstRunModalProps {
  isOpen: boolean;
  userEmail: string;
  emails: EmailMessage[];
  onCompleteFirstRun: (createLabels: boolean, enableDryRun: boolean) => Promise<void>;
  onDismiss: () => void;
}

export const FirstRunModal: React.FC<FirstRunModalProps> = ({
  isOpen,
  userEmail,
  emails,
  onCompleteFirstRun,
  onDismiss,
}) => {
  const [step, setStep] = useState<number>(1);
  const [isSettingUp, setIsSettingUp] = useState<boolean>(false);
  const [createStandardLabels, setCreateStandardLabels] = useState<boolean>(true);
  const [keepDryRun, setKeepDryRun] = useState<boolean>(true);

  if (!isOpen) return null;

  const totalAnalyzed = emails.length;
  const criticalCount = emails.filter((e) => e.classification?.priority === 0).length;
  const importantCount = emails.filter((e) => e.classification?.priority === 1).length;
  const ossCount = emails.filter((e) => e.classification?.category === 'OSS').length;
  const promoCount = emails.filter((e) => e.classification?.priority === 4).length;

  const handleFinish = async () => {
    setIsSettingUp(true);
    try {
      await onCompleteFirstRun(createStandardLabels, keepDryRun);
      onDismiss();
    } catch (err) {
      console.error(err);
      onDismiss();
    } finally {
      setIsSettingUp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[var(--color-surface-main)] border border-[var(--color-border)] shadow-2xl p-6 sm:p-8 space-y-6">
        {step === 1 ? (
          <div className="space-y-5">
            <span className="font-mono-tech text-xs uppercase tracking-wider text-[var(--color-forest)]">
              Initial Inbox Synthesis
            </span>
            <h2 className="font-editorial text-3xl text-[var(--color-text-primary)] font-normal">
              Preliminary Inbox Analysis
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              KAIRO analyzed the first {totalAnalyzed} messages in <span className="font-mono-tech text-[var(--color-text-primary)]">{userEmail}</span> to establish baseline classification.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono-tech">
              <div className="p-3 bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)]">
                <span className="text-[var(--color-text-secondary)]">Urgent / Important</span>
                <p className="text-lg font-bold text-[var(--color-forest)] mt-0.5">
                  {criticalCount + importantCount}
                </p>
              </div>
              <div className="p-3 bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)]">
                <span className="text-[var(--color-text-secondary)]">Open Source Activity</span>
                <p className="text-lg font-bold text-[var(--color-text-primary)] mt-0.5">
                  {ossCount}
                </p>
              </div>
              <div className="p-3 bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)]">
                <span className="text-[var(--color-text-secondary)]">Automated Newsletters</span>
                <p className="text-lg font-bold text-[var(--color-text-secondary)] mt-0.5">
                  {promoCount}
                </p>
              </div>
              <div className="p-3 bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)]">
                <span className="text-[var(--color-text-secondary)]">Noise Filtered</span>
                <p className="text-lg font-bold text-[var(--color-forest)] mt-0.5">
                  {totalAnalyzed > 0 ? Math.round((promoCount / totalAnalyzed) * 100) : 0}%
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--color-border)]">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-[var(--color-forest)] text-[var(--color-canvas)] text-xs font-medium hover:opacity-90 flex items-center gap-1.5"
              >
                <span>Configure Safety Safeguards</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <span className="font-mono-tech text-xs uppercase tracking-wider text-[var(--color-forest)]">
              Safeguard Architecture
            </span>
            <h2 className="font-editorial text-3xl text-[var(--color-text-primary)] font-normal">
              Automation Boundaries
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Confirm how KAIRO organizes your Gmail account. You may modify these preferences anytime.
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <label className="p-3 bg-[var(--color-surface-secondary)]/40 border border-[var(--color-border)] flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createStandardLabels}
                  onChange={(e) => setCreateStandardLabels(e.target.checked)}
                  className="mt-0.5 rounded border-[var(--color-border)] text-[var(--color-forest)] focus:ring-0"
                />
                <div className="space-y-0.5">
                  <span className="font-medium text-[var(--color-text-primary)]">
                    Provision KAIRO Label Taxonomy
                  </span>
                  <p className="text-[var(--color-text-secondary)] text-[11px] leading-relaxed">
                    Creates organized label folders in your Gmail account for Priority, OSS, and Career.
                  </p>
                </div>
              </label>

              <label className="p-3 bg-[var(--color-surface-secondary)]/40 border border-[var(--color-border)] flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepDryRun}
                  onChange={(e) => setKeepDryRun(e.target.checked)}
                  className="mt-0.5 rounded border-[var(--color-border)] text-[var(--color-forest)] focus:ring-0"
                />
                <div className="space-y-0.5">
                  <span className="font-medium text-[var(--color-text-primary)]">
                    Activate Dry-Run Mode (Recommended)
                  </span>
                  <p className="text-[var(--color-text-secondary)] text-[11px] leading-relaxed">
                    Simulates operations in memory without altering your real mailbox until you feel fully confident.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
              <button
                onClick={() => setStep(1)}
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={isSettingUp}
                className="px-4 py-2 bg-[var(--color-forest)] text-[var(--color-canvas)] text-xs font-medium hover:opacity-90 disabled:opacity-50"
              >
                {isSettingUp ? 'Finalizing Setup...' : 'Enter KAIRO Workspace'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
