import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const authPayload = await getAuthUser(req);
    if (!authPayload) {
      return unauthorizedResponse();
    }

    await connectToDatabase();
    const user = await User.findById(authPayload.id).select('-password');
    if (!user) {
      return unauthorizedResponse('User session no longer valid.');
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Authentication check failed.' },
      { status: 500 }
    );
  }
}

