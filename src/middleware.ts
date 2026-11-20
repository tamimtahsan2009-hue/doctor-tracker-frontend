import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, verifyEdgeToken } from '@/lib/auth-edge';

// Protected page prefixes
const PROTECTED_PAGE_PREFIXES = ['/dashboard', '/doctors', '/patients', '/analytics'];

// Protected API route prefixes
const PROTECTED_API_PREFIXES = [
  '/api/doctors',
  '/api/patients',
  '/api/analytics',
  '/api/parse-document',
];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Extract token from cookie or Authorization header
  const cookieToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  const token = cookieToken || bearerToken;

  const user = token ? await verifyEdgeToken(token) : null;
  const isAuthenticated = !!user;

  // 1. Handle API Route Protection
  const isProtectedApi = PROTECTED_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtectedApi) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Valid authentication token required.' },
        { status: 401 }
      );
    }
    // Forward authenticated user info in headers for downstream route handlers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-email', user.email);
    requestHeaders.set('x-user-role', user.role);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 2. Handle Root Route (/)
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    } else {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // 3. Handle Login Page (/login)
  if (pathname === '/login') {
    if (isAuthenticated) {
      const redirectParam = req.nextUrl.searchParams.get('redirect');
      const destination = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/dashboard';
      return NextResponse.redirect(new URL(destination, req.url));
    }
    return NextResponse.next();
  }

  // 4. Handle Protected Pages (/dashboard, /doctors, /patients, /analytics)
  const isProtectedPage = PROTECTED_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtectedPage && !isAuthenticated) {
    const destination = encodeURIComponent(`${pathname}${search}`);
    const loginUrl = new URL(`/login?redirect=${destination}`, req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

