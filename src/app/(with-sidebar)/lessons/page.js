import { Box, Container, Stack, Typography } from '@mui/material';
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
    <Box
      sx={{
        minHeight: 'calc(100vh - 48px)',
        mx: -3,
        my: -3,
        px: { xs: 2, md: 5 },
        py: { xs: 3, md: 5 },
        backgroundColor: '#F9F9F9',
      }}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          maxWidth: 1500,
          mx: 'auto',
        }}
      >
        <Stack spacing={{ xs: 3, md: 4 }}>
          <Stack spacing={1}>
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
              Personal learning
            </Typography>
            <Typography
              component="h1"
              sx={{
                color: '#0B0B0B',
                fontFamily: '"Barlow Semi Condensed", Inter, Arial, sans-serif',
                fontSize: { xs: 48, md: 64 },
                fontWeight: 900,
                letterSpacing: 0,
                lineHeight: 0.95,
              }}
            >
              My Lessons
            </Typography>
            <Typography
              sx={{
                maxWidth: 620,
                color: '#80808E',
                fontSize: 15,
                lineHeight: 1.5,
              }}
            >
              Lessons you add from the library will appear here. Open any card to
              continue reading.
            </Typography>
          </Stack>

          <MyLessonsClient initialLessons={lessons} />
        </Stack>
      </Container>
    </Box>
  );
}
