import { cookies } from 'next/headers';
import {
  AUTH_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  authenticateUser,
  createSession,
} from '../../../../lib/auth';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim();
    const password = body.password || '';

    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const user = await authenticateUser({ email, password });

    if (!user) {
      return Response.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const session = await createSession(user.id);
    const cookieStore = await cookies();

    cookieStore.set(AUTH_COOKIE_NAME, session.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
      expires: session.expiresAt,
    });

    return Response.json({ user });
  } catch (error) {
    console.error('POST /api/auth/login failed:', error);

    return Response.json(
      { error: error.message || 'Failed to sign in.' },
      { status: 500 }
    );
  }
}
