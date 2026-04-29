import { notFound, redirect } from 'next/navigation';
import { Box, Container } from '@mui/material';
import FlashcardsActivityPlayer from '../../../../../../components/lessons/FlashcardsActivityPlayer';
import QuizActivityPlayer from '../../../../../../components/lessons/QuizActivityPlayer';
import { getCurrentUser } from '../../../../../../lib/currentUser';
import {
  getLessonActivityForUser,
  getLessonActivityAttemptsForUser,
  getLessonById,
  getLessonEnrollmentForUser,
} from '../../../../../../lib/lessons';

export const metadata = {
  title: 'Lesson Activity',
};

export default async function LessonActivityPage({ params }) {
  const { id, activityId } = await params;
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

  const activity = await getLessonActivityForUser(id, activityId, currentUser.id);

  if (!activity) {
    notFound();
  }

  if (activity.type !== 'flashcards' && activity.type !== 'quiz') {
    notFound();
  }

  const attempts = activity.type === 'quiz'
    ? await getLessonActivityAttemptsForUser(id, activityId, currentUser.id)
    : [];

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 48px)',
        mx: -3,
        my: -3,
        px: { xs: 2, md: 5 },
        py: { xs: 2, md: 4 },
        background:
          'radial-gradient(circle at 12% 0%, rgba(0, 9, 220, 0.14), transparent 30%), radial-gradient(circle at 88% 10%, rgba(174, 243, 62, 0.2), transparent 28%), linear-gradient(180deg, #f8fafc 0%, #edf7ff 100%)',
      }}
    >
      <Container maxWidth="lg" disableGutters>
        {activity.type === 'quiz' ? (
          <QuizActivityPlayer
            lesson={lesson}
            activity={activity}
            initialAttempts={attempts}
          />
        ) : (
          <FlashcardsActivityPlayer
            lesson={lesson}
            activity={activity}
          />
        )}
      </Container>
    </Box>
  );
}
