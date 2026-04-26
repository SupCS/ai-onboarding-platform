import { Container, Paper, Stack, Typography } from '@mui/material';
import LessonsLoadingState from '../../../components/lessons/LessonsLoadingState';

export default function MyLessonsLoading() {
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
              Personal learning
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              My Lessons
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Loading your lessons...
            </Typography>
          </Stack>

          <LessonsLoadingState count={5} showAction showProgressStatus />
        </Stack>
      </Paper>
    </Container>
  );
}
