export const AUTH_COOKIE_NAME = 'dt_token';
export const JWT_SECRET = process.env.JWT_SECRET || 'doctor_tracker_jwt_secret_key_production_2026';

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  exp?: number;
  iat?: number;
}

/**
 * Web Crypto API based JWT verification for Edge Runtime (Next.js Middleware)
 * Runs natively in Node.js and Edge without any Node crypto dependencies.
 */
export async function verifyEdgeToken(token: string): Promise<AuthUserPayload | null> {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const [headerB64, payloadB64, signatureB64] = parts;
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

    let b64 = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const sigBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, data);
    if (!isValid) return null;

    let payloadStr = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    while (payloadStr.length % 4) payloadStr += '=';
    const payload: AuthUserPayload = JSON.parse(
      new TextDecoder().decode(Uint8Array.from(atob(payloadStr), (c) => c.charCodeAt(0)))
    );

    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

