export type PriorityLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type EmailCategory =
  | 'CRITICAL'
  | 'IMPORTANT'
  | 'OSS'
  | 'ACADEMIC'
  | 'CAREER'
  | 'PERSONAL'
  | 'FINANCIAL'
  | 'NEWSLETTER'
  | 'PROMOTION'
  | 'SUSPICIOUS';

export type OSSActionState =
  | 'ACTION_REQUIRED'
  | 'PROGRESS'
  | 'INFORMATIONAL'
  | 'NOISE';

export interface EmailHeader {
  name: string;
  value: string;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  subject: string;
  from: string;
  fromName: string;
  fromAddress: string;
  to: string;
  date: string;
  bodyText: string;
  bodyHtml?: string;
  isUnread: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  headers?: Record<string, string>;
  // KAIRO intelligence classification
  classification?: EmailClassification;
}

export interface EmailClassification {
  category: EmailCategory;
  priority: PriorityLevel;
  action_required: boolean;
  action: string | null;
  repository: string | null;
  pr_number: number | null;
  confidence: number;
  reason: string;
  suggested_label: string;
  key_takeaway?: string;
  analyzedAt: string;
  source: 'gemini' | 'deterministic' | 'user_override';
  ossStatus?: OSSActionState;
}

export interface OSSContributionItem {
  id: string;
  repository: string;
  prNumber: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  ossStatus: OSSActionState;
  latestUpdate: string;
  timestamp: string;
  ciStatus?: 'passing' | 'failing' | 'running' | 'unknown';
  maintainerResponse?: string;
  nextRequiredAction?: string;
  relatedEmails: EmailMessage[];
}

export interface GmailLabel {
  id: string;
  name: string;
  type: 'system' | 'user';
  messageListVisibility?: string;
  labelListVisibility?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actionType:
    | 'LABEL_CREATED'
    | 'LABEL_APPLIED'
    | 'MESSAGE_ARCHIVED'
    | 'DRAFT_CREATED'
    | 'MESSAGE_SENT'
    | 'CLASSIFICATION_CORRECTED';
  description: string;
  messageId?: string;
  threadId?: string;
  details?: Record<string, any>;
  status: 'executed' | 'preview' | 'undone';
}

export interface UserPreferences {
  dryRunMode: boolean;
  autoArchiveNoise: boolean;
  autoLabelCritical: boolean;
  autoLabelOSS: boolean;
  requireApprovalForArchiving: boolean;
  alwaysPrioritizeSenders: string[];
  neverArchiveSenders: string[];
  senderCategoryOverrides: Record<string, EmailCategory>;
}

export interface ExecutiveBriefing {
  headline: string;
  dateFormatted: string;
  criticalAlerts: Array<{ title: string; description: string; priority: number; source: string }>;
  importantUpdates: Array<{ title: string; sender: string; detail: string; actionNeeded?: string }>;
  ossHighlights: {
    prsRequiringAction: Array<{ repo: string; prNumber: number; title: string; neededAction: string }>;
    progressAndMerges: Array<{ repo: string; prNumber: number; title: string; status: string }>;
    ciFailures: Array<{ repo: string; prNumber?: number; title: string }>;
  };
  conversationsNeedingReply: Array<{ sender: string; subject: string; context: string }>;
  noiseSuppressedCount: number;
  recommendedActions: string[];
  generatedAt: string;
}

export type ThemeMode = 'dark' | 'light';

export interface ChatToolCall {
  name: string;
  args?: Record<string, any>;
  status: 'running' | 'completed' | 'failed';
  statusText?: string;
  resultSummary?: string;
}

export interface ChatSuggestedAction {
  id: string;
  label: string;
  description: string;
  actionType: 'create_draft' | 'archive' | 'apply_label' | 'mark_read' | 'open_thread';
  payload: Record<string, any>;
  requiresApproval?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolCalls?: ChatToolCall[];
  referencedEmailIds?: string[];
  suggestedActions?: ChatSuggestedAction[];
}

export interface ChatConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

