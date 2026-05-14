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
          p: { xs: 2.5, md: 5 },
          borderRadius: 0,
          border: 0,
          backgroundColor: '#F9F9F9',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Stack spacing={4}>
          <Stack spacing={1.5}>
            <Typography
              sx={{
                color: '#0009DC',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.08em',
                lineHeight: 1.2,
                textTransform: 'uppercase',
              }}
            >
              Knowledge base
            </Typography>
            <Typography
              component="h1"
              sx={{
                m: 0,
                color: '#0B0B0B',
                fontFamily: '"Barlow Semi Condensed", Inter, Arial, sans-serif',
                fontSize: { xs: 48, md: 64 },
                fontWeight: 900,
                letterSpacing: 0,
                lineHeight: 0.95,
              }}
            >
              Roadmaps
            </Typography>
            <Typography sx={{ color: '#80808E', fontSize: 15, lineHeight: 1.5 }}>
              Curated learning paths built from existing lessons.
            </Typography>
          </Stack>

          <MyRoadmapsClient initialRoadmaps={roadmaps} />
        </Stack>
      </Paper>
    </Container>
  );
}
