import { EmailMessage, GmailLabel } from '../types/index.ts';

const GMAIL_BASE_URL = 'https://gmail.googleapis.com/gmail/v1/users/me';

export const KAIRO_STANDARD_LABELS = [
  'KAIRO/CRITICAL',
  'KAIRO/IMPORTANT',
  'KAIRO/OSS/ACTION-REQUIRED',
  'KAIRO/OSS/PR-MERGED',
  'KAIRO/OSS/REVIEWS',
  'KAIRO/OSS/CI-FAILURES',
  'KAIRO/OSS/GENERAL',
  'KAIRO/ACADEMICS',
  'KAIRO/CAREER',
  'KAIRO/PERSONAL',
  'KAIRO/FINANCIAL',
  'KAIRO/NEWSLETTERS',
  'KAIRO/PROMOTIONS',
  'KAIRO/SPAM-REVIEW',
];

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

/**
 * Fetches user profile from Gmail API to verify connection & account stats.
 */
export async function getGmailProfile(accessToken: string): Promise<GmailProfile> {
  const res = await fetch(`${GMAIL_BASE_URL}/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Gmail Profile API error (${res.status}): ${errorBody}`);
  }

  return await res.json();
}

/**
 * Base64 URL decoder that handles UTF-8 email text safely.
 */
function decodeBase64Url(base64UrlStr: string): string {
  try {
    let base64 = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (m) => m.codePointAt(0) || 0);
    return new TextDecoder('utf-8').decode(bytes);
  } catch (err) {
    try {
      return atob(base64UrlStr.replace(/-/g, '+').replace(/_/g, '/'));
    } catch {
      return '';
    }
  }
}

/**
 * Recursively extracts plain text and HTML from Gmail message payload parts.
 */
function extractBodyFromPayload(payload: any): { text: string; html: string } {
  let text = '';
  let html = '';

  if (!payload) return { text, html };

  if (payload.body && payload.body.data) {
    const decoded = decodeBase64Url(payload.body.data);
    if (payload.mimeType === 'text/html') {
      html += decoded;
    } else {
      text += decoded;
    }
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const partBody = extractBodyFromPayload(part);
      if (partBody.text) text += (text ? '\n' : '') + partBody.text;
      if (partBody.html) html += (html ? '\n' : '') + partBody.html;
    }
  }

  return { text, html };
}

/**
 * Parses raw Gmail message resource into clean EmailMessage domain object.
 */
export function parseGmailMessage(raw: any): EmailMessage {
  const headers = raw.payload?.headers || [];
  const getHeader = (name: string): string => {
    const h = headers.find((item: any) => item.name.toLowerCase() === name.toLowerCase());
    return h ? h.value : '';
  };

  const fromRaw = getHeader('From');
  let fromName = fromRaw;
  let fromAddress = fromRaw;
  const match = fromRaw.match(/(.*)<(.*)>/);
  if (match) {
    fromName = match[1].replace(/["']/g, '').trim();
    fromAddress = match[2].trim();
  }

  const { text, html } = extractBodyFromPayload(raw.payload);
  const labelIds = raw.labelIds || [];

  return {
    id: raw.id,
    threadId: raw.threadId,
    labelIds,
    snippet: raw.snippet || '',
    internalDate: raw.internalDate || Date.now().toString(),
    subject: getHeader('Subject') || '(No Subject)',
    from: fromRaw,
    fromName: fromName || fromAddress,
    fromAddress: fromAddress,
    to: getHeader('To'),
    date: getHeader('Date') || new Date(parseInt(raw.internalDate || Date.now().toString(), 10)).toLocaleString(),
    bodyText: text || raw.snippet || '',
    bodyHtml: html || undefined,
    isUnread: labelIds.includes('UNREAD'),
    isStarred: labelIds.includes('STARRED'),
    hasAttachments: Boolean(raw.payload?.parts?.some((p: any) => p.filename && p.filename.length > 0)),
  };
}

/**
 * Lists messages from Gmail with optional query and page tokens.
 */
export async function listGmailMessages(
  accessToken: string,
  options: { q?: string; maxResults?: number; pageToken?: string; labelIds?: string[] } = {}
): Promise<{ messages: { id: string; threadId: string }[]; nextPageToken?: string }> {
  const params = new URLSearchParams();
  if (options.q) params.set('q', options.q);
  if (options.maxResults) params.set('maxResults', options.maxResults.toString());
  if (options.pageToken) params.set('pageToken', options.pageToken);
  if (options.labelIds && options.labelIds.length > 0) {
    options.labelIds.forEach((id) => params.append('labelIds', id));
  }

  const res = await fetch(`${GMAIL_BASE_URL}/messages?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Gmail API error (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  return {
    messages: data.messages || [],
    nextPageToken: data.nextPageToken,
  };
}

/**
 * Retrieves a full Gmail message by ID.
 */
export async function getGmailMessage(accessToken: string, messageId: string): Promise<EmailMessage> {
  const res = await fetch(`${GMAIL_BASE_URL}/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch message ${messageId}: ${res.statusText}`);
  }

  const raw = await res.json();
  return parseGmailMessage(raw);
}

/**
 * Retrieves an entire thread by threadId.
 */
export async function getGmailThread(accessToken: string, threadId: string): Promise<EmailMessage[]> {
  const res = await fetch(`${GMAIL_BASE_URL}/threads/${threadId}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch thread ${threadId}: ${res.statusText}`);
  }

  const data = await res.json();
  const rawMessages = data.messages || [];
  return rawMessages.map(parseGmailMessage);
}

/**
 * Lists all labels currently defined in user's Gmail.
 */
export async function listGmailLabels(accessToken: string): Promise<GmailLabel[]> {
  const res = await fetch(`${GMAIL_BASE_URL}/labels`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Gmail labels: ${res.statusText}`);
  }

  const data = await res.json();
  return data.labels || [];
}

/**
 * Creates a Gmail label if it doesn't already exist.
 */
export async function createGmailLabel(accessToken: string, name: string): Promise<GmailLabel> {
  const res = await fetch(`${GMAIL_BASE_URL}/labels`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create label "${name}": ${err}`);
  }

  return await res.json();
}

/**
 * Ensures all KAIRO standard labels exist in user's Gmail account.
 * Reuses existing labels without creating duplicates.
 */
export async function ensureKairoLabels(accessToken: string): Promise<Record<string, string>> {
  const existingLabels = await listGmailLabels(accessToken);
  const labelMap: Record<string, string> = {};

  for (const label of existingLabels) {
    labelMap[label.name] = label.id;
  }

  for (const labelName of KAIRO_STANDARD_LABELS) {
    if (!labelMap[labelName]) {
      try {
        const created = await createGmailLabel(accessToken, labelName);
        labelMap[labelName] = created.id;
      } catch (err) {
        console.warn(`Could not create label ${labelName}:`, err);
      }
    }
  }

  return labelMap;
}

/**
 * Modifies labels on a message.
 */
export async function modifyGmailMessageLabels(
  accessToken: string,
  messageId: string,
  addLabelIds: string[] = [],
  removeLabelIds: string[] = []
): Promise<void> {
  const res = await fetch(`${GMAIL_BASE_URL}/messages/${messageId}/modify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      addLabelIds,
      removeLabelIds,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to modify labels on message ${messageId}: ${res.statusText}`);
  }
}

/**
 * Safely archives a message by removing the 'INBOX' label.
 * NEVER deletes messages!
 */
export async function archiveGmailMessage(accessToken: string, messageId: string): Promise<void> {
  await modifyGmailMessageLabels(accessToken, messageId, [], ['INBOX']);
}

/**
 * Encodes an RFC 2822 email string into base64url format for Gmail API.
 */
function createRawEmail(params: {
  to: string;
  subject: string;
  body: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
}): string {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}?=`;
  const messageParts = [
    `To: ${params.to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
  ];

  if (params.inReplyTo) {
    messageParts.push(`In-Reply-To: ${params.inReplyTo}`);
  }
  if (params.references) {
    messageParts.push(`References: ${params.references}`);
  }

  messageParts.push('', params.body);

  const raw = messageParts.join('\r\n');
  return btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Creates a Gmail draft message.
 */
export async function createGmailDraft(
  accessToken: string,
  params: {
    to: string;
    subject: string;
    body: string;
    threadId?: string;
  }
): Promise<{ id: string; message: { id: string; threadId: string } }> {
  const raw = createRawEmail(params);
  const payload: any = {
    message: {
      raw,
    },
  };
  if (params.threadId) {
    payload.message.threadId = params.threadId;
  }

  const res = await fetch(`${GMAIL_BASE_URL}/drafts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to create draft: ${res.statusText}`);
  }

  return await res.json();
}

/**
 * Sends an email on user's behalf.
 * MANDATORY: ONLY call after explicit user confirmation dialog!
 */
export async function sendGmailMessage(
  accessToken: string,
  params: {
    to: string;
    subject: string;
    body: string;
    threadId?: string;
  }
): Promise<{ id: string; threadId: string }> {
  const raw = createRawEmail(params);
  const payload: any = { raw };
  if (params.threadId) {
    payload.threadId = params.threadId;
  }

  const res = await fetch(`${GMAIL_BASE_URL}/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to send message: ${res.statusText}`);
  }

  return await res.json();
}
