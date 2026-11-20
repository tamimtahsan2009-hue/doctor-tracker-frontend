import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth-edge';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Session invalidated and logged out successfully.',
  });

  // Expire the cookie immediately
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    expires: new Date(0),
    path: '/',
  });

  return response;
}

