import { notFound, redirect } from 'next/navigation';
import { Box, Container } from '@mui/material';
import FlashcardsActivityPlayer from '../../../../../../components/lessons/FlashcardsActivityPlayer';
import QuizActivityPlayer from '../../../../../../components/lessons/QuizActivityPlayer';
import { getCurrentUser } from '../../../../../../lib/currentUser';
import {
  getLessonActivityForUser,
  getLessonActivityAttemptsForUser,
  getLessonActivitiesForUser,
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

  if (!lesson || lesson.status !== 'ready' || !lesson.isPublished) {
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
  const lessonActivities = await getLessonActivitiesForUser(id, currentUser.id);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        mx: -3,
        my: -3,
        px: { xs: 2, md: 5 },
        py: { xs: 2, md: 4 },
        background:
          'radial-gradient(circle at 12% 0%, rgba(0, 9, 220, 0.14), transparent 30%), radial-gradient(circle at 88% 10%, rgba(174, 243, 62, 0.2), transparent 28%), linear-gradient(180deg, #f8fafc 0%, #edf7ff 100%)',
      }}
    >
      <Container
        maxWidth={activity.type === 'flashcards' ? false : 'lg'}
        disableGutters
        sx={activity.type === 'flashcards'
          ? { width: { xs: '100%', md: '92%' }, maxWidth: 1500 }
          : undefined}
      >
        {activity.type === 'quiz' ? (
          <QuizActivityPlayer
            lesson={{
              ...lesson,
              activities: lessonActivities,
            }}
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
