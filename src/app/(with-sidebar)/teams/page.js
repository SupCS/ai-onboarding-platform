import { Container, Paper, Stack, Typography } from '@mui/material';
import TeamsClient from '../../../components/teams/TeamsClient';
import { getCurrentUser } from '../../../lib/currentUser';
import { getAllUsers, getTeams } from '../../../lib/teams';
import {
  PERMISSION_DEFINITIONS,
  PERMISSIONS,
  getPermissionSnapshotForUsers,
  getUserPermissionMap,
} from '../../../lib/permissions';

export const metadata = {
  title: 'Teams',
};

export default async function TeamsPage() {
  const currentUser = await getCurrentUser();
  const teams = await getTeams();
  const users = await getAllUsers();
  const currentUserPermissions = await getUserPermissionMap(currentUser);
  const permissionsByUserId = await getPermissionSnapshotForUsers(users);

  return (
    <Container maxWidth={false} disableGutters>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          border: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc',
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={0.75}>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 800 }}>
              Organization
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Teams
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Browse team leads and expand each row to see their members.
            </Typography>
          </Stack>

          <TeamsClient
            initialTeams={teams}
            users={users}
            permissionDefinitions={PERMISSION_DEFINITIONS}
            initialPermissionsByUserId={permissionsByUserId}
            permissions={{
              canManageAnyTeam:
                currentUser?.role === 'admin' &&
                currentUserPermissions[PERMISSIONS.TEAMS_MANAGE_MEMBERS],
              canManageTeams: Boolean(currentUserPermissions[PERMISSIONS.TEAMS_MANAGE_MEMBERS]),
              canManageTeamMemberPermissions: Boolean(
                currentUserPermissions[PERMISSIONS.PERMISSIONS_MANAGE_TEAM_MEMBERS]
              ),
              currentUserId: currentUser?.id || '',
              role: currentUser?.role || 'member',
            }}
          />
        </Stack>
      </Paper>
    </Container>
  );
}
