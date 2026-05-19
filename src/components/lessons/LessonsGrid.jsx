'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import ArrowDropDownOutlinedIcon from '@mui/icons-material/ArrowDropDownOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import OndemandVideoOutlinedIcon from '@mui/icons-material/OndemandVideoOutlined';
import PlaylistAddOutlinedIcon from '@mui/icons-material/PlaylistAddOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import StyleOutlinedIcon from '@mui/icons-material/StyleOutlined';
import { getLessonCoverBackground } from '../../lib/brandColors';

const CARD_TOKENS = {
  ink: '#0B0B0B',
  slate: '#33344A',
  mute: '#80808E',
  blue: '#0009DC',
  blue50: '#F5F5FE',
  blue100: '#E5E5FA',
  blue200: '#C7C7F0',
  bg3: '#F2F1F3',
  orange: '#FF642D',
  success: 'rgb(34,158,90)',
};

const STATUS_PALETTE = {
  ready: {
    fg: CARD_TOKENS.success,
    bg: 'rgba(34,158,90,0.10)',
    dot: CARD_TOKENS.success,
  },
  draft: {
    fg: CARD_TOKENS.orange,
    bg: 'rgba(255,100,45,0.10)',
    dot: CARD_TOKENS.orange,
  },
  generating: {
    fg: CARD_TOKENS.orange,
    bg: 'rgba(255,100,45,0.10)',
    dot: CARD_TOKENS.orange,
  },
  failed: {
    fg: '#D92D20',
    bg: 'rgba(217,45,32,0.10)',
    dot: '#D92D20',
  },
  archived: {
    fg: CARD_TOKENS.mute,
    bg: 'rgba(128,128,142,0.12)',
    dot: CARD_TOKENS.mute,
  },
  private: {
    fg: CARD_TOKENS.mute,
    bg: 'rgba(128,128,142,0.12)',
    dot: CARD_TOKENS.mute,
  },
};

function getPublicationLabel(lesson) {
  if (lesson.isArchived || lesson.publicationStatus === 'archived') {
    return 'archived';
  }

  if (lesson.status !== 'ready') {
    return lesson.status;
  }

  if (!lesson.isPublished) {
    return 'draft';
  }

  return lesson.status;
}

function getEnrollmentActionLabel(lesson, enrolledLabel, defaultLabel) {
  if (lesson.isEnrolled) {
    return enrolledLabel;
  }

  if (lesson.isArchived) {
    return 'Archived';
  }

  if (lesson.status === 'draft') {
    return 'Draft...';
  }

  if (lesson.status === 'generating') {
    return 'Generating...';
  }

  if (lesson.status === 'failed') {
    return 'Failed';
  }

  return lesson.isPublished ? defaultLabel : 'Draft...';
}

function getStatusPalette(label) {
  return STATUS_PALETTE[label] || STATUS_PALETTE.private;
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

function getActivityIcon(type) {
  if (type === 'quiz') {
    return <QuizOutlinedIcon sx={{ fontSize: 13 }} />;
  }

  return <StyleOutlinedIcon sx={{ fontSize: 13 }} />;
}

function getActivityCounts(activities) {
  return activities.reduce(
    (counts, activity) => ({
      flashcards: counts.flashcards + (activity.type === 'flashcards' ? 1 : 0),
      quizzes: counts.quizzes + (activity.type === 'quiz' ? 1 : 0),
    }),
    { flashcards: 0, quizzes: 0 }
  );
}

function getLessonCoverImageSrc(lesson) {
  return lesson.coverImageStorageKey
    ? `/api/files/object?storageKey=${encodeURIComponent(lesson.coverImageStorageKey)}`
    : '';
}

export default function LessonsGrid({
  lessons = [],
  onOpenLesson,
  onEnrollLesson,
  onUnenrollLesson,
  onAssignLesson,
  showEnrollmentAction = false,
  showUnenrollAction = false,
  isOpenEnabled = true,
  getLessonHref,
  showProgressStatus = false,
  canAssignLearning = false,
}) {
  const [enrollmentMenu, setEnrollmentMenu] = useState({
    anchorEl: null,
    lesson: null,
  });
  const [expandedTagLessonIds, setExpandedTagLessonIds] = useState(() => new Set());
  const isEnrollmentMenuOpen = Boolean(enrollmentMenu.anchorEl);

  const closeEnrollmentMenu = () => {
    setEnrollmentMenu({
      anchorEl: null,
      lesson: null,
    });
  };

  const toggleExpandedTags = (event, lessonId) => {
    event.preventDefault();
    event.stopPropagation();

    setExpandedTagLessonIds((prev) => {
      const next = new Set(prev);

      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }

      return next;
    });
  };

  return (
    <>
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
        const activityCounts = getActivityCounts(activities);
        const tags = Array.isArray(lesson.tags) ? lesson.tags : [];
        const publicationLabel = getPublicationLabel(lesson);
        const statusPalette = getStatusPalette(publicationLabel);
        const areTagsExpanded = expandedTagLessonIds.has(lesson.id);
        const visibleTags = areTagsExpanded ? tags : tags.slice(0, 2);
        const hiddenTagCount = Math.max(tags.length - 2, 0);
        const hasActivities = activityCounts.flashcards > 0 || activityCounts.quizzes > 0;
        const hasTeacherVideo = Boolean(lesson.generationMetadata?.teacherVideo?.videoUrl);
        const isCompactEnrollmentAction = showEnrollmentAction && !canAssignLearning;
        const footerActionMaxWidth = showUnenrollAction ? 98 : isCompactEnrollmentAction ? 208 : 138;
        const coverImageSrc = getLessonCoverImageSrc(lesson);

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
              borderRadius: '14px',
              border: `1px solid ${CARD_TOKENS.blue100}`,
              backgroundColor: '#fff',
              p: '14px',
              minHeight: 400,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              color: 'inherit',
              textDecoration: 'none',
              cursor:
                getLessonHref || (isOpenEnabled && onOpenLesson)
                  ? 'pointer'
                  : 'default',
              transition: 'transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
              '&:hover':
                getLessonHref || (isOpenEnabled && onOpenLesson)
                  ? {
                      transform: 'translateY(-2px)',
                      borderColor: CARD_TOKENS.blue200,
                      boxShadow: '0 12px 32px rgba(11, 11, 11, 0.08)',
                    }
                  : undefined,
            }}
          >
          <Box
            sx={{
              aspectRatio: '16 / 8',
              borderRadius: '10px',
              background: coverImageSrc ? CARD_TOKENS.blue50 : getLessonCoverBackground(lesson),
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {coverImageSrc && (
              <Box
                component="img"
                src={coverImageSrc}
                alt=""
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  objectFit: 'cover',
                }}
              />
            )}
            <Chip
              label={publicationLabel}
              size="small"
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                height: 24,
                borderRadius: 999,
                border: '1px solid rgba(11,11,11,0.06)',
                backgroundColor: 'rgba(255,255,255,0.95)',
                color: statusPalette.fg,
                boxShadow: '0 2px 8px rgba(11,11,11,0.08)',
                backdropFilter: 'blur(8px)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                '& .MuiChip-label': {
                  px: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  '&::before': {
                    content: '""',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: statusPalette.dot,
                  },
                },
              }}
            />
          </Box>

            <Typography
              component="h3"
              sx={{
                mx: 0.5,
                mt: 0.5,
                mb: 0,
                color: CARD_TOKENS.ink,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                lineHeight: 1.3,
                display: '-webkit-box',
                overflow: 'hidden',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                textWrap: 'balance',
              }}
            >
              {lesson.title}
            </Typography>

            {showProgressStatus && (
              <Box sx={{ px: 0.5 }}>
                <Chip
                  label={lesson.isCompleted ? 'Completed' : 'Not completed'}
                  color={lesson.isCompleted ? 'success' : 'default'}
                  size="small"
                  variant={lesson.isCompleted ? 'filled' : 'outlined'}
                  sx={{ height: 22, borderRadius: 999, fontSize: 11, fontWeight: 700 }}
                />
              </Box>
            )}

            <Typography
              sx={{
                mx: 0.5,
                color: CARD_TOKENS.slate,
                fontSize: 12,
                lineHeight: 1.5,
                display: '-webkit-box',
                overflow: 'hidden',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {getLessonPreview(lesson)}
            </Typography>

            {tags.length > 0 && (
              <Stack direction="row" spacing={0.625} useFlexGap sx={{ flexWrap: 'wrap', px: 0.5 }}>
                {visibleTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{
                      height: 23,
                      maxWidth: '100%',
                      borderRadius: 999,
                      border: `1px solid ${CARD_TOKENS.blue100}`,
                      backgroundColor: '#fff',
                      color: CARD_TOKENS.slate,
                      fontSize: 11,
                      fontWeight: 600,
                      '& .MuiChip-label': {
                        px: 1.1,
                      },
                    }}
                  />
                ))}
                {hiddenTagCount > 0 && !areTagsExpanded && (
                  <Chip
                    label={`+${hiddenTagCount} more`}
                    size="small"
                    onClick={(event) => toggleExpandedTags(event, lesson.id)}
                    sx={{
                      height: 23,
                      borderRadius: 999,
                      backgroundColor: CARD_TOKENS.bg3,
                      color: CARD_TOKENS.mute,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: CARD_TOKENS.blue50,
                      },
                    }}
                  />
                )}
                {hiddenTagCount > 0 && areTagsExpanded && (
                  <Chip
                    label="Less"
                    size="small"
                    onClick={(event) => toggleExpandedTags(event, lesson.id)}
                    sx={{
                      height: 23,
                      borderRadius: 999,
                      backgroundColor: CARD_TOKENS.bg3,
                      color: CARD_TOKENS.mute,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: CARD_TOKENS.blue50,
                      },
                    }}
                  />
                )}
              </Stack>
            )}

            {hasActivities && (
              <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', px: 0.5 }}>
                {activityCounts.flashcards > 0 && (
                  <Chip
                    icon={getActivityIcon('flashcards')}
                    label={`${activityCounts.flashcards} ${
                      activityCounts.flashcards === 1 ? 'flashcard set' : 'flashcard sets'
                    }`}
                    size="small"
                    sx={{
                      height: 24,
                      borderRadius: 999,
                      backgroundColor: CARD_TOKENS.blue50,
                      color: CARD_TOKENS.blue,
                      fontSize: 11,
                      fontWeight: 600,
                      '& .MuiChip-icon': {
                        color: 'inherit',
                        ml: 0.9,
                        mr: -0.4,
                      },
                    }}
                  />
                )}
                {activityCounts.quizzes > 0 && (
                  <Chip
                    icon={getActivityIcon('quiz')}
                    label={`${activityCounts.quizzes} ${activityCounts.quizzes === 1 ? 'quiz' : 'quizzes'}`}
                    size="small"
                    sx={{
                      height: 24,
                      borderRadius: 999,
                      backgroundColor: 'rgba(34,158,90,0.10)',
                      color: CARD_TOKENS.success,
                      fontSize: 11,
                      fontWeight: 600,
                      '& .MuiChip-icon': {
                        color: 'inherit',
                        ml: 0.9,
                        mr: -0.4,
                      },
                    }}
                  />
                )}
              </Stack>
            )}

            {hasTeacherVideo && (
              <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', px: 0.5 }}>
                <Chip
                  icon={<OndemandVideoOutlinedIcon sx={{ fontSize: 13 }} />}
                  label="Teacher video"
                  size="small"
                  sx={{
                    height: 24,
                    borderRadius: 999,
                    backgroundColor: 'rgba(242, 53, 168, 0.10)',
                    color: '#C02686',
                    fontSize: 11,
                    fontWeight: 700,
                    '& .MuiChip-icon': {
                      color: 'inherit',
                      ml: 0.9,
                      mr: -0.4,
                    },
                  }}
                />
              </Stack>
            )}

            <Stack
              direction="row"
              spacing={1}
              sx={{
                mt: 'auto',
                mx: 0.5,
                pt: 1.5,
                pb: 0.5,
                borderTop: `1px solid ${CARD_TOKENS.blue100}`,
                alignItems: 'center',
                justifyContent: 'space-between',
                minWidth: 0,
              }}
            >
              <Stack
                direction="row"
                spacing={0.5}
                sx={{
                  minWidth: 0,
                  flex: '1 1 auto',
                  maxWidth: isCompactEnrollmentAction
                    ? { xs: 44, sm: 56 }
                    : `calc(100% - ${footerActionMaxWidth + 6}px)`,
                  alignItems: 'center',
                  color: CARD_TOKENS.mute,
                  fontSize: 11,
                  overflow: 'hidden',
                }}
              >
                <Tooltip title={lesson.createdBy || 'AI Onboarding'} enterDelay={400}>
                  <Typography
                    component="span"
                    sx={{
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'inherit',
                      fontSize: 'inherit',
                    }}
                  >
                    {lesson.createdBy || 'AI Onboarding'}
                  </Typography>
                </Tooltip>
              </Stack>

              <Stack
                direction="row"
                spacing={1}
                sx={{
                  flex: '0 0 auto',
                  justifyContent: 'flex-end',
                  maxWidth: isCompactEnrollmentAction
                    ? `calc(100% - 28px)`
                    : footerActionMaxWidth,
                }}
              >
              {showEnrollmentAction && canAssignLearning && (
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
                  endIcon={<ArrowDropDownOutlinedIcon />}
                  color={lesson.isEnrolled ? 'inherit' : 'primary'}
                  disabled={lesson.status !== 'ready' || !lesson.isPublished || lesson.isArchived}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setEnrollmentMenu({
                      anchorEl: event.currentTarget,
                      lesson,
                    });
                  }}
                  sx={{
                    flexShrink: 0,
                    minWidth: 0,
                    maxWidth: footerActionMaxWidth,
                    whiteSpace: 'nowrap',
                    borderRadius: 999,
                    borderColor: lesson.isEnrolled ? CARD_TOKENS.blue200 : 'transparent',
                    backgroundColor: lesson.isEnrolled ? 'transparent' : CARD_TOKENS.blue,
                    boxShadow: 'none',
                    color: lesson.isEnrolled ? CARD_TOKENS.mute : '#fff',
                    px: 1.5,
                    py: 0.875,
                    fontSize: 11,
                    fontWeight: lesson.isEnrolled ? 600 : 700,
                    letterSpacing: lesson.isEnrolled ? '0.02em' : '0.04em',
                    textTransform: 'none',
                    '& .MuiButton-startIcon': { mr: 0.5 },
                    '& .MuiButton-endIcon': { ml: 0.35 },
                    '& .MuiButton-startIcon, & .MuiButton-endIcon': {
                      flexShrink: 0,
                    },
                    '&:hover': {
                      borderColor: lesson.isEnrolled ? CARD_TOKENS.blue200 : 'transparent',
                      backgroundColor: lesson.isEnrolled ? CARD_TOKENS.blue50 : '#0007B8',
                      boxShadow: 'none',
                    },
                  }}
                >
                  {getEnrollmentActionLabel(lesson, 'Added to...', 'Add to...')}
                </Button>
              )}

              {showEnrollmentAction && !canAssignLearning && (
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
                  disabled={lesson.status !== 'ready' || !lesson.isPublished || lesson.isArchived}
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
                    flexShrink: 0,
                    minWidth: 0,
                    maxWidth: footerActionMaxWidth,
                    whiteSpace: 'nowrap',
                    borderRadius: 999,
                    borderColor: lesson.isEnrolled ? CARD_TOKENS.blue200 : 'transparent',
                    backgroundColor: lesson.isEnrolled ? 'transparent' : CARD_TOKENS.blue,
                    boxShadow: 'none',
                    color: lesson.isEnrolled ? CARD_TOKENS.mute : '#fff',
                    px: 1.5,
                    py: 0.875,
                    fontSize: 11,
                    fontWeight: lesson.isEnrolled ? 600 : 700,
                    letterSpacing: lesson.isEnrolled ? '0.02em' : '0.04em',
                    textTransform: 'none',
                    '& .MuiButton-startIcon': {
                      flexShrink: 0,
                      mr: 0.5,
                    },
                    '& .MuiButton-icon': {
                      flexShrink: 0,
                    },
                    '&:hover': {
                      borderColor: lesson.isEnrolled ? CARD_TOKENS.blue200 : 'transparent',
                      backgroundColor: lesson.isEnrolled ? CARD_TOKENS.blue50 : '#0007B8',
                      boxShadow: 'none',
                    },
                  }}
                >
                  {getEnrollmentActionLabel(lesson, 'Remove from My Lessons', 'Add to My Lessons')}
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
                    flexShrink: 0,
                    minWidth: 0,
                    maxWidth: footerActionMaxWidth,
                    whiteSpace: 'nowrap',
                    borderRadius: 999,
                    borderColor: CARD_TOKENS.blue200,
                    color: CARD_TOKENS.mute,
                    px: 1.5,
                    py: 0.875,
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'none',
                    '& .MuiButton-startIcon': {
                      flexShrink: 0,
                      mr: 0.5,
                    },
                    '&:hover': {
                      borderColor: CARD_TOKENS.blue200,
                      backgroundColor: CARD_TOKENS.blue50,
                    },
                  }}
                >
                  Remove
                </Button>
              )}
              </Stack>
            </Stack>
          </Paper>
        );
        })}
      </Box>

      <Menu
        anchorEl={enrollmentMenu.anchorEl}
        open={isEnrollmentMenuOpen}
        onClose={closeEnrollmentMenu}
        disableScrollLock
      >
        <MenuItem
          onClick={() => {
            const lesson = enrollmentMenu.lesson;
            closeEnrollmentMenu();

            if (!lesson) {
              return;
            }

            if (lesson.isEnrolled) {
              onUnenrollLesson?.(lesson);
              return;
            }

            onEnrollLesson?.(lesson);
          }}
        >
          {enrollmentMenu.lesson?.isEnrolled ? 'Remove from My Lessons' : 'My Lessons'}
        </MenuItem>
        <MenuItem
          onClick={() => {
            const lesson = enrollmentMenu.lesson;
            closeEnrollmentMenu();
            onAssignLesson?.(lesson);
          }}
        >
          Team members...
        </MenuItem>
      </Menu>
    </>
  );
}
