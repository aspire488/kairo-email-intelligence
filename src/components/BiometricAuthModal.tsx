import React, { useState } from 'react';
import { Fingerprint, Lock, ShieldCheck, X } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { currentPlatform } from '../lib/platform.ts';

interface BiometricAuthModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel?: () => void;
  isEnrolling?: boolean;
}

export const BiometricAuthModal: React.FC<BiometricAuthModalProps> = ({
  isOpen,
  onSuccess,
  onCancel,
  isEnrolling = false,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulateBiometric = async () => {
    setIsVerifying(true);
    setError(null);

    if (currentPlatform.hasHaptics) {
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch {
        // Ignore
      }
    }

    setTimeout(() => {
      setIsVerifying(false);
      onSuccess();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-[var(--color-surface-main)] border border-[var(--color-border)] shadow-2xl p-6 text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-full bg-[var(--color-forest)]/10 flex items-center justify-center text-[var(--color-forest)]">
          <Fingerprint className="w-8 h-8" />
        </div>

        <div>
          <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--color-forest)]">
            {isEnrolling ? 'Biometric Enrollment' : 'Archive Security'}
          </span>
          <h3 className="font-editorial text-2xl text-[var(--color-text-primary)] font-normal mt-1">
            {isEnrolling ? 'Enable Biometric Protection' : 'Authenticate Access'}
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
            {isEnrolling
              ? 'Use Touch ID, Face ID, or Windows Hello to lock KAIRO when backgrounded.'
              : 'Verify your biometric identity to unlock your correspondence archive.'}
          </p>
        </div>

        {error && (
          <p className="text-xs font-mono-tech text-[var(--color-oxide)]">
            {error}
          </p>
        )}

        <div className="space-y-2 pt-2">
          <button
            onClick={handleSimulateBiometric}
            disabled={isVerifying}
            className="w-full py-2.5 px-4 bg-[var(--color-forest)] text-[var(--color-canvas)] text-xs font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            {isVerifying ? (
              <span className="font-mono-tech animate-pulse">Scanning Sensor...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>{isEnrolling ? 'Confirm & Enable' : 'Authenticate with Biometrics'}</span>
              </>
            )}
          </button>

          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full py-2 text-xs font-mono-tech text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
