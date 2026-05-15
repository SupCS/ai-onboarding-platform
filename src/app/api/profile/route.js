import { requireApiUser } from '../../../lib/apiAuth';
import { updateUserProfile } from '../../../lib/auth';

export const runtime = 'nodejs';

export async function PATCH(request) {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const body = await request.json();
    const updatedUser = await updateUserProfile(user.id, {
      name: body.name,
      position: body.position,
      avatarStorageKey:
        Object.prototype.hasOwnProperty.call(body, 'avatarStorageKey')
          ? body.avatarStorageKey
          : user.avatarStorageKey,
    });

    return Response.json({ user: updatedUser });
  } catch (error) {
    console.error('PATCH /api/profile failed:', error);

    return Response.json(
      { error: error.message || 'Failed to update profile.' },
      { status: 400 }
    );
  }
}
