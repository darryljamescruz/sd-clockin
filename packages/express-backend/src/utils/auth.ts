import { Request, Response, NextFunction, RequestHandler } from 'express';

const TOKEN_ALGORITHM = 'HS256';
const TOKEN_TYPE = 'JWT';

interface AdminSessionPayload {
  sub: string;
  name?: string;
  email?: string;
  tid?: string;
  roles: string[];
  iat: number;
  exp: number;
}

function fromBase64Url(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const padded = `${normalized}${'='.repeat(paddingLength)}`;
  return Buffer.from(padded, 'base64').toString('utf8');
}

function decodeBase64UrlToJson<T>(value: string): T {
  return JSON.parse(fromBase64Url(value)) as T;
}

async function signValue(value: string, secret: string): Promise<string> {
  const { createHmac } = await import('crypto');
  const hmac = createHmac('sha256', secret);
  hmac.update(value);
  return hmac.digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function verifySessionToken(token: string, secret: string): Promise<AdminSessionPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerPart, payloadPart, signaturePart] = parts;
    const expectedSignature = await signValue(`${headerPart}.${payloadPart}`, secret);
    
    if (!timingSafeEqual(expectedSignature, signaturePart)) {
      return null;
    }

    const header = decodeBase64UrlToJson<{ alg?: string; typ?: string }>(headerPart);
    if (header.alg !== TOKEN_ALGORITHM || header.typ !== TOKEN_TYPE) {
      return null;
    }

    const payload = decodeBase64UrlToJson<AdminSessionPayload>(payloadPart);
    const now = Math.floor(Date.now() / 1000);
    
    if (!payload.sub || payload.exp <= now) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export const verifyAdmin: RequestHandler = (req, res, next) => {
  const execute = async () => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.AUTH_SESSION_SECRET || process.env.MICROSOFT_CLIENT_SECRET || process.env.AZURE_CLIENT_SECRET;

    if (!secret) {
      console.error('AUTH_SESSION_SECRET is not configured');
      res.status(500).json({ message: 'Server configuration error' });
      return;
    }

    const payload = await verifySessionToken(token, secret);
    
    if (!payload || !payload.roles.includes('admin')) {
      res.status(403).json({ message: 'Forbidden: Admin access required' });
      return;
    }

    // Add user info to request for downstream use if needed
    (req as any).user = payload;
    
    next();
  };

  execute().catch(next);
};
