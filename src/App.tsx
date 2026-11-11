/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
} from './lib/auth.ts';
import {
  listGmailMessages,
  getGmailMessage,
  getGmailProfile,
  GmailProfile,
  ensureKairoLabels,
  archiveGmailMessage,
  modifyGmailMessageLabels,
  createGmailDraft,
  sendGmailMessage,
} from './lib/gmail.ts';
import {
  deterministicClassify,
  aggregateOSSContributions,
} from './lib/deterministic.ts';
import {
  loadUserPreferences,
  saveUserPreferences,
  loadAuditLog,
  recordAuditLog,
  loadClassificationCache,
  saveClassificationCache,
  isOnboardingCompleted,
  setOnboardingCompleted,
  loadTheme,
  saveTheme,
} from './lib/storage.ts';
import { DEMO_EMAILS } from './data/demoData.ts';
import {
  EmailMessage,
  EmailCategory,
  PriorityLevel,
  UserPreferences,
  AuditLogEntry,
  ExecutiveBriefing,
  OSSContributionItem,
  ThemeMode,
  ChatSuggestedAction,
} from './types/index.ts';

// Views
import { OverviewView } from './views/OverviewView.tsx';
import { PriorityInboxView } from './views/PriorityInboxView.tsx';
import { ChatWithKairoView } from './views/ChatWithKairoView.tsx';
import { OSSIntelligenceView } from './views/OSSIntelligenceView.tsx';
import { PersonalAcademicView } from './views/PersonalAcademicView.tsx';
import { CareerView } from './views/CareerView.tsx';
import { AllMailView } from './views/AllMailView.tsx';
import { NewslettersView } from './views/NewslettersView.tsx';
import { AuditLogView } from './views/AuditLogView.tsx';
import { SmartSearchView } from './views/SmartSearchView.tsx';
import { SettingsView } from './views/SettingsView.tsx';
import { MobileMoreHubView } from './views/MobileMoreHubView.tsx';

// Modals & Cross-Platform Components
import { ConfirmationModal } from './components/ConfirmationModal.tsx';
import { ThreadDetailModal } from './components/ThreadDetailModal.tsx';
import { ReplyComposerModal } from './components/ReplyComposerModal.tsx';
import { ClassificationCorrectionModal } from './components/ClassificationCorrectionModal.tsx';
import { FirstRunModal } from './components/FirstRunModal.tsx';
import { UsabilityTestingModule } from './components/UsabilityTestingModule.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import { OfflineSyncBanner } from './components/OfflineSyncBanner.tsx';
import { BiometricAuthModal } from './components/BiometricAuthModal.tsx';
import { DeviceManagementModal } from './components/DeviceManagementModal.tsx';

// Cross-Platform Utilities
import { useGlobalShortcuts } from './lib/shortcuts.ts';
import { currentPlatform } from './lib/platform.ts';
import {
  loadSyncState,
  saveSyncState,
  cacheEmailsForOffline,
  loadOfflineCachedEmails,
  ClientSyncState,
} from './lib/syncService.ts';
import { initializeNotificationChannels, dispatchNotification } from './lib/notifications.ts';

// Icons
import {
  LayoutDashboard,
  ShieldAlert,
  MessageSquare,
  GitPullRequest,
  GraduationCap,
  Briefcase,
  Inbox,
  Newspaper,
  History,
  Search,
  Settings,
  RefreshCw,
  LogOut,
  ChevronRight,
  Menu,
  X,
  AlertCircle,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft,
  FlaskConical,
  Shield,
  ArrowRight,
  Smartphone,
  Fingerprint,
} from 'lucide-react';

type ConnectionState = 'LIVE_CONNECTED' | 'SANDBOX_ACTIVE' | 'DISCONNECTED' | 'CONNECTING' | 'AUTH_ERROR';

export default function App() {
  // Theme state (The Archive defaults to light theme PRIMARY)
  const [theme, setTheme] = useState<ThemeMode>(loadTheme);

  // Synchronize HTML theme class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveTheme(theme);
  }, [theme]);

  // Auth & Connection State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [gmailProfile, setGmailProfile] = useState<GmailProfile | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('SANDBOX_ACTIVE');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  // App mode (Default to Sandbox for instant previewability without exposing private mailbox)
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  // Active view tab
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Email data state
  const [emails, setEmails] = useState<EmailMessage[]>(DEMO_EMAILS);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<UserPreferences>(loadUserPreferences);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(loadAuditLog);
  const [briefing, setBriefing] = useState<ExecutiveBriefing | null>(null);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState<boolean>(false);
  const [isProvisioningLabels, setIsProvisioningLabels] = useState<boolean>(false);

  // Modals state
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [replyingEmail, setReplyingEmail] = useState<EmailMessage | null>(null);
  const [correctingEmail, setCorrectingEmail] = useState<EmailMessage | null>(null);
  const [showFirstRunModal, setShowFirstRunModal] = useState<boolean>(false);
  const [showUsabilityTestingModal, setShowUsabilityTestingModal] = useState<boolean>(false);
  const [showDevicesModal, setShowDevicesModal] = useState<boolean>(false);
  const [showBiometricModal, setShowBiometricModal] = useState<boolean>(false);

  // Cross-device synchronization state
  const [syncState, setSyncState] = useState<ClientSyncState>(loadSyncState);

  // Online/Offline tracking and notification channels
  useEffect(() => {
    initializeNotificationChannels();

    const handleOnline = () => setSyncState((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncState((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cache emails locally whenever updated
  useEffect(() => {
    if (emails.length > 0) {
      cacheEmailsForOffline(emails);
      setSyncState((prev) => {
        const next = { ...prev, lastSyncedTimestamp: Date.now() };
        saveSyncState(next);
        return next;
      });
    }
  }, [emails]);

  // Global keyboard shortcuts for desktop productivity
  useGlobalShortcuts({
    onSearch: () => setActiveTab('search'),
    onOpenChat: () => setActiveTab('chat'),
    onOverview: () => setActiveTab('overview'),
    onPriorityInbox: () => setActiveTab('priority'),
    onSync: () => {
      if (token) loadRealGmailData(token);
      else loadDemoData();
    },
    onCloseModal: () => {
      setSelectedEmail(null);
      setReplyingEmail(null);
      setCorrectingEmail(null);
      setShowFirstRunModal(false);
      setShowUsabilityTestingModal(false);
      setShowDevicesModal(false);
      setShowBiometricModal(false);
    },
  });

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel?: string;
    isDestructive?: boolean;
    details?: string[];
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Aggregated OSS Items
  const ossItems: OSSContributionItem[] = useMemo(() => {
    return aggregateOSSContributions(emails);
  }, [emails]);

  // Auth initialization
  useEffect(() => {
    const unsubscribe = initAuth(
      (authenticatedUser, accessToken) => {
        setUser(authenticatedUser);
        setToken(accessToken);
        setIsDemoMode(false);
        verifyAndLoadGmail(accessToken, authenticatedUser);
      },
      () => {
        // No cached memory token in this session
        setUser(null);
        setToken(null);
        setGmailProfile(null);
        if (isDemoMode) {
          setConnectionState('SANDBOX_ACTIVE');
          loadDemoData();
        } else {
          setConnectionState('DISCONNECTED');
        }
      }
    );
    return () => unsubscribe();
  }, []);

  // Verify real live connection with Gmail API
  const verifyAndLoadGmail = async (accessToken: string, _authUser: User) => {
    setConnectionState('CONNECTING');
    try {
      // Test real connection and retrieve account statistics
      const profile = await getGmailProfile(accessToken);
      setGmailProfile(profile);
      setConnectionState('LIVE_CONNECTED');
      setAuthError(null);
      loadRealGmailData(accessToken);
    } catch (err: any) {
      console.warn('Real Gmail API check failed:', err);
      setConnectionState('AUTH_ERROR');
      setAuthError('Gmail access token expired or requires re-authorization.');
    }
  };

  const loadDemoData = useCallback(() => {
    setEmails(DEMO_EMAILS);
    generateBriefingForEmails(DEMO_EMAILS, 'demo@kairo.ai');
  }, []);

  const loadRealGmailData = useCallback(
    async (accessToken: string) => {
      setIsSyncing(true);
      try {
        const { messages } = await listGmailMessages(accessToken, { maxResults: 35 });
        if (messages.length === 0) {
          setEmails([]);
          setIsSyncing(false);
          return;
        }

        const fetchedEmails: EmailMessage[] = [];
        for (let i = 0; i < messages.length; i += 5) {
          const batch = messages.slice(i, i + 5);
          const results = await Promise.allSettled(
            batch.map((m) => getGmailMessage(accessToken, m.id))
          );
          results.forEach((r) => {
            if (r.status === 'fulfilled') fetchedEmails.push(r.value);
          });
        }

        const cache = loadClassificationCache();
        const unclassifiedForAI: EmailMessage[] = [];

        const classifiedEmails = fetchedEmails.map((email) => {
          if (cache[email.id]) {
            return { ...email, classification: cache[email.id] };
          }

          const det = deterministicClassify(email, preferences);
          if (det && det.category) {
            const fullClassification = {
              category: det.category,
              priority: (det.priority ?? 1) as PriorityLevel,
              action_required: Boolean(det.action_required),
              action: det.action || null,
              repository: det.repository || null,
              pr_number: det.pr_number || null,
              confidence: det.confidence ?? 0.9,
              reason: det.reason || 'Deterministic match',
              suggested_label: det.suggested_label || 'KAIRO/IMPORTANT',
              analyzedAt: new Date().toISOString(),
              source: det.source || 'deterministic',
              ossStatus: det.ossStatus,
            };
            cache[email.id] = fullClassification;
            return { ...email, classification: fullClassification };
          }

          unclassifiedForAI.push(email);
          return email;
        });

        if (unclassifiedForAI.length > 0) {
          try {
            const aiPayload = unclassifiedForAI.slice(0, 15).map((e) => ({
              id: e.id,
              from: e.from,
              subject: e.subject,
              snippet: e.snippet,
              date: e.date,
              bodyPreview: e.bodyText.slice(0, 600),
            }));

            const aiRes = await fetch('/api/ai/classify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ emails: aiPayload }),
            });

            if (aiRes.ok) {
              const { results } = await aiRes.json();
              if (Array.isArray(results)) {
                results.forEach((resItem: any) => {
                  const target = classifiedEmails.find((e) => e.id === resItem.id);
                  if (target) {
                    const fullClass = {
                      category: resItem.category || 'IMPORTANT',
                      priority: (resItem.priority ?? 1) as PriorityLevel,
                      action_required: Boolean(resItem.action_required),
                      action: resItem.action || null,
                      repository: resItem.repository || null,
                      pr_number: resItem.pr_number || null,
                      confidence: resItem.confidence ?? 0.92,
                      reason: resItem.reason || 'Gemini contextual reasoning',
                      suggested_label: resItem.suggested_label || 'KAIRO/IMPORTANT',
                      key_takeaway: resItem.key_takeaway,
                      analyzedAt: new Date().toISOString(),
                      source: 'gemini' as const,
                    };
                    target.classification = fullClass;
                    cache[target.id] = fullClass;
                  }
                });
              }
            }
          } catch (err) {
            console.warn('AI classification pass skipped or partially failed:', err);
          }
        }

        saveClassificationCache(cache);
        setEmails(classifiedEmails);

        if (!isOnboardingCompleted()) {
          setShowFirstRunModal(true);
        }

        generateBriefingForEmails(classifiedEmails, user?.email || undefined);
      } catch (err: any) {
        console.error('Failed to sync Gmail:', err);
        setConnectionState('AUTH_ERROR');
      } finally {
        setIsSyncing(false);
      }
    },
    [preferences, user]
  );

  const generateBriefingForEmails = async (
    targetEmails: EmailMessage[],
    userEmailAddr?: string
  ) => {
    setIsGeneratingBriefing(true);
    try {
      const payload = targetEmails.slice(0, 40).map((e) => ({
        subject: e.subject,
        from: e.from,
        category: e.classification?.category || 'IMPORTANT',
        priority: e.classification?.priority ?? 1,
        action_required: Boolean(e.classification?.action_required),
        action: e.classification?.action,
        repository: e.classification?.repository,
        pr_number: e.classification?.pr_number,
        date: e.date,
      }));

      const res = await fetch('/api/ai/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: userEmailAddr, processedEmails: payload }),
      });

      if (res.ok) {
        const { briefing: generated } = await res.json();
        setBriefing({
          ...generated,
          generatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Briefing generation error:', err);
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setIsDemoMode(false);
        verifyAndLoadGmail(result.accessToken, result.user);
      }
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      setAuthError(err.message || 'Authentication failed. Please check permissions.');
      setConnectionState('AUTH_ERROR');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setIsDemoMode(true);
    setConnectionState('SANDBOX_ACTIVE');
    loadDemoData();
  };

  const handleProvisionLabels = async () => {
    if (!token) {
      const log = recordAuditLog({
        actionType: 'LABEL_CREATED',
        description: 'Simulated KAIRO standard labels hierarchy in sandbox',
        status: 'executed',
      });
      setAuditLogs((prev) => [log, ...prev]);
      return;
    }

    setIsProvisioningLabels(true);
    try {
      await ensureKairoLabels(token);
      const log = recordAuditLog({
        actionType: 'LABEL_CREATED',
        description: 'Successfully verified & provisioned KAIRO label hierarchy in Gmail account',
        status: 'executed',
      });
      setAuditLogs((prev) => [log, ...prev]);
    } catch (err: any) {
      console.error('Label provision failed:', err);
    } finally {
      setIsProvisioningLabels(false);
    }
  };

  const handleArchiveEmail = (email: EmailMessage) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Archive Conversation',
      description: `Archive "${email.subject}"? This removes the message from INBOX and organizes it under its classified label.`,
      details: [`From: ${email.fromName}`, `Subject: ${email.subject}`],
      isDestructive: false,
      actionLabel: preferences.dryRunMode ? 'Simulate Archival' : 'Archive in Gmail',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

        if (preferences.dryRunMode || !token) {
          const log = recordAuditLog({
            actionType: 'MESSAGE_ARCHIVED',
            description: `[DRY-RUN] Archival simulated for "${email.subject}"`,
            messageId: email.id,
            status: 'preview',
          });
          setAuditLogs((prev) => [log, ...prev]);
          setEmails((prev) => prev.filter((e) => e.id !== email.id));
          return;
        }

        try {
          await archiveGmailMessage(token, email.id);
          const log = recordAuditLog({
            actionType: 'MESSAGE_ARCHIVED',
            description: `Archived email "${email.subject}" from inbox`,
            messageId: email.id,
            status: 'executed',
          });
          setAuditLogs((prev) => [log, ...prev]);
          setEmails((prev) => prev.filter((e) => e.id !== email.id));
          if (selectedEmail?.id === email.id) setSelectedEmail(null);
        } catch (err: any) {
          alert(`Failed to archive in Gmail: ${err.message}`);
        }
      },
    });
  };

  const handleBatchArchive = (emailIds: string[]) => {
    const targetEmails = emails.filter((e) => emailIds.includes(e.id));
    if (targetEmails.length === 0) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Batch Archive Clutter',
      description: `Archive ${targetEmails.length} selected email(s)? These messages will be safely removed from INBOX.`,
      details: targetEmails.slice(0, 4).map((e) => `${e.fromName}: ${e.subject}`),
      isDestructive: false,
      actionLabel: preferences.dryRunMode ? 'Simulate Batch Archival' : `Archive ${targetEmails.length} Messages`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

        if (preferences.dryRunMode || !token) {
          const log = recordAuditLog({
            actionType: 'MESSAGE_ARCHIVED',
            description: `[DRY-RUN] Batch archival simulated for ${targetEmails.length} emails`,
            status: 'preview',
            details: { count: targetEmails.length },
          });
          setAuditLogs((prev) => [log, ...prev]);
          setEmails((prev) => prev.filter((e) => !emailIds.includes(e.id)));
          return;
        }

        try {
          for (const email of targetEmails) {
            await archiveGmailMessage(token, email.id);
          }
          const log = recordAuditLog({
            actionType: 'MESSAGE_ARCHIVED',
            description: `Batch archived ${targetEmails.length} messages from inbox`,
            status: 'executed',
            details: { count: targetEmails.length },
          });
          setAuditLogs((prev) => [log, ...prev]);
          setEmails((prev) => prev.filter((e) => !emailIds.includes(e.id)));
        } catch (err: any) {
          alert(`Failed during batch archive: ${err.message}`);
        }
      },
    });
  };

  const handleApplyLabel = async (email: EmailMessage, labelName: string) => {
    if (preferences.dryRunMode || !token) {
      const log = recordAuditLog({
        actionType: 'LABEL_APPLIED',
        description: `[DRY-RUN] Applied label "${labelName}" to "${email.subject}"`,
        messageId: email.id,
        status: 'preview',
      });
      setAuditLogs((prev) => [log, ...prev]);
      return;
    }

    try {
      const labelMap = await ensureKairoLabels(token);
      const labelId = labelMap[labelName];
      if (labelId) {
        await modifyGmailMessageLabels(token, email.id, [labelId], []);
        const log = recordAuditLog({
          actionType: 'LABEL_APPLIED',
          description: `Applied label "${labelName}" in Gmail to "${email.subject}"`,
          messageId: email.id,
          status: 'executed',
        });
        setAuditLogs((prev) => [log, ...prev]);
      }
    } catch (err: any) {
      alert(`Failed to apply label: ${err.message}`);
    }
  };

  const handleCreateDraft = async (
    to: string,
    subject: string,
    body: string,
    threadId: string
  ) => {
    if (!token) {
      const log = recordAuditLog({
        actionType: 'DRAFT_CREATED',
        description: `[SANDBOX] Created draft reply to ${to}: "${subject}"`,
        threadId,
        status: 'executed',
      });
      setAuditLogs((prev) => [log, ...prev]);
      return;
    }

    await createGmailDraft(token, { to, subject, body, threadId });
    const log = recordAuditLog({
      actionType: 'DRAFT_CREATED',
      description: `Created draft in Gmail to ${to}: "${subject}"`,
      threadId,
      status: 'executed',
    });
    setAuditLogs((prev) => [log, ...prev]);
  };

  const handleSendMessage = async (
    to: string,
    subject: string,
    body: string,
    threadId: string
  ) => {
    return new Promise<void>((resolve, reject) => {
      setConfirmDialog({
        isOpen: true,
        title: 'Approve & Send Email',
        description: `Are you sure you want to send this email to ${to}? This will immediately transmit the message via your Gmail account.`,
        details: [`Recipient: ${to}`, `Subject: ${subject}`, `Excerpt: ${body.slice(0, 100)}...`],
        isDestructive: false,
        actionLabel: 'Confirm & Send',
        onConfirm: async () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

          if (!token) {
            const log = recordAuditLog({
              actionType: 'MESSAGE_SENT',
              description: `[SANDBOX] Sent email to ${to}: "${subject}"`,
              threadId,
              status: 'executed',
            });
            setAuditLogs((prev) => [log, ...prev]);
            resolve();
            return;
          }

          try {
            await sendGmailMessage(token, { to, subject, body, threadId });
            const log = recordAuditLog({
              actionType: 'MESSAGE_SENT',
              description: `Sent email via Gmail to ${to}: "${subject}"`,
              threadId,
              status: 'executed',
            });
            setAuditLogs((prev) => [log, ...prev]);
            resolve();
          } catch (err: any) {
            reject(err);
          }
        },
      });
    });
  };

  const handleSaveCorrection = (
    emailId: string,
    newCategory: EmailCategory,
    newPriority: PriorityLevel,
    alwaysPrioritize: boolean,
    neverArchive: boolean
  ) => {
    const targetEmail = emails.find((e) => e.id === emailId);
    if (!targetEmail) return;

    const updatedClass = {
      ...(targetEmail.classification || {
        action_required: false,
        action: null,
        repository: null,
        pr_number: null,
        confidence: 1.0,
        suggested_label: `KAIRO/${newCategory}`,
        analyzedAt: new Date().toISOString(),
      }),
      category: newCategory,
      priority: newPriority,
      source: 'user_override' as const,
      reason: `User corrected to ${newCategory} (P${newPriority})`,
    };

    setEmails((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, classification: updatedClass } : e))
    );

    const cache = loadClassificationCache();
    cache[emailId] = updatedClass;
    saveClassificationCache(cache);

    const newPrefs = { ...preferences };
    if (alwaysPrioritize) {
      newPrefs.alwaysPrioritizeSenders = Array.from(
        new Set([...newPrefs.alwaysPrioritizeSenders, targetEmail.fromAddress.toLowerCase()])
      );
    }
    if (neverArchive) {
      newPrefs.neverArchiveSenders = Array.from(
        new Set([...newPrefs.neverArchiveSenders, targetEmail.fromAddress.toLowerCase()])
      );
    }
    newPrefs.senderCategoryOverrides[targetEmail.fromAddress.toLowerCase()] = newCategory;
    setPreferences(newPrefs);
    saveUserPreferences(newPrefs);

    const log = recordAuditLog({
      actionType: 'CLASSIFICATION_CORRECTED',
      description: `User corrected "${targetEmail.subject}" to ${newCategory} (P${newPriority}) and trained preferences`,
      messageId: emailId,
      status: 'executed',
    });
    setAuditLogs((prev) => [log, ...prev]);
  };

  const handleCompleteFirstRun = async (
    createLabels: boolean,
    enableDryRun: boolean
  ) => {
    setOnboardingCompleted(true);
    const updatedPrefs = { ...preferences, dryRunMode: enableDryRun };
    setPreferences(updatedPrefs);
    saveUserPreferences(updatedPrefs);

    if (createLabels && token) {
      await handleProvisionLabels();
    }
  };

  const handleExecuteChatAction = async (action: ChatSuggestedAction) => {
    if (action.actionType === 'create_draft') {
      const { to, subject, body, threadId } = action.payload;
      await handleCreateDraft(to, subject, body, threadId);
    } else if (action.actionType === 'archive') {
      const emailId = action.payload.emailId;
      const target = emails.find((e) => e.id === emailId);
      if (target) handleArchiveEmail(target);
    } else if (action.actionType === 'apply_label') {
      const { emailId, labelName } = action.payload;
      const target = emails.find((e) => e.id === emailId);
      if (target && labelName) handleApplyLabel(target, labelName);
    } else if (action.actionType === 'open_thread') {
      const emailId = action.payload.emailId;
      const target = emails.find((e) => e.id === emailId);
      if (target) setSelectedEmail(target);
    }
  };

  // Nav configuration (Refined Navigation Rail)
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    {
      id: 'priority',
      label: 'Priority Inbox',
      icon: ShieldAlert,
      badge: emails.filter((e) => (e.classification?.priority ?? 3) <= 1).length,
    },
    { id: 'chat', label: 'Chat with KAIRO', icon: MessageSquare, isChat: true },
    {
      id: 'oss',
      label: 'OSS Intelligence',
      icon: GitPullRequest,
      badge: ossItems.filter((i) => i.ossStatus === 'ACTION_REQUIRED').length,
    },
    { id: 'personal', label: 'Personal & Academic', icon: GraduationCap },
    { id: 'career', label: 'Career', icon: Briefcase },
    { id: 'all', label: 'All Mail', icon: Inbox },
    { id: 'newsletters', label: 'Archive & Newsletters', icon: Newspaper },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'history', label: 'Operations History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-canvas)] text-[var(--color-text-primary)] font-sans antialiased">
      {/* Refined Compact Navigation Rail */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 ${
          isSidebarCollapsed ? 'w-16' : 'w-60'
        } bg-[var(--color-surface-main)] border-r border-[var(--color-border)] flex flex-col transition-all duration-200 ease-in-out md:static ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Banner */}
        <div className="h-16 px-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-7 h-7 bg-[var(--color-forest)] text-[var(--color-canvas)] font-editorial font-bold flex items-center justify-center text-sm shrink-0">
              K
            </div>
            {!isSidebarCollapsed && (
              <div>
                <span className="font-editorial text-xl font-normal text-[var(--color-text-primary)] tracking-wide leading-none block">
                  KAIRO
                </span>
                <span className="font-mono-tech text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider block mt-0.5">
                  The Archive
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              title={isSidebarCollapsed ? 'Expand rail' : 'Collapse rail'}
            >
              {isSidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real Status Badge Strip */}
        {!isSidebarCollapsed && (
          <div className="px-4 py-2 border-b border-[var(--color-border)] flex items-center justify-between text-[10px] font-mono-tech text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)]/50">
            <div className="flex items-center gap-1.5 truncate">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  connectionState === 'LIVE_CONNECTED'
                    ? 'bg-[var(--color-forest)]'
                    : connectionState === 'SANDBOX_ACTIVE'
                    ? 'bg-[var(--color-brass)]'
                    : 'bg-[var(--color-oxide)]'
                }`}
              />
              <span className="truncate">
                {connectionState === 'LIVE_CONNECTED'
                  ? 'Live Gmail'
                  : connectionState === 'SANDBOX_ACTIVE'
                  ? 'Sandbox'
                  : 'Disconnected'}
              </span>
            </div>
            {preferences.dryRunMode && (
              <span className="text-[10px] text-[var(--color-brass)] font-semibold uppercase">
                Dry-run
              </span>
            )}
          </div>
        )}

        {/* Navigation Rail Items */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center ${
                  isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'
                } py-2 text-xs transition-colors ${
                  isActive
                    ? 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] font-semibold border-l-2 border-[var(--color-forest)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                }`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[var(--color-forest)]' : 'text-[var(--color-text-secondary)]'
                    }`}
                  />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isSidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="font-mono-tech text-[10px] text-[var(--color-text-secondary)]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Actions & Rail Controls */}
        <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-surface-main)] space-y-2">
          {/* Usability Testing Suite Launcher */}
          {!isSidebarCollapsed ? (
            <button
              onClick={() => setShowUsabilityTestingModal(true)}
              className="w-full py-1.5 px-2 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] hover:border-[var(--color-forest)] text-[var(--color-text-primary)] text-xs flex items-center justify-center gap-1.5 transition-colors font-medium"
            >
              <FlaskConical className="w-3.5 h-3.5 text-[var(--color-forest)]" />
              <span>Usability Testing Suite</span>
            </button>
          ) : (
            <button
              onClick={() => setShowUsabilityTestingModal(true)}
              className="w-full p-2 flex items-center justify-center text-[var(--color-forest)] hover:bg-[var(--color-surface-secondary)]"
              title="Launch Usability Testing Suite"
            >
              <FlaskConical className="w-4 h-4" />
            </button>
          )}

          {/* Theme Switcher */}
          {!isSidebarCollapsed && (
            <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] px-1">
              <span className="text-[11px] font-mono-tech">Theme</span>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 text-[11px] font-mono-tech"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span className="capitalize">{theme}</span>
              </button>
            </div>
          )}

          {/* Account Profile / Disconnect */}
          {user ? (
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} text-xs pt-1`}>
              {!isSidebarCollapsed && (
                <div className="truncate pr-2">
                  <div className="font-medium text-[var(--color-text-primary)] truncate text-xs">
                    {user.displayName || 'Joel Jigo'}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-secondary)] font-mono-tech truncate">
                    {user.email}
                  </div>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-oxide)]"
                title="Disconnect Account"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            !isSidebarCollapsed && (
              <div className="space-y-1 pt-1">
                <button
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="w-full py-1.5 px-2 bg-[var(--color-forest)] text-[var(--color-canvas)] font-medium text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{isSigningIn ? 'Connecting...' : 'Connect Gmail'}</span>
                </button>
              </div>
            )
          )}
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[var(--color-canvas)]">
        {/* Top Header Rail */}
        <header className="h-16 px-6 border-b border-[var(--color-border)] bg-[var(--color-surface-main)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="text-xs text-[var(--color-text-secondary)] flex items-center gap-2">
              <span className="font-editorial text-lg text-[var(--color-text-primary)]">
                {navItems.find((n) => n.id === activeTab)?.label}
              </span>
              <span>/</span>
              <span className="font-mono-tech text-[11px] text-[var(--color-text-secondary)]">
                {connectionState === 'LIVE_CONNECTED'
                  ? `Live: ${gmailProfile?.emailAddress || user?.email || 'Authenticated'} · ${gmailProfile ? `${gmailProfile.messagesTotal.toLocaleString()} messages` : 'Verified'}`
                  : connectionState === 'SANDBOX_ACTIVE'
                  ? 'Archive Sandbox · Demo Data'
                  : connectionState === 'CONNECTING'
                  ? 'Connecting to Gmail...'
                  : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Multi-Device Management Quick Launch */}
            <button
              onClick={() => setShowDevicesModal(true)}
              className="px-2.5 py-1 text-xs border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-forest)] transition-colors flex items-center gap-1 font-mono-tech"
              title="Manage Authorized Devices"
            >
              <Smartphone className="w-3 h-3 text-[var(--color-forest)]" />
              <span className="hidden sm:inline">Devices</span>
            </button>

            {/* Usability Testing Quick Launch */}
            <button
              onClick={() => setShowUsabilityTestingModal(true)}
              className="px-2.5 py-1 text-xs border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-forest)] transition-colors flex items-center gap-1 font-mono-tech"
            >
              <FlaskConical className="w-3 h-3 text-[var(--color-forest)]" />
              <span className="hidden sm:inline">Testing Mode</span>
            </button>

            {connectionState === 'LIVE_CONNECTED' && (
              <button
                onClick={() => token && loadRealGmailData(token)}
                disabled={isSyncing}
                className="px-3 py-1 text-xs bg-[var(--color-forest)] text-[var(--color-canvas)] hover:opacity-90 flex items-center gap-1.5 transition-opacity disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Live'}</span>
              </button>
            )}

            {isDemoMode && (
              <button
                onClick={() => {
                  setIsDemoMode(false);
                  if (token && user) verifyAndLoadGmail(token, user);
                }}
                className="px-2.5 py-1 text-xs border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-forest)] font-mono-tech"
              >
                Switch to Live
              </button>
            )}
          </div>
        </header>

        {/* Cross-Platform Offline & Synchronization Banner */}
        <OfflineSyncBanner
          isOnline={syncState.isOnline}
          lastSyncedTimestamp={syncState.lastSyncedTimestamp}
          pendingQueueCount={syncState.pendingQueue.length}
          onManualSync={() => {
            if (token) loadRealGmailData(token);
            else loadDemoData();
          }}
          isSyncing={isSyncing}
        />

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 md:pb-8">
          {connectionState === 'DISCONNECTED' ? (
            /* Disconnected Welcome & Connect Screen */
            <div className="max-w-lg mx-auto my-16 p-8 bg-[var(--color-surface-main)] border border-[var(--color-border)] text-center space-y-6">
              <span className="font-mono-tech text-xs uppercase tracking-wider text-[var(--color-forest)]">
                KAIRO · Personal Email Intelligence
              </span>
              <h2 className="font-editorial text-3xl text-[var(--color-text-primary)] font-normal">
                Connect your correspondence archive.
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                KAIRO requires authorized read and label modification permissions to prioritize important emails, organize open-source activity, and draft responses.
              </p>

              {authError && (
                <div className="p-3 bg-[var(--color-surface-secondary)] border border-[var(--color-oxide)] text-xs text-[var(--color-oxide)] flex items-center gap-2 text-left font-mono-tech">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="px-5 py-2.5 bg-[var(--color-forest)] text-[var(--color-canvas)] font-medium text-xs flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                >
                  <Shield className="w-4 h-4" />
                  <span>{isSigningIn ? 'Connecting to Google...' : 'Authorize Gmail Account'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsDemoMode(true);
                    setConnectionState('SANDBOX_ACTIVE');
                    loadDemoData();
                  }}
                  className="px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs hover:border-[var(--color-forest)]"
                >
                  Explore Archive Sandbox
                </button>
              </div>
            </div>
          ) : (
            <>
              {authError && connectionState === 'AUTH_ERROR' && (
                <div className="mb-6 p-4 bg-[var(--color-surface-main)] border border-[var(--color-oxide)] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[var(--color-oxide)] font-mono-tech">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                  <button
                    onClick={handleSignIn}
                    disabled={isSigningIn}
                    className="px-3 py-1.5 bg-[var(--color-forest)] text-[var(--color-canvas)] text-xs font-mono-tech hover:opacity-90 shrink-0 self-start sm:self-auto"
                  >
                    {isSigningIn ? 'Connecting...' : 'Re-authorize Account'}
                  </button>
                </div>
              )}
              {activeTab === 'overview' && (
                <OverviewView
                  emails={emails}
                  ossItems={ossItems}
                  briefing={briefing}
                  isGeneratingBriefing={isGeneratingBriefing}
                  onRefreshBriefing={() =>
                    generateBriefingForEmails(emails, user?.email || undefined)
                  }
                  onSelectEmail={setSelectedEmail}
                  onNavigateTab={setActiveTab}
                  dryRunMode={preferences.dryRunMode}
                  isDemoMode={isDemoMode}
                  onSync={() => {
                    if (token) loadRealGmailData(token);
                    else loadDemoData();
                  }}
                  isSyncing={isSyncing}
                  userName={user?.displayName?.split(' ')[0] || 'Joel'}
                />
              )}

              {activeTab === 'priority' && (
                <PriorityInboxView
                  emails={emails}
                  onSelectEmail={setSelectedEmail}
                  onOpenReply={setReplyingEmail}
                  onOpenCorrection={setCorrectingEmail}
                  onArchiveEmail={handleArchiveEmail}
                />
              )}

              {activeTab === 'chat' && (
                <ChatWithKairoView
                  emails={emails}
                  userEmail={user?.email || null}
                  preferences={preferences}
                  onOpenEmail={setSelectedEmail}
                  onExecuteAction={handleExecuteChatAction}
                />
              )}

              {activeTab === 'oss' && (
                <OSSIntelligenceView
                  ossItems={ossItems}
                  onSelectEmail={setSelectedEmail}
                />
              )}

              {activeTab === 'personal' && (
                <PersonalAcademicView
                  emails={emails}
                  onSelectEmail={setSelectedEmail}
                  onOpenReply={setReplyingEmail}
                />
              )}

              {activeTab === 'career' && (
                <CareerView
                  emails={emails}
                  onSelectEmail={setSelectedEmail}
                  onOpenReply={setReplyingEmail}
                />
              )}

              {activeTab === 'all' && (
                <AllMailView
                  emails={emails}
                  onSelectEmail={setSelectedEmail}
                  onBatchArchive={handleBatchArchive}
                  onOpenCorrection={setCorrectingEmail}
                  onSearchQuerySubmit={async (q) => {
                    if (token) {
                      setIsSyncing(true);
                      try {
                        const { messages } = await listGmailMessages(token, { q, maxResults: 30 });
                        const fetched: EmailMessage[] = [];
                        for (const m of messages.slice(0, 15)) {
                          try {
                            const em = await getGmailMessage(token, m.id);
                            fetched.push(em);
                          } catch {}
                        }
                        setEmails(fetched);
                      } finally {
                        setIsSyncing(false);
                      }
                    }
                  }}
                />
              )}

              {activeTab === 'newsletters' && (
                <NewslettersView
                  emails={emails}
                  onSelectEmail={setSelectedEmail}
                  onBatchArchive={handleBatchArchive}
                  dryRunMode={preferences.dryRunMode}
                />
              )}

              {activeTab === 'history' && (
                <AuditLogView
                  logs={auditLogs}
                  onClearLogs={() => {
                    localStorage.removeItem('kairo_audit_log_v1');
                    setAuditLogs([]);
                  }}
                />
              )}

              {activeTab === 'search' && (
                <SmartSearchView
                  emails={emails}
                  onSelectEmail={setSelectedEmail}
                  onExecuteGmailQuery={async (q) => {
                    if (token) {
                      setIsSyncing(true);
                      try {
                        const { messages } = await listGmailMessages(token, { q, maxResults: 25 });
                        const fetched: EmailMessage[] = [];
                        for (const m of messages.slice(0, 15)) {
                          try {
                            const em = await getGmailMessage(token, m.id);
                            fetched.push(em);
                          } catch {}
                        }
                        setEmails(fetched);
                      } finally {
                        setIsSyncing(false);
                      }
                    }
                  }}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  preferences={preferences}
                  onUpdatePreferences={(newPrefs) => {
                    setPreferences(newPrefs);
                    saveUserPreferences(newPrefs);
                  }}
                  onProvisionLabels={handleProvisionLabels}
                  isProvisioningLabels={isProvisioningLabels}
                  userEmail={user?.email || null}
                  onSignOut={handleSignOut}
                  isDemoMode={isDemoMode}
                  onToggleDemoMode={() => {
                    const next = !isDemoMode;
                    setIsDemoMode(next);
                    if (!next && token && user) verifyAndLoadGmail(token, user);
                    else loadDemoData();
                  }}
                  theme={theme}
                  onToggleTheme={setTheme}
                />
              )}

              {activeTab === 'more' && (
                <MobileMoreHubView
                  onNavigateTab={setActiveTab}
                  onOpenDevices={() => setShowDevicesModal(true)}
                  onOpenBiometrics={() => setShowBiometricModal(true)}
                  onOpenUsabilityTesting={() => setShowUsabilityTestingModal(true)}
                  userEmail={user?.email || null}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Home, Inbox, Chat, OSS, More) */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadCount={emails.filter((e) => e.isUnread).length}
        criticalCount={emails.filter((e) => e.classification?.priority === 0).length}
      />

      {/* Cross-Platform Device Management Modal */}
      <DeviceManagementModal
        isOpen={showDevicesModal}
        onClose={() => setShowDevicesModal(false)}
        token={token}
        idTokenFetcher={async () => (user ? user.getIdToken() : null)}
      />

      {/* Biometric Authentication Enrollment Modal */}
      <BiometricAuthModal
        isOpen={showBiometricModal}
        onSuccess={() => setShowBiometricModal(false)}
        onCancel={() => setShowBiometricModal(false)}
        isEnrolling={true}
      />

      {/* Modals */}
      <ThreadDetailModal
        email={selectedEmail}
        isOpen={Boolean(selectedEmail)}
        onClose={() => setSelectedEmail(null)}
        onOpenReply={(email) => {
          setSelectedEmail(null);
          setReplyingEmail(email);
        }}
        onOpenCorrection={(email) => setCorrectingEmail(email)}
        onArchive={(email) => handleArchiveEmail(email)}
        onApplyLabel={(email, lbl) => handleApplyLabel(email, lbl)}
      />

      <ReplyComposerModal
        email={replyingEmail}
        isOpen={Boolean(replyingEmail)}
        onClose={() => setReplyingEmail(null)}
        onCreateDraft={handleCreateDraft}
        onSendMessage={handleSendMessage}
      />

      <ClassificationCorrectionModal
        email={correctingEmail}
        isOpen={Boolean(correctingEmail)}
        preferences={preferences}
        onSaveCorrection={handleSaveCorrection}
        onClose={() => setCorrectingEmail(null)}
      />

      <FirstRunModal
        isOpen={showFirstRunModal}
        userEmail={user?.email || 'User'}
        emails={emails}
        onCompleteFirstRun={handleCompleteFirstRun}
        onDismiss={() => setShowFirstRunModal(false)}
      />

      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        actionLabel={confirmDialog.actionLabel}
        isDestructive={confirmDialog.isDestructive}
        details={confirmDialog.details}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      <UsabilityTestingModule
        isOpen={showUsabilityTestingModal}
        onClose={() => setShowUsabilityTestingModal(false)}
        isDemoMode={isDemoMode}
        onToggleDemoMode={() => {
          const next = !isDemoMode;
          setIsDemoMode(next);
          if (!next && token && user) verifyAndLoadGmail(token, user);
          else loadDemoData();
        }}
        userEmail={user?.email || null}
        onConnectGmail={handleSignIn}
        onNavigateTab={setActiveTab}
      />
    </div>
  );
}
