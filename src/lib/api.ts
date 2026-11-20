/**
 * API configuration helper
 * In full-stack Next.js mode, API_BASE is empty ('') and calls resolve locally.
 * In decoupled mode (standalone Express backend), set NEXT_PUBLIC_API_URL in .env.local (e.g. http://localhost:5000).
 */
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

