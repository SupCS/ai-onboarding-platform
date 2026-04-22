import { Container, Paper, Stack, Typography } from '@mui/material';
import MyRoadmapsClient from '../../../components/roadmaps/MyRoadmapsClient';
import { getCurrentUser } from '../../../lib/currentUser';
import { getRoadmapsForUser } from '../../../lib/roadmaps';

export const metadata = {
  title: 'My Roadmaps',
};

export default async function MyRoadmapsPage() {
  const currentUser = await getCurrentUser();
  const roadmaps = currentUser ? await getRoadmapsForUser(currentUser.id) : [];

  return (
    <Container maxWidth={false} disableGutters>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          border: '1px solid #e5e7eb',
          background:
            'radial-gradient(circle at 8% 0%, rgba(20, 184, 166, 0.12), transparent 28%), radial-gradient(circle at 92% 4%, rgba(0, 9, 220, 0.08), transparent 30%), linear-gradient(180deg, #F9F9F9 0%, #EEF7F5 100%)',
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={0.75}>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 800 }}>
              Personal learning
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              My Roadmaps
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Roadmaps you subscribe to from the library will appear here.
            </Typography>
          </Stack>

          <MyRoadmapsClient initialRoadmaps={roadmaps} />
        </Stack>
      </Paper>
    </Container>
  );
}
