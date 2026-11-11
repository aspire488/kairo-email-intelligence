import React from 'react';
import {
  GraduationCap,
  Briefcase,
  Newspaper,
  Search,
  History,
  Smartphone,
  Fingerprint,
  Settings,
  FlaskConical,
  ChevronRight,
  Shield,
} from 'lucide-react';

interface MobileMoreHubViewProps {
  onNavigateTab: (tabId: string) => void;
  onOpenDevices: () => void;
  onOpenBiometrics: () => void;
  onOpenUsabilityTesting: () => void;
  userEmail: string | null;
}

export const MobileMoreHubView: React.FC<MobileMoreHubViewProps> = ({
  onNavigateTab,
  onOpenDevices,
  onOpenBiometrics,
  onOpenUsabilityTesting,
  userEmail,
}) => {
  const sections = [
    {
      title: 'Correspondences',
      items: [
        {
          id: 'personal',
          label: 'Academic & Personal',
          description: 'Faculty, thesis committee, and personal correspondence',
          icon: GraduationCap,
          action: () => onNavigateTab('personal'),
        },
        {
          id: 'career',
          label: 'Career & Opportunities',
          description: 'Recruiters, engineering opportunities, and interviews',
          icon: Briefcase,
          action: () => onNavigateTab('career'),
        },
        {
          id: 'newsletters',
          label: 'Newsletters & Digests',
          description: 'Suppressed marketing digests and technical newsletters',
          icon: Newspaper,
          action: () => onNavigateTab('newsletters'),
        },
      ],
    },
    {
      title: 'Operations & Intelligence',
      items: [
        {
          id: 'search',
          label: 'Smart Natural Language Search',
          description: 'Query correspondence with semantic intent',
          icon: Search,
          action: () => onNavigateTab('search'),
        },
        {
          id: 'history',
          label: 'Operations Audit Trail',
          description: 'Complete log of automated classifications and actions',
          icon: History,
          action: () => onNavigateTab('history'),
        },
      ],
    },
    {
      title: 'Cross-Platform & Security',
      items: [
        {
          id: 'devices',
          label: 'Connected Devices',
          description: 'Manage active Windows, Android, iOS, and Web sessions',
          icon: Smartphone,
          action: onOpenDevices,
        },
        {
          id: 'biometrics',
          label: 'Biometric App Lock',
          description: 'Configure Touch ID, Face ID, or PIN screen lock',
          icon: Fingerprint,
          action: onOpenBiometrics,
        },
        {
          id: 'testing',
          label: 'Usability Testing Suite',
          description: 'Run 10-task usability test protocol & SUS evaluator',
          icon: FlaskConical,
          action: onOpenUsabilityTesting,
        },
        {
          id: 'settings',
          label: 'Preferences & System Settings',
          description: 'Notification rules, dry-run mode, and label hierarchy',
          icon: Settings,
          action: () => onNavigateTab('settings'),
        },
      ],
    },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      <div className="border-b border-[var(--color-border)] pb-4">
        <span className="font-mono-tech text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
          Hub & Configuration
        </span>
        <h1 className="font-editorial text-3xl text-[var(--color-text-primary)] font-normal mt-0.5">
          Workspace Navigation
        </h1>
        {userEmail && (
          <p className="text-xs font-mono-tech text-[var(--color-forest)] mt-1">
            {userEmail}
          </p>
        )}
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="space-y-2">
            <h3 className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--color-text-secondary)] px-1">
              {section.title}
            </h3>

            <div className="bg-[var(--color-surface-main)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
              {section.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--color-surface-secondary)]/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-8 h-8 rounded bg-[var(--color-surface-secondary)] flex items-center justify-center text-[var(--color-forest)] shrink-0">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-xs text-[var(--color-text-primary)]">
                          {item.label}
                        </p>
                        <p className="text-[11px] text-[var(--color-text-secondary)] truncate mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
