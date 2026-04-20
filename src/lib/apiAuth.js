import { getCurrentUser } from './currentUser.js';

export async function requireApiUser() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: Response.json(
        { error: 'Authentication required.' },
        { status: 401 }
      ),
    };
  }

  return {
    user,
    response: null,
  };
}
