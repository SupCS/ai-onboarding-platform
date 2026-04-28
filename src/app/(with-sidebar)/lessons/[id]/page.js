import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Box, Button, Chip, Container, Paper, Stack, Typography } from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import LessonActivityGate from '../../../../components/lessons/LessonActivityGate';
import LessonReader from '../../../../components/lessons/LessonReader';
import { getCurrentUser } from '../../../../lib/currentUser';
import { markdownToHtml } from '../../../../lib/lessonContent';
import {
  getLessonActivitiesForUser,
  getLessonById,
  getLessonEnrollmentForUser,
} from '../../../../lib/lessons';

export const metadata = {
  title: 'Lesson',
};

export default async function LessonReadPage({ params }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  const enrollment = await getLessonEnrollmentForUser(currentUser.id, id);

  if (!enrollment) {
    notFound();
  }

  const lesson = await getLessonById(id);

  if (!lesson || lesson.status !== 'ready') {
    notFound();
  }

  const html = lesson.contentHtml || markdownToHtml(lesson.contentMarkdown || '');
  const activities = await getLessonActivitiesForUser(lesson.id, currentUser.id);

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 48px)',
        mx: -3,
        my: -3,
        px: { xs: 2, md: 5 },
        py: { xs: 2, md: 4 },
        background:
          'radial-gradient(circle at 12% 0%, rgba(20, 184, 166, 0.18), transparent 32%), radial-gradient(circle at 90% 12%, rgba(245, 158, 11, 0.14), transparent 28%), linear-gradient(180deg, #f8fafc 0%, #eef6f4 100%)',
      }}
    >
      <Container maxWidth="lg" disableGutters>
        <Stack spacing={3}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
          >
            <Link href="/lessons">
              <Button
                startIcon={<ArrowBackOutlinedIcon />}
                variant="outlined"
                color="inherit"
                sx={{
                  alignSelf: { xs: 'flex-start', sm: 'center' },
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.72)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                Back to My Lessons
              </Button>
            </Link>

            <Chip
              label="Reading mode"
              sx={{
                alignSelf: { xs: 'flex-start', sm: 'center' },
                fontWeight: 800,
                backgroundColor: 'rgba(0, 9, 220, 0.1)',
                color: '#0009DC',
              }}
            />
          </Stack>

          <Paper
            elevation={0}
            sx={{
              px: { xs: 2.5, md: 7, lg: 10 },
              py: { xs: 4, md: 7 },
              borderRadius: { xs: 4, md: 6 },
              border: '1px solid rgba(15, 23, 42, 0.08)',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              boxShadow: '0 28px 80px rgba(15, 23, 42, 0.12)',
            }}
          >
            <Stack spacing={1.5} sx={{ mb: 5 }}>
              <Typography variant="overline" color="primary" sx={{ fontWeight: 900 }}>
                Lesson
              </Typography>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 950,
                  lineHeight: 0.98,
                  letterSpacing: '-0.06em',
                  color: '#0f172a',
                }}
              >
                {lesson.title}
              </Typography>
              {lesson.description && (
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 780 }}>
                  {lesson.description}
                </Typography>
              )}
            </Stack>

            <LessonReader html={html} />
            <LessonActivityGate
              lessonId={lesson.id}
              activities={activities}
              initialIsCompleted={enrollment.isCompleted}
            />
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
