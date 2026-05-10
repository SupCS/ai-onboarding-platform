import { requireApiUser } from '../../../../../lib/apiAuth';
import {
  addTeamMemberByEmail,
  canManageTeam,
  getUserByEmail,
  getUserById,
  removeTeamMember,
} from '../../../../../lib/teams';

export const runtime = 'nodejs';

export async function POST(request, { params }) {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const { leadId } = await params;

    if (!canManageTeam(user, leadId)) {
      return Response.json(
        { error: 'You cannot manage this team.' },
        { status: 403 }
      );
    }

    const lead = await getUserById(leadId);

    if (!lead || !['admin', 'teamlead'].includes(lead.role)) {
      return Response.json(
        { error: 'Team lead not found.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const email = String(body.email || '').trim();

    if (!email) {
      return Response.json(
        { error: 'Member email is required.' },
        { status: 400 }
      );
    }

    const targetUser = await getUserByEmail(email);

    if (!targetUser) {
      return Response.json(
        { error: 'No user with this email exists.' },
        { status: 404 }
      );
    }

    if (targetUser.id === leadId) {
      return Response.json(
        { error: 'A team lead cannot be added to their own team.' },
        { status: 400 }
      );
    }

    const member = await addTeamMemberByEmail(leadId, email);

    return Response.json({ member });
  } catch (error) {
    console.error('POST /api/teams/[leadId]/members failed:', error);

    return Response.json(
      { error: error.message || 'Failed to add team member.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const { leadId } = await params;

    if (!canManageTeam(user, leadId)) {
      return Response.json(
        { error: 'You cannot manage this team.' },
        { status: 403 }
      );
    }

    const lead = await getUserById(leadId);

    if (!lead || !['admin', 'teamlead'].includes(lead.role)) {
      return Response.json(
        { error: 'Team lead not found.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const memberId = String(body.memberId || '').trim();

    if (!memberId) {
      return Response.json(
        { error: 'Member id is required.' },
        { status: 400 }
      );
    }

    await removeTeamMember(leadId, memberId);

    return Response.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/teams/[leadId]/members failed:', error);

    return Response.json(
      { error: error.message || 'Failed to remove team member.' },
      { status: 500 }
    );
  }
}
