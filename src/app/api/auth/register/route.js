import { cookies } from 'next/headers';
import {
  AUTH_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSession,
  createUser,
} from '../../../../lib/auth';

export const runtime = 'nodejs';

function isUniqueEmailError(error) {
  return error?.code === '23505';
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = (body.name || '').trim();
    const email = (body.email || '').trim();
    const password = body.password || '';

    if (!name || !email || !password) {
      return Response.json(
        { error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    const user = await createUser({ name, email, password });
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

    return Response.json({ user }, { status: 201 });
  } catch (error) {
    if (isUniqueEmailError(error)) {
      return Response.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    console.error('POST /api/auth/register failed:', error);

    return Response.json(
      { error: error.message || 'Failed to create account.' },
      { status: 500 }
    );
  }
}
