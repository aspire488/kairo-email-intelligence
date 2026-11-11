import {
  EmailMessage,
  EmailClassification,
  OSSActionState,
  OSSContributionItem,
  UserPreferences,
} from '../types/index.ts';

// GitHub notification pattern extractors
const GITHUB_SENDER_REGEX = /notifications@github\.com|noreply@github\.com/i;
const GITHUB_SUBJECT_PR_REGEX = /\[([^\]]+)\]\s+(?:Re:\s+)?(.+?)\s+\(#(\d+)\)/i;
const GITHUB_SUBJECT_ISSUE_REGEX = /\[([^\]]+)\]\s+(?:Re:\s+)?(.+?)\s+#(\d+)/i;
const CI_FAIL_KEYWORDS = /(workflow run failed|build failed|check_run failed|ci failed|failing checks|tests failed|action failed|job failed|continuous-integration.*failed)/i;
const PR_MERGED_KEYWORDS = /(merged pull request|merged #|pull request was merged)/i;
const PR_APPROVED_KEYWORDS = /(approved these changes|approved your pull request|approved this pull request)/i;
const PR_CHANGES_REQUESTED_KEYWORDS = /(requested changes|changes were requested|requested review from)/i;
const REBASE_KEYWORDS = /(rebase required|branch conflict|conflicts must be resolved)/i;

// Priority 0 critical patterns
const SECURITY_KEYWORDS = /(security alert|security incident|unauthorized access|suspicious login|account suspension|password reset request|critical vulnerability|breach alert)/i;
const FINANCIAL_ALERT_KEYWORDS = /(failed payment|payment failed|charge failed|fraud alert|card declined|wire transfer|tax form required|overdue invoice|invoice.*declined|billing.*failed|action required.*stripe)/i;

// Academic patterns
const ACADEMIC_DOMAINS = /(\.edu|canvas|blackboard|coursera|moodle|gradescope)/i;
const PROFESSOR_KEYWORDS = /(professor|syllabus|office hours|midterm|final exam|assignment grade|thesis advisor|dissertation)/i;

// Career patterns
const RECRUITER_KEYWORDS = /(recruiter|recruiting|internship|job opportunity|interview invitation|phone screen|coding assessment|onsite interview|offer letter|talent acquisition)/i;

// Noise / Promotions
const PROMO_KEYWORDS = /(unsubscribe|special offer|discount|sale ends|limited time only|promo code|click here to view in browser|webinar|register now|live event|virtual event)/i;
const NEWSLETTER_KEYWORDS = /(digest|roundup|weekly newsletter|edition #|issue #|bytes|bytebytego|tldr|changelog|newsletter|substack|#\d+:)/i;

/**
 * Deterministic classifier that quickly evaluates emails based on known headers, patterns, and user preferences.
 */
export function deterministicClassify(
  email: EmailMessage,
  preferences?: UserPreferences
): Partial<EmailClassification> | null {
  const from = email.from.toLowerCase();
  const subject = email.subject;
  const body = (email.bodyText || '').toLowerCase();
  const fullText = `${subject} ${email.snippet} ${body}`;

  // Check user preference overrides first
  if (preferences?.senderCategoryOverrides?.[email.fromAddress]) {
    const cat = preferences.senderCategoryOverrides[email.fromAddress];
    return {
      category: cat,
      priority: cat === 'CRITICAL' ? 0 : cat === 'IMPORTANT' ? 1 : 3,
      confidence: 1.0,
      reason: `User defined preference for sender ${email.fromAddress}`,
      suggested_label: `KAIRO/${cat}`,
      source: 'user_override',
    };
  }

  if (preferences?.alwaysPrioritizeSenders?.some((s) => email.fromAddress.toLowerCase().includes(s.toLowerCase()))) {
    return {
      category: 'IMPORTANT',
      priority: 1,
      action_required: true,
      action: 'Respond to prioritized contact',
      confidence: 0.99,
      reason: `Sender ${email.fromAddress} is marked as Always Prioritized`,
      suggested_label: 'KAIRO/IMPORTANT',
      source: 'user_override',
    };
  }

  // Suspicious / Phishing detection
  const isSpoofedBrand = (email.fromName?.toLowerCase().includes('google') || from.includes('admin') || from.includes('helpdesk')) &&
    !email.fromAddress.toLowerCase().endsWith('@google.com') &&
    (from.includes('.xyz') || from.includes('.top') || from.includes('.tk') || /quota exceeded|verify your identity|suspension pending|mailbox termination/i.test(fullText));

  if (isSpoofedBrand || /mailbox quota exceeded|suspension pending.*mailbox|verify your identity.*mailbox/i.test(fullText)) {
    return {
      category: 'SUSPICIOUS',
      priority: 5,
      action_required: true,
      action: 'Flagged for inspection: DO NOT CLICK LINKS (Suspected Phishing)',
      confidence: 0.99,
      reason: 'Obvious phishing attack impersonating Google with spoofed external domain',
      suggested_label: 'KAIRO/SPAM-REVIEW',
      source: 'deterministic',
    };
  }

  // 1. Critical security / financial detection
  if (SECURITY_KEYWORDS.test(subject) || (SECURITY_KEYWORDS.test(fullText) && (from.includes('google') || from.includes('github') || from.includes('aws') || from.includes('bank')))) {
    return {
      category: 'CRITICAL',
      priority: 0,
      action_required: true,
      action: 'Immediate security review required',
      confidence: 0.95,
      reason: 'Detected critical security alert or suspicious login activity',
      suggested_label: 'KAIRO/CRITICAL',
      source: 'deterministic',
    };
  }

  if (FINANCIAL_ALERT_KEYWORDS.test(subject)) {
    return {
      category: 'CRITICAL',
      priority: 0,
      action_required: true,
      action: 'Resolve payment or banking problem',
      confidence: 0.92,
      reason: 'Critical financial or billing problem detected',
      suggested_label: 'KAIRO/CRITICAL',
      source: 'deterministic',
    };
  }

  // 2. GitHub & Open Source Intelligence
  if (GITHUB_SENDER_REGEX.test(from) || from.includes('github.com')) {
    let repo: string | null = null;
    let prNum: number | null = null;

    const prMatch = subject.match(GITHUB_SUBJECT_PR_REGEX);
    if (prMatch) {
      repo = prMatch[1].trim();
      prNum = parseInt(prMatch[3], 10);
    } else {
      const issueMatch = subject.match(GITHUB_SUBJECT_ISSUE_REGEX);
      if (issueMatch) {
        repo = issueMatch[1].trim();
        prNum = parseInt(issueMatch[3], 10);
      }
    }

    // Determine OSS Action State
    let ossStatus: OSSActionState = 'INFORMATIONAL';
    let actionRequired = false;
    let actionDesc: string | null = null;
    let suggestedLabel = 'KAIRO/OSS/GENERAL';

    if (CI_FAIL_KEYWORDS.test(fullText)) {
      ossStatus = 'ACTION_REQUIRED';
      actionRequired = true;
      actionDesc = 'Fix broken CI build / failing tests';
      suggestedLabel = 'KAIRO/OSS/CI-FAILURES';
    } else if (PR_CHANGES_REQUESTED_KEYWORDS.test(fullText) || REBASE_KEYWORDS.test(fullText)) {
      ossStatus = 'ACTION_REQUIRED';
      actionRequired = true;
      actionDesc = 'Address maintainer change requests or conflicts';
      suggestedLabel = 'KAIRO/OSS/ACTION-REQUIRED';
    } else if (PR_MERGED_KEYWORDS.test(fullText)) {
      ossStatus = 'PROGRESS';
      actionRequired = false;
      actionDesc = 'PR successfully merged';
      suggestedLabel = 'KAIRO/OSS/PR-MERGED';
    } else if (PR_APPROVED_KEYWORDS.test(fullText)) {
      ossStatus = 'PROGRESS';
      actionRequired = false;
      actionDesc = 'Changes approved by maintainer';
      suggestedLabel = 'KAIRO/OSS/REVIEWS';
    } else if (fullText.includes('review requested') || fullText.includes('requested your review')) {
      ossStatus = 'ACTION_REQUIRED';
      actionRequired = true;
      actionDesc = 'Complete requested code review';
      suggestedLabel = 'KAIRO/OSS/REVIEWS';
    }

    return {
      category: 'OSS',
      priority: actionRequired ? 1 : 2,
      action_required: actionRequired,
      action: actionDesc,
      repository: repo,
      pr_number: prNum,
      confidence: 0.94,
      reason: `GitHub activity for ${repo || 'repository'} (#${prNum || 'thread'}) - ${ossStatus.replace('_', ' ')}`,
      suggested_label: suggestedLabel,
      source: 'deterministic',
      ossStatus,
    };
  }

  // 3. Career & Recruiters
  if (RECRUITER_KEYWORDS.test(subject) || (RECRUITER_KEYWORDS.test(fullText) && (from.includes('recruiting') || from.includes('talent') || from.includes('careers')))) {
    return {
      category: 'CAREER',
      priority: 1,
      action_required: true,
      action: 'Review opportunity and reply',
      confidence: 0.9,
      reason: 'Recruiter communication or job opportunity identified',
      suggested_label: 'KAIRO/CAREER',
      source: 'deterministic',
    };
  }

  // 4. Academic & Professors
  if (ACADEMIC_DOMAINS.test(from) || PROFESSOR_KEYWORDS.test(subject)) {
    return {
      category: 'ACADEMIC',
      priority: 1,
      action_required: true,
      action: 'Check academic notice or assignment',
      confidence: 0.88,
      reason: 'University or academic coursework communication',
      suggested_label: 'KAIRO/ACADEMICS',
      source: 'deterministic',
    };
  }

  // 5. Promotions & Low Value
  if (PROMO_KEYWORDS.test(subject) || (PROMO_KEYWORDS.test(fullText) && (from.includes('marketing') || from.includes('news') || from.includes('deal') || from.includes('events') || from.includes('promo') || subject.includes('% off')))) {
    return {
      category: 'PROMOTION',
      priority: 4,
      action_required: false,
      action: null,
      confidence: 0.91,
      reason: 'Marketing promotion or sales campaign detected',
      suggested_label: 'KAIRO/PROMOTIONS',
      source: 'deterministic',
    };
  }

  // 6. Newsletters
  if (NEWSLETTER_KEYWORDS.test(subject) || email.headers?.['list-unsubscribe']) {
    return {
      category: 'NEWSLETTER',
      priority: 3,
      action_required: false,
      action: null,
      confidence: 0.86,
      reason: 'Scheduled newsletter or technology digest',
      suggested_label: 'KAIRO/NEWSLETTERS',
      source: 'deterministic',
    };
  }

  return null;
}

/**
 * Consolidates individual GitHub email messages into grouped PR / Repository tracking entities.
 */
export function aggregateOSSContributions(emails: EmailMessage[]): OSSContributionItem[] {
  const ossMap = new Map<string, OSSContributionItem>();

  for (const email of emails) {
    const classification = email.classification;
    if (classification?.category !== 'OSS' && !email.from.includes('github.com')) continue;

    const repo = classification?.repository || 'github/repository';
    const prNum = classification?.pr_number || 0;
    const key = `${repo}#${prNum}`;

    const existing = ossMap.get(key);
    const dateObj = new Date(email.date);
    const timestampStr = isNaN(dateObj.getTime()) ? email.date : dateObj.toISOString();

    const isCiFailure =
      classification?.suggested_label === 'KAIRO/OSS/CI-FAILURES' ||
      CI_FAIL_KEYWORDS.test(email.subject) ||
      CI_FAIL_KEYWORDS.test(email.snippet);
    const isMerged =
      classification?.suggested_label === 'KAIRO/OSS/PR-MERGED' ||
      PR_MERGED_KEYWORDS.test(email.subject);
    const isChangesReq =
      classification?.suggested_label === 'KAIRO/OSS/ACTION-REQUIRED' ||
      PR_CHANGES_REQUESTED_KEYWORDS.test(email.subject);
    const isApproved =
      classification?.suggested_label === 'KAIRO/OSS/REVIEWS' ||
      PR_APPROVED_KEYWORDS.test(email.subject);

    let calculatedStatus: OSSActionState = 'INFORMATIONAL';
    let calculatedAction = classification?.action || undefined;

    if (isCiFailure) {
      calculatedStatus = 'ACTION_REQUIRED';
      calculatedAction = 'Fix CI failure in automated checks';
    } else if (isChangesReq) {
      calculatedStatus = 'ACTION_REQUIRED';
      calculatedAction = 'Update PR according to reviewer feedback';
    } else if (isMerged) {
      calculatedStatus = 'PROGRESS';
      calculatedAction = undefined;
    } else if (isApproved) {
      calculatedStatus = 'PROGRESS';
      calculatedAction = 'Approved - Ready to merge if authorized';
    }

    if (!existing) {
      ossMap.set(key, {
        id: key,
        repository: repo,
        prNumber: prNum,
        title: email.subject.replace(/\[[^\]]+\]\s*/, '').replace(/\(#\d+\)/, '').trim(),
        state: isMerged ? 'merged' : 'open',
        ossStatus: calculatedStatus,
        latestUpdate: email.snippet,
        timestamp: timestampStr,
        ciStatus: isCiFailure ? 'failing' : isMerged || isApproved ? 'passing' : 'unknown',
        maintainerResponse: email.fromName !== 'GitHub' ? `${email.fromName}: ${email.snippet.slice(0, 100)}` : undefined,
        nextRequiredAction: calculatedAction,
        relatedEmails: [email],
      });
    } else {
      existing.relatedEmails.push(email);
      // Prioritize actionable state if any notification in thread is actionable
      if (calculatedStatus === 'ACTION_REQUIRED') {
        existing.ossStatus = 'ACTION_REQUIRED';
        existing.nextRequiredAction = calculatedAction;
      } else if (calculatedStatus === 'PROGRESS' && existing.ossStatus !== 'ACTION_REQUIRED') {
        existing.ossStatus = 'PROGRESS';
      }
      if (isCiFailure) existing.ciStatus = 'failing';
      if (isMerged) existing.state = 'merged';
    }
  }

  return Array.from(ossMap.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Detects duplicate notifications from the same sender or thread with identical subjects.
 */
export function detectDuplicateEmails(emails: EmailMessage[]): Map<string, EmailMessage[]> {
  const groups = new Map<string, EmailMessage[]>();

  for (const email of emails) {
    // Group key based on normalized subject and sender
    const normSubject = email.subject.replace(/^(re|fwd):\s*/i, '').trim().toLowerCase();
    const key = `${email.fromAddress}::${normSubject}`;

    const existing = groups.get(key) || [];
    existing.push(email);
    groups.set(key, existing);
  }

  // Filter to only groups with duplicates (> 1)
  const duplicates = new Map<string, EmailMessage[]>();
  for (const [key, list] of groups.entries()) {
    if (list.length > 1) {
      duplicates.set(key, list);
    }
  }

  return duplicates;
}
