import { useEffect } from 'react';

export interface ShortcutActions {
  onSearch?: () => void;
  onOpenChat?: () => void;
  onOverview?: () => void;
  onPriorityInbox?: () => void;
  onSync?: () => void;
  onCloseModal?: () => void;
}

/**
 * Hook to attach global keyboard shortcuts for desktop & web productivity.
 */
export function useGlobalShortcuts(actions: ShortcutActions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (e.key === 'Escape') {
        if (actions.onCloseModal) {
          actions.onCloseModal();
        }
        return;
      }

      if (isCmdOrCtrl) {
        const key = e.key.toLowerCase();

        if (key === 'k') {
          e.preventDefault();
          actions.onSearch?.();
        } else if (key === 'j') {
          e.preventDefault();
          actions.onOpenChat?.();
        } else if (key === '1' && !isInput) {
          e.preventDefault();
          actions.onOverview?.();
        } else if (key === '2' && !isInput) {
          e.preventDefault();
          actions.onPriorityInbox?.();
        } else if (key === 'r' && !isInput && !e.shiftKey) {
          // Prevent browser reload if intended for app sync
          e.preventDefault();
          actions.onSync?.();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);
}
