import React, { useState } from 'react';
import {
  Sliders,
  Shield,
  Layers,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Plus,
  Lock,
  Sun,
  Moon,
  Info,
} from 'lucide-react';
import { UserPreferences, ThemeMode } from '../types/index.ts';
import { KAIRO_STANDARD_LABELS } from '../lib/gmail.ts';

interface SettingsViewProps {
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: UserPreferences) => void;
  onProvisionLabels: () => Promise<void>;
  isProvisioningLabels: boolean;
  userEmail: string | null;
  onSignOut: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  theme: ThemeMode;
  onToggleTheme: (theme: ThemeMode) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  preferences,
  onUpdatePreferences,
  onProvisionLabels,
  isProvisioningLabels,
  userEmail,
  onSignOut,
  isDemoMode,
  onToggleDemoMode,
  theme,
  onToggleTheme,
}) => {
  const [newPrioritizeSender, setNewPrioritizeSender] = useState('');
  const [newNeverArchiveSender, setNewNeverArchiveSender] = useState('');
  const [saveToast, setSaveToast] = useState(false);

  const update = (partial: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...partial };
    onUpdatePreferences(updated);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const addPrioritizeSender = () => {
    if (!newPrioritizeSender.trim()) return;
    const list = [...preferences.alwaysPrioritizeSenders, newPrioritizeSender.trim().toLowerCase()];
    update({ alwaysPrioritizeSenders: Array.from(new Set(list)) });
    setNewPrioritizeSender('');
  };

  const removePrioritizeSender = (sender: string) => {
    update({
      alwaysPrioritizeSenders: preferences.alwaysPrioritizeSenders.filter((s) => s !== sender),
    });
  };

  const addNeverArchiveSender = () => {
    if (!newNeverArchiveSender.trim()) return;
    const list = [...preferences.neverArchiveSenders, newNeverArchiveSender.trim().toLowerCase()];
    update({ neverArchiveSenders: Array.from(new Set(list)) });
    setNewNeverArchiveSender('');
  };

  const removeNeverArchiveSender = (sender: string) => {
    update({
      neverArchiveSenders: preferences.neverArchiveSenders.filter((s) => s !== sender),
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Editorial Header */}
      <header className="border-b border-[var(--color-border)] pb-6 pt-2 flex items-baseline justify-between">
        <div>
          <span className="font-mono-tech text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
            Configuration & Safeguards
          </span>
          <h1 className="font-editorial text-4xl text-[var(--color-text-primary)] font-normal mt-0.5">
            Settings & Automation
          </h1>
          <p className="font-sans text-[var(--color-text-secondary)] text-sm mt-1">
            Govern automation safety boundaries, dry-run simulations, appearance, and learned sender rules.
          </p>
        </div>

        {saveToast && (
          <span className="text-xs text-[var(--color-forest)] font-mono-tech flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Saved
          </span>
        )}
      </header>

      {/* Theme Appearance */}
      <section className="bg-[var(--color-surface-main)] border border-[var(--color-border)] p-6 space-y-4">
        <h2 className="font-mono-tech text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
          Appearance & Aesthetic Direction
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleTheme('light')}
            className={`px-4 py-2 text-xs font-medium border flex items-center gap-2 transition-colors ${
              theme === 'light'
                ? 'bg-[var(--color-forest)] text-[var(--color-canvas)] border-[var(--color-forest)] font-semibold'
                : 'bg-[var(--color-surface-secondary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Light Theme (The Archive — Primary)</span>
          </button>
          <button
            onClick={() => onToggleTheme('dark')}
            className={`px-4 py-2 text-xs font-medium border flex items-center gap-2 transition-colors ${
              theme === 'dark'
                ? 'bg-[var(--color-forest)] text-[var(--color-canvas)] border-[var(--color-forest)] font-semibold'
                : 'bg-[var(--color-surface-secondary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark Theme (The Archive — Ink)</span>
          </button>
        </div>
      </section>

      {/* DRY-RUN SAFETY SAFEGUARDS (Task 8 Focus) */}
      <section className="bg-[var(--color-surface-main)] border border-[var(--color-border)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-editorial text-2xl text-[var(--color-text-primary)] font-normal">
              Dry-Run Simulation Mode
            </h2>
            <p className="font-sans text-xs text-[var(--color-text-secondary)] mt-1 max-w-xl leading-relaxed">
              When Dry-Run is active, KAIRO simulates all label applications and message archiving in memory and writes to the operations history log without making any real modifications to your Gmail mailbox.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={preferences.dryRunMode}
              onChange={(e) => update({ dryRunMode: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[var(--color-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-forest)]" />
          </label>
        </div>

        <div className="p-3.5 bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)] text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[var(--color-brass)] shrink-0 mt-0.5" />
          <div className="space-y-1 text-[var(--color-text-secondary)] leading-relaxed">
            <span className="font-medium text-[var(--color-text-primary)]">
              Operational Safeguard Policy:
            </span>
            <p>
              KAIRO never permanently trashes or deletes emails. Archiving simply removes the <span className="font-mono-tech text-[11px] text-[var(--color-text-primary)]">INBOX</span> label so communications remain safe, searchable, and intact in your Gmail account.
            </p>
          </div>
        </div>
      </section>

      {/* Gmail Connection & Testing Mode */}
      <section className="bg-[var(--color-surface-main)] border border-[var(--color-border)] p-6 space-y-4">
        <div className="flex items-baseline justify-between border-b border-[var(--color-border)] pb-3">
          <h2 className="font-editorial text-2xl text-[var(--color-text-primary)] font-normal">
            Account Environment
          </h2>
          <button
            onClick={onToggleDemoMode}
            className="px-3 py-1 font-mono-tech text-xs bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-forest)] transition-colors"
          >
            {isDemoMode ? 'Switch to Live Gmail' : 'Switch to Archive Sandbox'}
          </button>
        </div>

        <div className="text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-text-secondary)]">Current Session Mode:</span>
            <span className="font-mono-tech font-medium text-[var(--color-text-primary)]">
              {isDemoMode ? 'Archive Sandbox (Demo Data)' : userEmail ? `Live Gmail (${userEmail})` : 'Disconnected'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[var(--color-text-secondary)]">OAuth Permissions:</span>
            <span className="font-mono-tech text-[11px] text-[var(--color-text-secondary)]">
              gmail.modify, gmail.labels
            </span>
          </div>
        </div>

        {userEmail && (
          <div className="pt-3 border-t border-[var(--color-border)] flex justify-end">
            <button
              onClick={onSignOut}
              className="px-3 py-1.5 text-xs text-[var(--color-oxide)] border border-[var(--color-border)] hover:border-[var(--color-oxide)] transition-colors"
            >
              Disconnect Session
            </button>
          </div>
        )}
      </section>

      {/* Learned Sender Rules */}
      <section className="bg-[var(--color-surface-main)] border border-[var(--color-border)] p-6 space-y-6">
        <div>
          <h2 className="font-editorial text-2xl text-[var(--color-text-primary)] font-normal">
            Learned Sender Preferences
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Explicit sender rules that supersede autonomous classification.
          </p>
        </div>

        {/* Always Prioritize */}
        <div className="space-y-3">
          <label className="block font-mono-tech text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
            Always Prioritize Senders (Promoted to Priority 1)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPrioritizeSender}
              onChange={(e) => setNewPrioritizeSender(e.target.value)}
              placeholder="e.g. advisor@university.edu"
              className="flex-1 px-3 py-1.5 text-xs bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-forest)]"
            />
            <button
              onClick={addPrioritizeSender}
              className="px-3 py-1.5 text-xs bg-[var(--color-forest)] text-[var(--color-canvas)] font-medium hover:opacity-90"
            >
              Add Rule
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {preferences.alwaysPrioritizeSenders.map((sender) => (
              <span
                key={sender}
                className="px-2.5 py-1 text-xs font-mono-tech bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-center gap-1.5"
              >
                <span>{sender}</span>
                <button
                  onClick={() => removePrioritizeSender(sender)}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-oxide)]"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Never Archive */}
        <div className="space-y-3 pt-4 border-t border-[var(--color-border)]">
          <label className="block font-mono-tech text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
            Never Archive Automatically
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newNeverArchiveSender}
              onChange={(e) => setNewNeverArchiveSender(e.target.value)}
              placeholder="e.g. notifications@github.com"
              className="flex-1 px-3 py-1.5 text-xs bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-forest)]"
            />
            <button
              onClick={addNeverArchiveSender}
              className="px-3 py-1.5 text-xs bg-[var(--color-forest)] text-[var(--color-canvas)] font-medium hover:opacity-90"
            >
              Add Rule
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {preferences.neverArchiveSenders.map((sender) => (
              <span
                key={sender}
                className="px-2.5 py-1 text-xs font-mono-tech bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-center gap-1.5"
              >
                <span>{sender}</span>
                <button
                  onClick={() => removeNeverArchiveSender(sender)}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-oxide)]"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Gmail Label Hierarchy Setup */}
      <section className="bg-[var(--color-surface-main)] border border-[var(--color-border)] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <div>
            <h2 className="font-editorial text-2xl text-[var(--color-text-primary)] font-normal">
              Gmail Label Architecture
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Ensure KAIRO label hierarchy is provisioned in your Google account.
            </p>
          </div>

          <button
            onClick={onProvisionLabels}
            disabled={isProvisioningLabels || isDemoMode}
            className="px-3.5 py-1.5 text-xs bg-[var(--color-forest)] text-[var(--color-canvas)] font-medium hover:opacity-90 disabled:opacity-50"
          >
            {isProvisioningLabels ? 'Provisioning...' : 'Provision Labels'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono-tech text-xs text-[var(--color-text-secondary)]">
          {KAIRO_STANDARD_LABELS.map((lbl) => (
            <div key={lbl} className="p-2 bg-[var(--color-surface-secondary)]/40 border border-[var(--color-border)] truncate">
              {lbl}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
