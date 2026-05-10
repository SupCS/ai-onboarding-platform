import { requireApiUser } from '../../../../lib/apiAuth';
import {
  getAllUsers,
  getTeams,
  isAdmin,
  removeTeamLeadByEmail,
  setTeamLeadByEmail,
} from '../../../../lib/teams';

export const runtime = 'nodejs';

function forbiddenResponse() {
  return Response.json(
    { error: 'Admin access required.' },
    { status: 403 }
  );
}

export async function GET() {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    if (!isAdmin(user)) {
      return forbiddenResponse();
    }

    const [users, teams] = await Promise.all([getAllUsers(), getTeams()]);

    return Response.json({ users, teams });
  } catch (error) {
    console.error('GET /api/admin/team-leads failed:', error);

    return Response.json(
      { error: error.message || 'Failed to load admin data.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    if (!isAdmin(user)) {
      return forbiddenResponse();
    }

    const body = await request.json();
    const email = String(body.email || '').trim();

    if (!email) {
      return Response.json(
        { error: 'Team lead email is required.' },
        { status: 400 }
      );
    }

    const updatedUser = await setTeamLeadByEmail(email);

    if (!updatedUser) {
      return Response.json(
        { error: 'No user with this email exists.' },
        { status: 404 }
      );
    }

    return Response.json({ user: updatedUser });
  } catch (error) {
    console.error('POST /api/admin/team-leads failed:', error);

    return Response.json(
      { error: error.message || 'Failed to assign team lead.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    if (!isAdmin(user)) {
      return forbiddenResponse();
    }

    const body = await request.json();
    const email = String(body.email || '').trim();

    if (!email) {
      return Response.json(
        { error: 'Team lead email is required.' },
        { status: 400 }
      );
    }

    const updatedUser = await removeTeamLeadByEmail(email);

    if (!updatedUser) {
      return Response.json(
        { error: 'This user is not a team lead or does not exist.' },
        { status: 404 }
      );
    }

    return Response.json({ user: updatedUser });
  } catch (error) {
    console.error('DELETE /api/admin/team-leads failed:', error);

    return Response.json(
      { error: error.message || 'Failed to remove team lead.' },
      { status: 500 }
    );
  }
}
