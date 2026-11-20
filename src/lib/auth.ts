import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { AUTH_COOKIE_NAME, JWT_SECRET, AuthUserPayload } from './auth-edge';

export { AUTH_COOKIE_NAME, JWT_SECRET };
export type { AuthUserPayload };

// In-memory rate limiting map for brute-force protection
interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil?: number;
}

const loginAttempts = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

export function checkLoginRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS, retryAfterSeconds: 0 };
  }

  // Check if currently locked out
  if (record.blockedUntil && record.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  // Check if sliding window has passed
  if (now - record.firstAttemptAt > WINDOW_MS) {
    loginAttempts.delete(ip);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS, retryAfterSeconds: 0 };
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - record.attempts);
  return { allowed: record.attempts < MAX_ATTEMPTS, remainingAttempts: remaining, retryAfterSeconds: 0 };
}

export function recordFailedLogin(ip: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { attempts: 0, firstAttemptAt: now };

  if (now - record.firstAttemptAt > WINDOW_MS) {
    record.attempts = 1;
    record.firstAttemptAt = now;
    record.blockedUntil = undefined;
  } else {
    record.attempts += 1;
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    loginAttempts.set(ip, record);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds: Math.ceil(BLOCK_DURATION_MS / 1000) };
  }

  loginAttempts.set(ip, record);
  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - record.attempts, retryAfterSeconds: 0 };
}

export function resetLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

export function signToken(payload: Omit<AuthUserPayload, 'exp' | 'iat'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthUserPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    return decoded;
  } catch {
    return null;
  }
}

export async function getAuthUser(req: NextRequest): Promise<AuthUserPayload | null> {
  // 1. Try forwarded user headers from middleware (fastest)
  const headerId = req.headers.get('x-user-id');
  const headerEmail = req.headers.get('x-user-email');
  const headerRole = req.headers.get('x-user-role');
  if (headerId && headerEmail) {
    return {
      id: headerId,
      email: headerEmail,
      role: headerRole || 'Administrator',
      name: 'Dr. Tahsan Tamim',
    };
  }

  // 2. Try HTTP-only cookie
  const cookieToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (cookieToken) {
    const user = verifyToken(cookieToken);
    if (user) return user;
  }

  // 3. Try Authorization: Bearer <token>
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7).trim();
    const user = verifyToken(bearerToken);
    if (user) return user;
  }

  return null;
}

export function unauthorizedResponse(message = 'Unauthorized: Authentication required.') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  );
}

export function forbiddenResponse(message = 'Forbidden: Insufficient privileges.') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 403 }
  );
}

