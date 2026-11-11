import crypto from 'crypto';
import firebaseConfig from '../../firebase-applet-config.json';

const PROJECT_ID = firebaseConfig.projectId;
const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

interface CachedCerts {
  certs: Record<string, string>;
  expiresAt: number;
}

let certsCache: CachedCerts | null = null;

async function getGooglePublicCerts(): Promise<Record<string, string>> {
  if (certsCache && Date.now() < certsCache.expiresAt) {
    return certsCache.certs;
  }

  try {
    const res = await fetch(CERTS_URL);
    if (!res.ok) {
      throw new Error(`Failed to fetch Google public certs: ${res.statusText}`);
    }

    // Parse Cache-Control header if present
    const cacheControl = res.headers.get('cache-control');
    let maxAge = 3600; // default 1 hour
    if (cacheControl) {
      const match = cacheControl.match(/max-age=(\d+)/);
      if (match) {
        maxAge = parseInt(match[1], 10);
      }
    }

    const certs = await res.json();
    certsCache = {
      certs,
      expiresAt: Date.now() + maxAge * 1000,
    };
    return certs;
  } catch (err) {
    if (certsCache) {
      return certsCache.certs;
    }
    throw err;
  }
}

export interface VerifiedFirebaseToken {
  uid: string;
  email?: string;
  name?: string;
}

/**
 * Independently verifies a Firebase ID token using Google's public x509 certs.
 * Validates cryptographic signature, issuer, audience, and expiration.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseToken> {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Missing or invalid ID token format');
  }

  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed JWT structure');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  let header: { alg: string; kid: string };
  let payload: {
    iss: string;
    aud: string;
    sub: string;
    exp: number;
    auth_time: number;
    email?: string;
    name?: string;
  };

  try {
    header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    throw new Error('Failed to parse JWT header or payload');
  }

  if (header.alg !== 'RS256') {
    throw new Error(`Unsupported JWT algorithm: ${header.alg}`);
  }

  if (!header.kid) {
    throw new Error('JWT header missing kid');
  }

  const certs = await getGooglePublicCerts();
  const cert = certs[header.kid];
  if (!cert) {
    throw new Error('No matching public key found for kid');
  }

  // Verify cryptographic signature
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerB64}.${payloadB64}`);
  const signature = Buffer.from(signatureB64, 'base64url');
  const isValidSig = verifier.verify(cert, signature);

  if (!isValidSig) {
    throw new Error('Cryptographic signature verification failed');
  }

  // Validate Claims
  const nowSec = Math.floor(Date.now() / 1000);

  if (payload.exp < nowSec) {
    throw new Error('Firebase ID token is expired');
  }

  const expectedIssuer = `https://securetoken.google.com/${PROJECT_ID}`;
  if (payload.iss !== expectedIssuer) {
    throw new Error(`Invalid issuer. Expected: ${expectedIssuer}, got: ${payload.iss}`);
  }

  if (payload.aud !== PROJECT_ID) {
    throw new Error(`Invalid audience. Expected: ${PROJECT_ID}, got: ${payload.aud}`);
  }

  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('Invalid subject (uid) in ID token');
  }

  return {
    uid: payload.sub,
    email: payload.email,
    name: payload.name,
  };
}
