import { requireApiUser } from '../../../../../lib/apiAuth';
import {
  addTeamMemberByEmailOrName,
  addTeamMemberByUserId,
  getUserByEmailOrName,
  getUserById,
  removeTeamMember,
} from '../../../../../lib/teams';
import { PERMISSIONS, userHasPermission } from '../../../../../lib/permissions';

export const runtime = 'nodejs';

async function canManageTeamMembers(user, leadId) {
  const hasPermission = await userHasPermission(user, PERMISSIONS.TEAMS_MANAGE_MEMBERS);

  if (!hasPermission) {
    return false;
  }

  return user.role === 'admin' || user.id === leadId;
}

export async function POST(request, { params }) {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const { leadId } = await params;

    if (!(await canManageTeamMembers(user, leadId))) {
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
    const member = String(body.member || body.email || '').trim();

    if (!memberId && !member) {
      return Response.json(
        { error: 'Member name or email is required.' },
        { status: 400 }
      );
    }

    const targetUser = memberId
      ? await getUserById(memberId)
      : await getUserByEmailOrName(member);

    if (!targetUser) {
      return Response.json(
        { error: 'No user with this name or email exists.' },
        { status: 404 }
      );
    }

    if (targetUser.id === leadId) {
      return Response.json(
        { error: 'A team lead cannot be added to their own team.' },
        { status: 400 }
      );
    }

    const addedMember = memberId
      ? await addTeamMemberByUserId(leadId, memberId)
      : await addTeamMemberByEmailOrName(leadId, member);

    return Response.json({ member: addedMember });
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

    if (!(await canManageTeamMembers(user, leadId))) {
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
