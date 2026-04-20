import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, getUserBySessionToken } from './auth.js';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  return getUserBySessionToken(token);
}
