'use client';

import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import PlaylistAddOutlinedIcon from '@mui/icons-material/PlaylistAddOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import StyleOutlinedIcon from '@mui/icons-material/StyleOutlined';
import { getLessonCoverBackground } from '../../lib/brandColors';

function formatDate(isoString) {
  try {
    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(isoString));
  } catch {
    return '';
  }
}

function getStatusColor(status) {
  if (status === 'ready') {
    return 'success';
  }

  if (status === 'failed') {
    return 'error';
  }

  if (status === 'generating') {
    return 'warning';
  }

  return 'default';
}

function getLessonPreview(lesson) {
  if (lesson.contentHtml) {
    const plainHtmlText = lesson.contentHtml
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (plainHtmlText) {
      return plainHtmlText;
    }
  }

  const markdown = lesson.contentMarkdown || '';
  const withoutHeadings = markdown
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*/g, '')
    .trim();

  return withoutHeadings || lesson.description || 'Generated lesson preview will appear here.';
}

function isActivityPassed(activity) {
  if (activity.type === 'quiz') {
    return Boolean(activity.progress?.isCompleted) && Number(activity.progress?.score || 0) >= 80;
  }

  return Boolean(activity.progress?.isCompleted);
}

function getActivityTypeLabel(activity) {
  if (activity.type === 'quiz') {
    return `${activity.itemCount} question quiz`;
  }

  if (activity.type === 'flashcards') {
    return `${activity.itemCount} flashcards`;
  }

  return 'Activity';
}

function getActivityIcon(type) {
  if (type === 'quiz') {
    return <QuizOutlinedIcon sx={{ fontSize: 16 }} />;
  }

  return <StyleOutlinedIcon sx={{ fontSize: 16 }} />;
}

function getActivityStatus(activity) {
  if (activity.type === 'quiz' && activity.progress) {
    const score = Number(activity.progress?.score || 0);

    if (activity.progress.status === 'failed' || score < 80) {
      return {
        label: `Not passed (${score}%)`,
        color: 'warning',
      };
    }

    return {
      label: `Passed (${score}%)`,
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
    label: 'Not started',
    color: 'default',
  };
}

function getActivitySummary(activities) {
  if (activities.length === 0) {
    return null;
  }

  const completedCount = activities.filter(isActivityPassed).length;

  return `${completedCount}/${activities.length} activities complete`;
}

export default function LessonsGrid({
  lessons = [],
  onOpenLesson,
  onEnrollLesson,
  onUnenrollLesson,
  showEnrollmentAction = false,
  showUnenrollAction = false,
  isOpenEnabled = true,
  getLessonHref,
  showProgressStatus = false,
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(3, minmax(0, 1fr))',
          lg: 'repeat(4, minmax(0, 1fr))',
          xl: 'repeat(5, minmax(0, 1fr))',
        },
        gap: 2,
      }}
    >
      {lessons.map((lesson) => {
        const activities = Array.isArray(lesson.activities) ? lesson.activities : [];
        const activitySummary = getActivitySummary(activities);

        return (
          <Paper
            key={lesson.id}
            component={getLessonHref ? Link : 'div'}
            href={getLessonHref ? getLessonHref(lesson) : undefined}
            elevation={0}
            onClick={
              isOpenEnabled && onOpenLesson && !getLessonHref
                ? () => onOpenLesson(lesson)
                : undefined
            }
            sx={{
              borderRadius: 4,
              border: '1px solid #e5e7eb',
              backgroundColor: '#fff',
              overflow: 'hidden',
              minHeight: 340,
              display: 'flex',
              flexDirection: 'column',
              color: 'inherit',
              textDecoration: 'none',
              cursor:
                getLessonHref || (isOpenEnabled && onOpenLesson)
                  ? 'pointer'
                  : 'default',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease',
              '&:hover':
                getLessonHref || (isOpenEnabled && onOpenLesson)
                  ? {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
                    }
                  : undefined,
            }}
          >
          <Box
            sx={{
              height: 160,
              borderBottom: '1px solid #eef2f7',
              background: getLessonCoverBackground(lesson),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.32), transparent 28%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.22), transparent 30%)',
              }}
            />
            <Stack spacing={1} sx={{ alignItems: 'center', zIndex: 1 }}>
              <ImageOutlinedIcon sx={{ fontSize: 34, opacity: 0.9 }} />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                Cover image coming soon
              </Typography>
            </Stack>
          </Box>

          <Box
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
            }}
          >
            <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: 'center' }}>
              <AutoStoriesOutlinedIcon fontSize="small" color="action" />
              <Chip
                label={lesson.status}
                color={getStatusColor(lesson.status)}
                size="small"
                variant="outlined"
              />
              {showProgressStatus && (
                <Chip
                  label={lesson.isCompleted ? 'Completed' : 'Not completed'}
                  color={lesson.isCompleted ? 'success' : 'default'}
                  size="small"
                  variant={lesson.isCompleted ? 'filled' : 'outlined'}
                />
              )}
            </Stack>

            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                lineHeight: 1.25,
                mb: 1,
                display: '-webkit-box',
                overflow: 'hidden',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {lesson.title}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: activities.length > 0 ? 1.5 : 2,
                display: '-webkit-box',
                overflow: 'hidden',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {getLessonPreview(lesson)}
            </Typography>

            {activities.length > 0 && (
              <Box
                sx={{
                  mb: 2,
                  p: 1,
                  borderRadius: 2.5,
                  border: '1px solid #eef2f7',
                  backgroundColor: '#f8fafc',
                }}
              >
                <Stack spacing={0.75}>
                  <Chip
                    label={activitySummary}
                    size="small"
                    color={activities.every(isActivityPassed) ? 'success' : 'primary'}
                    variant={activities.every(isActivityPassed) ? 'filled' : 'outlined'}
                    sx={{
                      alignSelf: 'flex-start',
                      fontWeight: 800,
                      backgroundColor: activities.every(isActivityPassed) ? undefined : '#fff',
                    }}
                  />

                  {activities.slice(0, 3).map((activity) => {
                    const activityStatus = getActivityStatus(activity);

                    return (
                      <Stack
                        key={activity.id}
                        direction="row"
                        spacing={0.75}
                        sx={{ alignItems: 'center', minWidth: 0 }}
                      >
                        <Box
                          sx={{
                            color: activity.type === 'quiz' ? '#0009DC' : '#0f766e',
                            display: 'inline-flex',
                          }}
                        >
                          {getActivityIcon(activity.type)}
                        </Box>
                        <Typography variant="caption" sx={{ flex: '1 1 auto', minWidth: 0 }} noWrap>
                          {getActivityTypeLabel(activity)}
                        </Typography>
                        <Chip
                          label={activityStatus.label}
                          size="small"
                          color={activityStatus.color}
                          variant={activityStatus.color === 'default' ? 'outlined' : 'filled'}
                          sx={{ height: 22, fontWeight: 700 }}
                        />
                      </Stack>
                    );
                  })}

                  {activities.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      +{activities.length - 3} more activit{activities.length - 3 === 1 ? 'y' : 'ies'}
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}

            <Stack spacing={0.75} sx={{ mt: 'auto' }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <PersonOutlineOutlinedIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary" noWrap>
                  Created by {lesson.createdBy || 'AI Onboarding'}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <ScheduleOutlinedIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  Created {formatDate(lesson.createdAt)}
                </Typography>
              </Stack>

              {showEnrollmentAction && (
                <Button
                  variant={lesson.isEnrolled ? 'outlined' : 'contained'}
                  size="small"
                  startIcon={
                    lesson.isEnrolled ? (
                      <CheckCircleOutlineOutlinedIcon />
                    ) : (
                      <PlaylistAddOutlinedIcon />
                    )
                  }
                  color={lesson.isEnrolled ? 'inherit' : 'primary'}
                  disabled={lesson.status !== 'ready'}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (lesson.isEnrolled) {
                      onUnenrollLesson?.(lesson);
                      return;
                    }

                    onEnrollLesson?.(lesson);
                  }}
                  sx={{
                    mt: 1,
                    alignSelf: 'flex-start',
                    borderRadius: 999,
                    textTransform: 'none',
                    fontWeight: 700,
                  }}
                >
                  {lesson.isEnrolled ? 'Remove from My Lessons' : 'Add to My Lessons'}
                </Button>
              )}

              {showUnenrollAction && (
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  startIcon={<RemoveCircleOutlineOutlinedIcon />}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onUnenrollLesson?.(lesson);
                  }}
                  sx={{
                    mt: 1,
                    alignSelf: 'flex-start',
                    borderRadius: 999,
                    textTransform: 'none',
                    fontWeight: 700,
                  }}
                >
                  Remove from My Lessons
                </Button>
              )}
            </Stack>
          </Box>
        </Paper>
        );
      })}
    </Box>
  );
}
