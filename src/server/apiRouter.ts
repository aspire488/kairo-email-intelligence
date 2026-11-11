import express, { Request, Response } from 'express';
import {
  classifyEmailsWithGemini,
  generateDailyBriefing,
  draftReplyWithGemini,
  parseNaturalLanguageSearch,
  processKairoChat,
} from './geminiService.ts';

export const apiRouter = express.Router();
export const apiApp = express();

apiRouter.use(express.json({ limit: '10mb' }));
apiApp.use(express.json({ limit: '10mb' }));
apiApp.use('/api', apiRouter);

import { verifyFirebaseIdToken, VerifiedFirebaseToken } from './firebaseTokenVerifier.ts';

import { durableSessionStore } from './durableSessionStore.ts';

// Session TTL: 59 minutes (matching Google OAuth access token lifetime)
const SESSION_TTL_MS = 59 * 60 * 1000;

// Helper to authenticate caller via Firebase ID Token
async function authenticateRequest(req: Request): Promise<VerifiedFirebaseToken> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or malformed Authorization header. Expected Bearer <FirebaseIdToken>');
  }
  const idToken = authHeader.slice(7).trim();
  if (!idToken) {
    throw new Error('Empty Bearer token provided');
  }

  // Allow synthetic test tokens strictly in non-production automated test suite
  if (process.env.NODE_ENV !== 'production' && idToken.startsWith('test_simulated_')) {
    return { uid: 'test-user-123', email: 'joeljigo3@gmail.com' };
  }

  return await verifyFirebaseIdToken(idToken);
}

// Health check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', product: 'KAIRO Email Intelligence', timestamp: new Date().toISOString() });
});

// Save or update active session (requires verified Firebase ID token)
apiRouter.post('/auth/session', async (req: Request, res: Response) => {
  try {
    const verified = await authenticateRequest(req);
    const { accessToken } = req.body;

    if (!accessToken || typeof accessToken !== 'string') {
      res.status(400).json({ error: 'accessToken is required' });
      return;
    }

    const deviceId = (req.body.deviceId as string) || (req.headers['x-device-id'] as string) || 'primary-device';
    const deviceName = (req.body.deviceName as string) || 'Primary Device';
    const platform = (req.body.platform as any) || 'web';

    durableSessionStore.registerDeviceSession(verified.uid, {
      deviceId,
      deviceName,
      platform,
      email: verified.email || '',
      accessToken,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });

    res.json({ status: 'ok', uid: verified.uid, deviceId });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Authentication failed' });
  }
});

// Retrieve active session for authenticated user/device
apiRouter.get('/auth/session', async (req: Request, res: Response) => {
  try {
    const verified = await authenticateRequest(req);
    const deviceId = (req.query.deviceId as string) || (req.headers['x-device-id'] as string);
    const session = deviceId
      ? durableSessionStore.getDeviceSession(verified.uid, deviceId)
      : durableSessionStore.getAnyActiveSessionForUser(verified.uid);

    if (!session) {
      res.status(404).json({ authenticated: false, error: 'No active session found for user' });
      return;
    }

    // Enforce TTL expiration
    if (Date.now() > session.expiresAt) {
      durableSessionStore.revokeDeviceSession(verified.uid, session.deviceId);
      res.status(401).json({ authenticated: false, error: 'Session expired. Re-authentication required' });
      return;
    }

    res.json({
      authenticated: true,
      uid: verified.uid,
      email: session.email,
      deviceId: session.deviceId,
      platform: session.platform,
      accessToken: session.accessToken,
      expiresInSeconds: Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000)),
    });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Unauthorized' });
  }
});

// Clear active session upon logout (specific device or all devices)
apiRouter.delete('/auth/session', async (req: Request, res: Response) => {
  try {
    const verified = await authenticateRequest(req);
    const deviceId = (req.query.deviceId as string) || (req.headers['x-device-id'] as string);
    if (deviceId) {
      durableSessionStore.revokeDeviceSession(verified.uid, deviceId);
    } else {
      durableSessionStore.revokeAllUserSessions(verified.uid);
    }
    res.json({ status: 'ok' });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Unauthorized' });
  }
});

// List active user devices
apiRouter.get('/devices', async (req: Request, res: Response) => {
  try {
    const verified = await authenticateRequest(req);
    const devices = durableSessionStore.listUserDevices(verified.uid);
    res.json({ devices });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Unauthorized' });
  }
});

// Revoke a specific device session
apiRouter.delete('/devices/:deviceId', async (req: Request, res: Response) => {
  try {
    const verified = await authenticateRequest(req);
    const success = durableSessionStore.revokeDeviceSession(verified.uid, req.params.deviceId);
    res.json({ status: success ? 'ok' : 'not_found' });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Unauthorized' });
  }
});

// Cross-device sync: push state updates
apiRouter.post('/sync/push', async (req: Request, res: Response) => {
  try {
    const verified = await authenticateRequest(req);
    const { classifications, preferences, chatConversations, auditLogs } = req.body;
    const doc = durableSessionStore.applyIncrementalPush(verified.uid, {
      classifications,
      preferences,
      chatConversations,
      auditLogs,
    });
    res.json({ status: 'ok', lastUpdated: doc.lastUpdated });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Unauthorized' });
  }
});

// Cross-device sync: pull state updates
apiRouter.get('/sync/pull', async (req: Request, res: Response) => {
  try {
    const verified = await authenticateRequest(req);
    const cursor = parseInt(req.query.cursor as string, 10) || 0;
    const doc = durableSessionStore.getOrCreateSyncDoc(verified.uid);

    if (doc.lastUpdated > cursor) {
      res.json({
        hasUpdates: true,
        lastUpdated: doc.lastUpdated,
        syncDoc: doc,
      });
    } else {
      res.json({
        hasUpdates: false,
        lastUpdated: doc.lastUpdated,
      });
    }
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Unauthorized' });
  }
});

// Classify batch of emails
apiRouter.post('/ai/classify', async (req: Request, res: Response) => {
  try {
    const { emails } = req.body;
    if (!Array.isArray(emails)) {
      res.status(400).json({ error: 'emails array is required' });
      return;
    }
    const results = await classifyEmailsWithGemini(emails);
    res.json({ results });
  } catch (err: any) {
    console.error('Classification error:', err);
    res.status(500).json({ error: err.message || 'Internal AI error' });
  }
});

// Generate executive daily briefing
apiRouter.post('/ai/briefing', async (req: Request, res: Response) => {
  try {
    const { userEmail, processedEmails } = req.body;
    if (!Array.isArray(processedEmails)) {
      res.status(400).json({ error: 'processedEmails array is required' });
      return;
    }
    const briefing = await generateDailyBriefing({ userEmail, processedEmails });
    res.json({ briefing });
  } catch (err: any) {
    console.error('Briefing error:', err);
    res.status(500).json({ error: err.message || 'Internal AI error' });
  }
});

// Draft a reply
apiRouter.post('/ai/draft-reply', async (req: Request, res: Response) => {
  try {
    const { emailSubject, sender, threadSummary, latestMessage, userInstruction, tone } = req.body;
    if (!emailSubject || !latestMessage) {
      res.status(400).json({ error: 'emailSubject and latestMessage are required' });
      return;
    }
    const draftData = await draftReplyWithGemini({
      emailSubject,
      sender: sender || 'Unknown',
      threadSummary: threadSummary || '',
      latestMessage,
      userInstruction,
      tone,
    });
    res.json(draftData);
  } catch (err: any) {
    console.error('Draft error:', err);
    res.status(500).json({ error: err.message || 'Internal AI error' });
  }
});

// Parse natural language search
apiRouter.post('/ai/smart-search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) {
      res.status(400).json({ error: 'query is required' });
      return;
    }
    const searchParams = await parseNaturalLanguageSearch(query);
    res.json(searchParams);
  } catch (err: any) {
    console.error('Search parsing error:', err);
    res.status(500).json({ error: err.message || 'Internal AI error' });
  }
});

// Chat with KAIRO
apiRouter.post('/ai/chat', async (req: Request, res: Response) => {
  try {
    const { messages, emails, userEmail, preferences } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }
    const result = await processKairoChat({
      messages,
      emails: Array.isArray(emails) ? emails : [],
      userEmail,
      preferences,
    });
    res.json(result);
  } catch (err: any) {
    console.error('Chat AI error:', err);
    res.status(500).json({ error: err.message || 'Internal AI chat error' });
  }
});
