import React from 'react';
import {
  LayoutDashboard,
  Inbox,
  MessageSquare,
  GitPullRequest,
  MoreHorizontal,
} from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { currentPlatform } from '../lib/platform.ts';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  unreadCount?: number;
  criticalCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  unreadCount = 0,
  criticalCount = 0,
}) => {
  const handleTap = async (tabId: string) => {
    if (currentPlatform.hasHaptics) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch {
        // Ignore haptics errors
      }
    }
    onTabChange(tabId);
  };

  const navItems = [
    { id: 'overview', label: 'Home', icon: LayoutDashboard, badge: criticalCount > 0 ? criticalCount : null, isCritical: true },
    { id: 'priority', label: 'Inbox', icon: Inbox, badge: unreadCount > 0 ? unreadCount : null, isCritical: false },
    { id: 'chat', label: 'Chat', icon: MessageSquare, badge: null, isCritical: false },
    { id: 'oss', label: 'OSS', icon: GitPullRequest, badge: null, isCritical: false },
    { id: 'more', label: 'More', icon: MoreHorizontal, badge: null, isCritical: false },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-surface-main)]/95 backdrop-blur-md border-t border-[var(--color-border)] px-2 py-1.5 safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive =
            activeTab === item.id ||
            (item.id === 'more' && ['academic', 'career', 'newsletters', 'history', 'search', 'settings', 'devices'].includes(activeTab));

          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleTap(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg relative transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'text-[var(--color-forest)] font-medium'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <div className="relative">
                <IconComponent className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.6]'}`} />
                {item.badge !== null && item.badge > 0 && (
                  <span
                    className={`absolute -top-1 -right-2 px-1 min-w-[14px] h-3.5 text-[9px] font-mono-tech font-bold rounded-full flex items-center justify-center ${
                      item.isCritical
                        ? 'bg-[var(--color-vermilion,#E65038)] text-white'
                        : 'bg-[var(--color-forest)] text-[var(--color-canvas)]'
                    }`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 font-sans">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
