import { redirect } from 'next/navigation';
import { Container, Paper, Stack, Typography } from '@mui/material';
import AdminClient from '../../../components/admin/AdminClient';
import { getCurrentUser } from '../../../lib/currentUser';
import { getAllUsers, isAdmin } from '../../../lib/teams';

export const metadata = {
  title: 'Admin',
};

export default async function AdminPage() {
  const currentUser = await getCurrentUser();

  if (!isAdmin(currentUser)) {
    redirect('/teams');
  }

  const users = await getAllUsers();

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
              Access control
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Admin
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage team lead roles. Admins can also edit teams from the Teams tab.
            </Typography>
          </Stack>

          <AdminClient initialUsers={users} />
        </Stack>
      </Paper>
    </Container>
  );
}
