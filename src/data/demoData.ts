import { EmailMessage } from '../types/index.ts';

export const DEMO_EMAILS: EmailMessage[] = [
  {
    id: 'demo_msg_001',
    threadId: 'demo_thread_001',
    labelIds: ['INBOX', 'UNREAD'],
    snippet: 'AWS Security Alert: Root login detected from new IP address (185.220.101.45) in Frankfurt, Germany. If this was not you, rotate credentials immediately.',
    internalDate: (Date.now() - 1000 * 60 * 35).toString(),
    subject: '[URGENT] AWS Security Incident: Root account access from unrecognized IP',
    from: 'AWS Security Notifications <no-reply-aws@amazon.com>',
    fromName: 'AWS Security Team',
    fromAddress: 'no-reply-aws@amazon.com',
    to: 'joeljigo3@gmail.com',
    date: new Date(Date.now() - 1000 * 60 * 35).toUTCString(),
    bodyText: `Dear AWS Customer,

At 2026-11-08 12:45 UTC, we detected a console login to your AWS Root Account from an unrecognized IP address: 185.220.101.45 (Frankfurt, Germany).

Immediate Actions Required:
1. Sign in to your AWS IAM Identity Center or Root Console.
2. Verify all active access keys and rotate any suspicious credentials.
3. Check CloudTrail event logs for unauthorized API calls.

If you did not authorize this login, please contact AWS Security Incident Response immediately.`,
    isUnread: true,
    isStarred: true,
    hasAttachments: false,
    classification: {
      category: 'CRITICAL',
      priority: 0,
      action_required: true,
      action: 'Immediate security review: rotate credentials & check CloudTrail',
      repository: null,
      pr_number: null,
      confidence: 0.98,
      reason: 'Root console login from unrecognized geographic IP',
      suggested_label: 'KAIRO/CRITICAL',
      key_takeaway: 'AWS Root account accessed from unknown IP; credentials must be verified.',
      analyzedAt: new Date().toISOString(),
      source: 'deterministic',
    },
  },
  {
    id: 'demo_msg_002',
    threadId: 'demo_thread_002',
    labelIds: ['INBOX', 'UNREAD'],
    snippet: 'Hi Joel, we loved your open-source contributions to Vite and React compiler. We would love to invite you for an interview for our Software Systems Internship.',
    internalDate: (Date.now() - 1000 * 60 * 120).toString(),
    subject: 'Interview Invitation: Anthropic Systems & Infrastructure Internship (Summer 2027)',
    from: 'Elena Rostova <elena.rostova@recruiting.anthropic.com>',
    fromName: 'Elena Rostova (Anthropic)',
    fromAddress: 'elena.rostova@recruiting.anthropic.com',
    to: 'joeljigo3@gmail.com',
    date: new Date(Date.now() - 1000 * 60 * 120).toUTCString(),
    bodyText: `Hi Joel,

I came across your GitHub profile and your recent contributions to high-performance build tools and compiler runtimes. Our Systems & Inference team was very impressed by your work.

We would love to schedule a 45-minute technical conversation with one of our staff engineers next week to discuss your background and how you might contribute to our infrastructure.

Please reply with your availability for Tuesday or Thursday next week between 10am - 4pm PT.

Best regards,
Elena Rostova
University Talent Acquisition | Anthropic`,
    isUnread: true,
    isStarred: true,
    hasAttachments: false,
    classification: {
      category: 'CAREER',
      priority: 1,
      action_required: true,
      action: 'Respond with availability for technical interview',
      repository: null,
      pr_number: null,
      confidence: 0.96,
      reason: 'Recruiter invitation for competitive Systems Internship',
      suggested_label: 'KAIRO/CAREER',
      key_takeaway: 'Anthropic Systems internship interview invitation; awaiting your reply.',
      analyzedAt: new Date().toISOString(),
      source: 'deterministic',
    },
  },
  {
    id: 'demo_msg_003',
    threadId: 'demo_thread_003',
    labelIds: ['INBOX', 'UNREAD'],
    snippet: 'Please review the attached rubric for the Distributed Systems Capstone. Group presentations begin this Thursday in Hall 304.',
    internalDate: (Date.now() - 1000 * 60 * 240).toString(),
    subject: 'CS 4720: Capstone Presentation Schedule & Raft Consensus Deliverables',
    from: 'Prof. David K. Miller <d.miller@university.edu>',
    fromName: 'Prof. David K. Miller',
    fromAddress: 'd.miller@university.edu',
    to: 'joeljigo3@gmail.com',
    date: new Date(Date.now() - 1000 * 60 * 240).toUTCString(),
    bodyText: `Dear Distributed Systems Students,

As announced in lecture, final evaluations for the Raft consensus replication lab and capstone presentations will be held this Thursday starting at 1:30 PM.

Each team must submit:
1. Link to the private GitHub repository with bench test suite passes.
2. 5-page architectural summary document in PDF format.
3. Slide deck submitted via Canvas prior to 11:00 AM on Thursday.

Please let me know if your team has any scheduling conflicts.

Best,
Professor Miller`,
    isUnread: true,
    isStarred: false,
    hasAttachments: true,
    classification: {
      category: 'ACADEMIC',
      priority: 1,
      action_required: true,
      action: 'Finalize Raft benchmarks and submit slide deck by Thursday 11 AM',
      repository: null,
      pr_number: null,
      confidence: 0.94,
      reason: 'Official professor communication with immovable academic milestone',
      suggested_label: 'KAIRO/ACADEMICS',
      key_takeaway: 'Capstone presentation Thursday; deliverables due before 11 AM.',
      analyzedAt: new Date().toISOString(),
      source: 'deterministic',
    },
  },
  {
    id: 'demo_msg_004',
    threadId: 'demo_thread_004',
    labelIds: ['INBOX', 'UNREAD'],
    snippet: 'sebmarkbage requested changes on #29841 fix(compiler): preserve memoization keys in nested subtrees.',
    internalDate: (Date.now() - 1000 * 60 * 180).toString(),
    subject: '[facebook/react] Re: fix(compiler): preserve memoization keys in nested subtrees (#29841)',
    from: 'GitHub Notifications <notifications@github.com>',
    fromName: 'GitHub',
    fromAddress: 'notifications@github.com',
    to: 'joeljigo3@gmail.com',
    date: new Date(Date.now() - 1000 * 60 * 180).toUTCString(),
    bodyText: `sebmarkbage requested changes on your pull request #29841:

"Thanks for addressing this! The approach looks promising, but we cannot allocate a new Symbol during the render path without causing de-opts in V8 for large React trees.

Could you update the helper to use a bitmask comparison instead? Please see lines 42-58 in packages/react-compiler-runtime. Also ensure you add a fixture test covering nested Suspense boundaries."

View pull request on GitHub: https://github.com/facebook/react/pull/29841`,
    isUnread: true,
    isStarred: true,
    hasAttachments: false,
    classification: {
      category: 'OSS',
      priority: 1,
      action_required: true,
      action: 'Refactor helper to use bitmask comparison and add fixture test',
      repository: 'facebook/react',
      pr_number: 29841,
      confidence: 0.97,
      reason: 'Maintainer requested changes on active pull request #29841',
      suggested_label: 'KAIRO/OSS/ACTION-REQUIRED',
      key_takeaway: 'Changes requested by sebmarkbage on React PR #29841 regarding V8 allocation.',
      analyzedAt: new Date().toISOString(),
      source: 'deterministic',
      ossStatus: 'ACTION_REQUIRED',
    },
  },
  {
    id: 'demo_msg_005',
    threadId: 'demo_thread_005',
    labelIds: ['INBOX', 'UNREAD'],
    snippet: 'Workflow run failed: CI / Test Matrix (pull_request #6819) on node 22.x ubuntu-latest',
    internalDate: (Date.now() - 1000 * 60 * 95).toString(),
    subject: '[vitejs/vite] Workflow run failed: CI / Test Matrix (commit 4b8d10a on #6819)',
    from: 'GitHub <notifications@github.com>',
    fromName: 'GitHub Actions',
    fromAddress: 'notifications@github.com',
    to: 'joeljigo3@gmail.com',
    date: new Date(Date.now() - 1000 * 60 * 95).toUTCString(),
    bodyText: `GitHub Actions has completed with failure.

Repository: vitejs/vite
Workflow: CI / Test Matrix
Branch: fix/optimizer-wildcard-alias
Pull Request: #6819

Failed Steps:
- packages/vite/src/node/__tests__/optimizer.spec.ts: line 144: expected 2 modules resolved, received 1
- Node 22.x / Linux runner exited with code 1.

Click to view raw logs and failure trace: https://github.com/vitejs/vite/actions/runs/11492041`,
    isUnread: true,
    isStarred: false,
    hasAttachments: false,
    classification: {
      category: 'OSS',
      priority: 1,
      action_required: true,
      action: 'Fix optimizer.spec.ts assertion failure on Node 22 test runner',
      repository: 'vitejs/vite',
      pr_number: 6819,
      confidence: 0.95,
      reason: 'Automated CI/CD workflow failure on active PR branch',
      suggested_label: 'KAIRO/OSS/CI-FAILURES',
      key_takeaway: 'CI test matrix failed on Node 22 for optimizer-wildcard-alias branch.',
      analyzedAt: new Date().toISOString(),
      source: 'deterministic',
      ossStatus: 'ACTION_REQUIRED',
    },
  },
  {
    id: 'demo_msg_006',
    threadId: 'demo_thread_006',
    labelIds: ['INBOX'],
    snippet: 'timneutkens merged pull request vercel/next.js#71042 into canary.',
    internalDate: (Date.now() - 1000 * 60 * 420).toString(),
    subject: '[vercel/next.js] Re: perf(turbopack): inline small CSS modules during dev server build (#71042)',
    from: 'GitHub Notifications <notifications@github.com>',
    fromName: 'GitHub',
    fromAddress: 'notifications@github.com',
    to: 'joeljigo3@gmail.com',
    date: new Date(Date.now() - 1000 * 60 * 420).toUTCString(),
    bodyText: `Merged #71042 into canary.

timneutkens commented:
"Terrific work on this optimization! Benchmarks show a 14% drop in TTFB for CSS-heavy pages during local dev. Thanks for seeing this through!"

Status: MERGED
Branch deleted: joel/inline-small-css`,
    isUnread: false,
    isStarred: false,
    hasAttachments: false,
    classification: {
      category: 'OSS',
      priority: 2,
      action_required: false,
      action: null,
      repository: 'vercel/next.js',
      pr_number: 71042,
      confidence: 0.98,
      reason: 'PR #71042 successfully merged into upstream canary',
      suggested_label: 'KAIRO/OSS/PR-MERGED',
      key_takeaway: 'PR #71042 merged by timneutkens with +14% performance win.',
      analyzedAt: new Date().toISOString(),
      source: 'deterministic',
      ossStatus: 'PROGRESS',
    },
  },
  {
    id: 'demo_msg_007',
    threadId: 'demo_thread_007',
    labelIds: ['INBOX'],
    snippet: 'alexdotjs requested your review on pull request trpc/trpc#5422: feat: client-side batch prefetching adapter.',
    internalDate: (Date.now() - 1000 * 60 * 300).toString(),
    subject: '[trpc/trpc] Re: feat(client): batch prefetching adapter for React Query v5 (#5422)',
    from: 'GitHub <notifications@github.com>',
    fromName: 'GitHub',
    fromAddress: 'notifications@github.com',
    to: 'joeljigo3@gmail.com',
    date: new Date(Date.now() - 1000 * 60 * 300).toUTCString(),
    bodyText: `alexdotjs requested your review on #5422:

"Hey Joel, since you wrote the original query pipeline integration, would you mind sanity-checking this batching adapter before we tag the RC?"

Review requested: feat(client): batch prefetching adapter for React Query v5`,
    isUnread: false,
    isStarred: false,
    hasAttachments: false,
    classification: {
      category: 'OSS',
      priority: 1,
      action_required: true,
      action: 'Conduct requested code review on tRPC PR #5422',
      repository: 'trpc/trpc',
      pr_number: 5422,
      confidence: 0.93,
      reason: 'Direct maintainer review request on core client module',
      suggested_label: 'KAIRO/OSS/REVIEWS',
      key_takeaway: 'Alex requested your review on tRPC React Query v5 batch adapter.',
      analyzedAt: new Date().toISOString(),
      source: 'deterministic',
      ossStatus: 'ACTION_REQUIRED',
    },
  },
  {
    id: 'demo_msg_008',
    threadId: 'demo_thread_008',
    labelIds: ['INBOX', 'UNREAD'],
    snippet: 'Your invoice for Stripe developer platform usage was declined by your bank. Update payment method to prevent API interruption.',
    internalDate: (Date.now() - 1000 * 60 * 150).toString(),
    subject: '[Action Required] Failed payment for Stripe API Platform credits',
    from: 'Stripe Billing <support+billing@stripe.com>',
    fromName: 'Stripe Billing',
    fromAddress: 'support+billing@stripe.com',
    to: 'joeljigo3@gmail.com',
    date: new Date(Date.now() - 1000 * 60 * 150).toUTCString(),
    bodyText: `Hello Joel,

We were unable to process your scheduled charge of $48.20 for monthly API usage and webhook events on account acct_1Nx882K.

To avoid suspension of your live webhook endpoints and developer tokens, please update your payment method within 48 hours in the Stripe Dashboard.`,
    isUnread: true,
    isStarred: true,
    hasAttachments: false,
    classification: {
      category: 'FINANCIAL',
      priority: 0,
      action_required: true,
      action: 'Update payment method in Stripe Dashboard to avoid API suspension',
      repository: null,
      pr_number: null,
      confidence: 0.96,
      reason: 'Failed payment charge risking developer service interruption',
      suggested_label: 'KAIRO/FINANCIAL',
      key_takeaway: 'Stripe API payment failed; $48.20 overdue, update card to prevent cutoff.',
      analyzedAt: new Date().toISOString(),
      source: 'deterministic',
    },
  },
  {
    id: 'demo_msg_009',
    threadId: 'demo_thread_009',
    labelIds: ['INBOX'],
    snippet: 'ByteByteGo Newsletter: How Uber scales real-time geospatial dispatch using H3 and distributed actor systems.',
    internalDate: (Date.now() - 1000 * 60 * 600).toString(),
    subject: 'ByteByteGo #142: How Uber processes millions of rides per second',
    from: 'Alex Xu <alex@bytebytego.com>',
    fromName: 'Alex Xu (ByteByteGo)',
    fromAddress: 'alex@bytebytego.com',
    to: 'joeljigo3@gmail.com',
    date: new Date(Date.now() - 1000 * 60 * 600).toUTCString(),
    bodyText: `In this issue, we dive into the architectural mechanics of real-time geospatial routing, hexagonal hierarchical spatial indexing (H3), and ring buffers.

Read the full visual breakdown on Substack: https://bytebytego.com/p/uber-geospatial`,
    isUnread: false,
    isStarred: false,
    hasAttachments: false,
    classification: {
      category: 'NEWSLETTER',
      priority: 3,
      action_required: false,
      action: null,
      repository: null,
      pr_number: null,
      confidence: 0.92,
      reason: 'Scheduled educational engineering newsletter',
      suggested_label: 'KAIRO/NEWSLETTERS',
      key_takeaway: 'ByteByteGo architectural deep-dive into Uber geospatial dispatch.',
      analyzedAt: new Date().toISOString(),
      source: 'deterministic',
    },
  },
  {
    id: 'demo_msg_010',
    threadId: 'demo_thread_010',
    labelIds: ['INBOX'],
    snippet: 'Black Friday preview sale! Save 40% on Figma Organization seats for your design team.',
    internalDate: (Date.now() - 1000 * 60 * 800).toString(),
    subject: 'Special Offer: 40% off Figma Organization annual plans',
    from: 'Figma Marketing <promotions@figma.com>',
    fromName: 'Figma Promotions',
    fromAddress: 'promotions@figma.com',
    to: 'joeljigo3@gmail.com',
    date: new Date(Date.now() - 1000 * 60 * 800).toUTCString(),
    bodyText: `Upgrade your team workspace before December 1st to unlock advanced branching, design systems analytics, and enterprise SSO.

Claim this limited-time promotional rate today.`,
    isUnread: false,
    isStarred: false,
    hasAttachments: false,
    classification: {
      category: 'PROMOTION',
      priority: 4,
      action_required: false,
      action: null,
      repository: null,
      pr_number: null,
      confidence: 0.97,
      reason: 'Commercial marketing email; safe for automated archiving',
      suggested_label: 'KAIRO/PROMOTIONS',
      key_takeaway: 'Figma 40% discount marketing campaign.',
      analyzedAt: new Date().toISOString(),
      source: 'deterministic',
    },
  },
  {
    id: 'demo_msg_011',
    threadId: 'demo_thread_011',
    labelIds: ['INBOX'],
    snippet: 'Don\'t miss our upcoming webinar on zero-trust cloud network security.',
    internalDate: (Date.now() - 1000 * 60 * 1200).toString(),
    subject: 'Live Webinar Tomorrow: Modern Zero-Trust Architectures for Cloud',
    from: 'Cloudflare Events <events@cloudflare.com>',
    fromName: 'Cloudflare',
    fromAddress: 'events@cloudflare.com',
    to: 'joeljigo3@gmail.com',
    date: new Date(Date.now() - 1000 * 60 * 1200).toUTCString(),
    bodyText: `Join our principal solutions architect tomorrow at 11 AM PT for a live walkthrough on zero-trust access policies.

Register now with one click.`,
    isUnread: false,
    isStarred: false,
    hasAttachments: false,
    classification: {
      category: 'PROMOTION',
      priority: 4,
      action_required: false,
      action: null,
      repository: null,
      pr_number: null,
      confidence: 0.94,
      reason: 'Commercial promotional event invitation',
      suggested_label: 'KAIRO/PROMOTIONS',
      key_takeaway: 'Cloudflare webinar promotion.',
      analyzedAt: new Date().toISOString(),
      source: 'deterministic',
    },
  },
  {
    id: 'demo_msg_012',
    threadId: 'demo_thread_012',
    labelIds: ['INBOX', 'UNREAD'],
    snippet: 'ATTENTION: Your mail storage has exceeded quota. Click the link to prevent immediate mailbox suspension.',
    internalDate: (Date.now() - 1000 * 60 * 50).toString(),
    subject: 'Urgent Notice: Mailbox Quota Exceeded (Suspension Pending)',
    from: 'System Admin Support <support-verification-helpdesk8391@sec-mail-update.xyz>',
    fromName: 'Google Helpdesk Alert',
    fromAddress: 'support-verification-helpdesk8391@sec-mail-update.xyz',
    to: 'joeljigo3@gmail.com',
    date: new Date(Date.now() - 1000 * 60 * 50).toUTCString(),
    bodyText: `Dear User,

Your email account storage has reached 99.8% capacity. To prevent your messages from being rejected and your account suspended, you must verify your identity immediately.

Click here to verify: http://sec-mail-update.xyz/login?user=joeljigo3

Failure to verify within 6 hours will result in mailbox termination.
Google Security Systems`,
    isUnread: true,
    isStarred: false,
    hasAttachments: false,
    classification: {
      category: 'SUSPICIOUS',
      priority: 5,
      action_required: true,
      action: 'Flagged for inspection: DO NOT CLICK LINKS (Suspected Phishing)',
      repository: null,
      pr_number: null,
      confidence: 0.99,
      reason: 'Obvious phishing attack impersonating Google with spoofed external domain',
      suggested_label: 'KAIRO/SPAM-REVIEW',
      key_takeaway: 'Suspicious phishing message; flagged for inspection, interactions blocked.',
      analyzedAt: new Date().toISOString(),
      source: 'deterministic',
    },
  },
];
