import Link from 'next/link';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import StyleOutlinedIcon from '@mui/icons-material/StyleOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import LessonCompletionButton from './LessonCompletionButton';

function getActivityIcon(type) {
  if (type === 'quiz') {
    return <QuizOutlinedIcon />;
  }

  return <StyleOutlinedIcon />;
}

function getActivityLabel(activity) {
  if (activity.type === 'quiz') {
    return `${activity.itemCount} question quiz`;
  }

  return `${activity.itemCount} flashcards`;
}

export default function LessonActivityGate({
  lessonId,
  activities = [],
  initialIsCompleted = false,
}) {
  if (activities.length === 0) {
    return (
      <LessonCompletionButton
        lessonId={lessonId}
        initialIsCompleted={initialIsCompleted}
      />
    );
  }

  const supportedActivities = activities.filter((activity) => activity.type === 'flashcards');
  const nextActivity =
    supportedActivities.find((activity) => !activity.progress?.isCompleted) ||
    supportedActivities[0] ||
    activities[0];
  const completedCount = activities.filter((activity) => activity.progress?.isCompleted).length;
  const allCompleted = completedCount === activities.length;
  const isActivitySupported = nextActivity.type === 'flashcards';

  return (
    <Box
      sx={{
        mt: { xs: 5, md: 7 },
        p: { xs: 2.5, md: 3 },
        borderRadius: 4,
        border: '1px solid rgba(0, 9, 220, 0.14)',
        background:
          'linear-gradient(135deg, rgba(239,246,255,0.96) 0%, rgba(245,243,255,0.96) 100%)',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
      >
        <Stack spacing={0.75}>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              label={allCompleted ? 'Activities completed' : 'Activity required'}
              color={allCompleted ? 'success' : 'primary'}
              sx={{ fontWeight: 800 }}
            />
            <Chip
              label={`${completedCount}/${activities.length} complete`}
              variant="outlined"
              sx={{ fontWeight: 700, backgroundColor: '#fff' }}
            />
          </Stack>

          <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a' }}>
            {allCompleted ? 'Lesson completed' : nextActivity.title || 'Practice activity'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {allCompleted
              ? 'All required activities are done.'
              : isActivitySupported
                ? `Complete ${getActivityLabel(nextActivity)} to finish this lesson.`
                : 'This lesson has a quiz activity. Quiz passing UI is coming next.'}
          </Typography>
        </Stack>

        {isActivitySupported ? (
          <Link href={`/lessons/${lessonId}/activities/${nextActivity.id}`}>
            <Button
              variant={allCompleted ? 'outlined' : 'contained'}
              size="large"
              startIcon={getActivityIcon(nextActivity.type)}
              sx={{
                minHeight: 54,
                px: 3,
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 900,
                alignSelf: { xs: 'stretch', md: 'center' },
                width: { xs: '100%', md: 'auto' },
              }}
            >
              {allCompleted ? 'Review activity' : 'Go to activity'}
            </Button>
          </Link>
        ) : (
          <Button
            variant="contained"
            size="large"
            startIcon={getActivityIcon(nextActivity.type)}
            disabled
            sx={{
              minHeight: 54,
              px: 3,
              borderRadius: 999,
              textTransform: 'none',
              fontWeight: 900,
              alignSelf: { xs: 'stretch', md: 'center' },
            }}
          >
            Quiz player coming soon
          </Button>
        )}
      </Stack>
    </Box>
  );
}
