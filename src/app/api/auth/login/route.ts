import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { 
  signToken, 
  checkLoginRateLimit, 
  recordFailedLogin, 
  resetLoginAttempts, 
  AUTH_COOKIE_NAME 
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting for brute-force protection
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
               req.headers.get('x-real-ip') || 
               '127.0.0.1';

    const rateLimit = checkLoginRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed login attempts. Account temporarily protected. Please try again in ${rateLimit.retryAfterSeconds} seconds.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    await connectToDatabase();
    const body = await req.json();
    const { email, password } = body;

    // 2. Strict Input Validation
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // 3. User Lookup
    let user = await User.findOne({ email: cleanEmail });

    // Auto-seed or sync default administrator
    if (!user && cleanEmail === 'admin@doctortracker.health') {
      const initialPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AdminSecure2026!';
      const hashedPassword = await bcrypt.hash(initialPassword, 10);
      user = await User.create({
        name: 'Admin',
        email: 'admin@doctortracker.health',
        password: hashedPassword,
        role: 'Administrator',
      });
    } else if (user && user.email === 'admin@doctortracker.health' && user.name !== 'Admin') {
      user.name = 'Admin';
      await user.save();
    }

    // 4. Credential Verification with Generic Error Response (Anti-enumeration)
    if (!user) {
      const failStatus = recordFailedLogin(ip);
      const remainingMsg = failStatus.remainingAttempts > 0 
        ? ` (${failStatus.remainingAttempts} attempts remaining)`
        : '';
      return NextResponse.json(
        { success: false, error: `Invalid email or password.${remainingMsg}` },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const failStatus = recordFailedLogin(ip);
      const remainingMsg = failStatus.remainingAttempts > 0 
        ? ` (${failStatus.remainingAttempts} attempts remaining)`
        : '';
      return NextResponse.json(
        { success: false, error: `Invalid email or password.${remainingMsg}` },
        { status: 401 }
      );
    }

    // 5. Successful Login - Reset rate limit
    resetLoginAttempts(ip);

    // 6. Sign JWT Token
    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: 'Authentication successful',
    });

    // 7. Set Secure HTTP-Only Cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during authentication.' },
      { status: 500 }
    );
  }
}
