import { Container, Paper, Stack, Typography } from '@mui/material';
import MyLessonsClient from '../../../components/lessons/MyLessonsClient';
import { getCurrentUser } from '../../../lib/currentUser';
import { getLessonsForUser } from '../../../lib/lessons';

export const metadata = {
  title: 'My Lessons',
};

export default async function MyLessonsPage() {
  const currentUser = await getCurrentUser();
  const lessons = currentUser ? await getLessonsForUser(currentUser.id) : [];

  return (
    <Container maxWidth={false} disableGutters>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          border: '1px solid #e5e7eb',
          background:
            'radial-gradient(circle at 8% 0%, rgba(0, 9, 220, 0.08), transparent 28%), radial-gradient(circle at 92% 4%, rgba(142, 231, 241, 0.28), transparent 30%), linear-gradient(180deg, #F9F9F9 0%, #EEF3FF 100%)',
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={0.75}>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 800 }}>
              Personal learning
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              My Lessons
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lessons you add from the library will appear here. Open any card to
              continue reading.
            </Typography>
          </Stack>

          <MyLessonsClient initialLessons={lessons} />
        </Stack>
      </Paper>
    </Container>
  );
}
