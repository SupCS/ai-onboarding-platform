import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, deleteSessionByToken } from '../../../../lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  await deleteSessionByToken(token);

  cookieStore.delete(AUTH_COOKIE_NAME);

  return Response.json({ ok: true });
}
