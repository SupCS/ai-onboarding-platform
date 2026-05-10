import { Container, Paper, Stack, Typography } from '@mui/material';
import TeamsClient from '../../../components/teams/TeamsClient';
import { getCurrentUser } from '../../../lib/currentUser';
import { getTeams, isTeamManager } from '../../../lib/teams';

export const metadata = {
  title: 'Teams',
};

export default async function TeamsPage() {
  const currentUser = await getCurrentUser();
  const teams = await getTeams();

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
            permissions={{
              canManageAnyTeam: currentUser?.role === 'admin',
              canManageTeams: isTeamManager(currentUser),
              currentUserId: currentUser?.id || '',
              role: currentUser?.role || 'member',
            }}
          />
        </Stack>
      </Paper>
    </Container>
  );
}
