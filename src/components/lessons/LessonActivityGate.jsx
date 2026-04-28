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

  if (activity.type === 'flashcards') {
    return `${activity.itemCount} flashcards`;
  }

  return 'Unsupported activity';
}

function isActivityPassed(activity) {
  if (activity.type === 'quiz') {
    return Boolean(activity.progress?.isCompleted) && Number(activity.progress?.score || 0) >= 80;
  }

  return Boolean(activity.progress?.isCompleted);
}

function getActivitySortWeight(activity) {
  if (activity.type === 'flashcards') {
    return 0;
  }

  if (activity.type === 'quiz') {
    return 1;
  }

  return 2;
}

function getActivityStatus(activity) {
  if (activity.type === 'quiz' && activity.progress) {
    const score = Number(activity.progress?.score || 0);

    if (activity.progress.status === 'failed' || score < 80) {
      return {
        label: `Quiz not passed: not enough points (${score}%)`,
        color: 'warning',
      };
    }

    return {
      label: `Quiz passed: ${score}%`,
      color: 'success',
    };
  }

  if (isActivityPassed(activity)) {
    return {
      label: 'Completed',
      color: 'success',
    };
  }

  return {
    label: 'Not completed',
    color: 'default',
  };
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

  const supportedActivities = activities.filter((activity) =>
    activity.type === 'flashcards' || activity.type === 'quiz'
  );
  const sortedActivities = [...activities].sort((firstActivity, secondActivity) =>
    getActivitySortWeight(firstActivity) - getActivitySortWeight(secondActivity)
  );
  const completedCount = activities.filter(isActivityPassed).length;
  const allCompleted = completedCount === activities.length;

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
      <Stack spacing={2.5}>
        <Stack spacing={0.75}>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              label={allCompleted ? 'Activities completed' : 'Practice activities'}
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
            Lesson activities
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Open activities in any order. Flashcards are shown first, then quizzes.
          </Typography>
        </Stack>

        <Stack spacing={1.5}>
          {sortedActivities.map((activity) => {
            const isActivitySupported = supportedActivities.includes(activity);
            const activityStatus = getActivityStatus(activity);

            return (
              <Box
                key={activity.id}
                sx={{
                  p: { xs: 1.75, md: 2 },
                  borderRadius: 3,
                  border: '1px solid rgba(15, 23, 42, 0.08)',
                  backgroundColor: 'rgba(255, 255, 255, 0.82)',
                  boxShadow: '0 16px 36px rgba(15, 23, 42, 0.06)',
                }}
              >
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={1.5}
                  sx={{
                    alignItems: { xs: 'stretch', md: 'center' },
                    justifyContent: 'space-between',
                  }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        flex: '0 0 auto',
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 2.5,
                        color: activity.type === 'quiz' ? '#0009DC' : '#0f766e',
                        backgroundColor: activity.type === 'quiz' ? '#eef2ff' : '#ccfbf1',
                      }}
                    >
                      {getActivityIcon(activity.type)}
                    </Box>

                    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900, color: '#0f172a' }}>
                        {activity.title || 'Practice activity'}
                      </Typography>
                      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                        <Chip
                          label={getActivityLabel(activity)}
                          size="small"
                          variant="outlined"
                          sx={{ backgroundColor: '#fff', fontWeight: 700 }}
                        />
                        <Chip
                          label={activityStatus.label}
                          size="small"
                          color={activityStatus.color}
                          variant={activityStatus.color === 'default' ? 'outlined' : 'filled'}
                          sx={{ fontWeight: 700 }}
                        />
                      </Stack>
                    </Stack>
                  </Stack>

                  {isActivitySupported ? (
                    <Link href={`/lessons/${lessonId}/activities/${activity.id}`}>
                      <Button
                        variant={isActivityPassed(activity) ? 'outlined' : 'contained'}
                        startIcon={getActivityIcon(activity.type)}
                        sx={{
                          minHeight: 46,
                          px: 2.5,
                          borderRadius: 999,
                          textTransform: 'none',
                          fontWeight: 900,
                          width: { xs: '100%', md: 'auto' },
                        }}
                      >
                        {isActivityPassed(activity) ? 'Review' : 'Open'}
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={getActivityIcon(activity.type)}
                      disabled
                      sx={{
                        minHeight: 46,
                        px: 2.5,
                        borderRadius: 999,
                        textTransform: 'none',
                        fontWeight: 900,
                        width: { xs: '100%', md: 'auto' },
                      }}
                    >
                      Unavailable
                    </Button>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </Stack>
    </Box>
  );
}
