'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Chip,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import ArrowDropDownOutlinedIcon from '@mui/icons-material/ArrowDropDownOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import PlaylistAddOutlinedIcon from '@mui/icons-material/PlaylistAddOutlined';
import { AI_DIGITAL_COLORS } from '../../lib/brandColors';

const SUCCESS = '#229E5A';
const ACCENTS = [
  AI_DIGITAL_COLORS.yvesKleinBlue,
  AI_DIGITAL_COLORS.lime,
  AI_DIGITAL_COLORS.pink,
];

function getRoadmapProgress(roadmap) {
  const completedCount = roadmap.lessons.filter((lesson) => lesson.isCompleted).length;
  const totalCount = roadmap.lessons.length;
  const firstIncompleteIndex = roadmap.lessons.findIndex((lesson) => !lesson.isCompleted);
  const activeStep = firstIncompleteIndex === -1 ? -1 : firstIncompleteIndex;

  return {
    activeStep,
    completedCount,
    percent: totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100),
    totalCount,
  };
}

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

function RoadmapStep({ lesson, index, state }) {
  const isDone = state === 'done';
  const isCurrent = state === 'current';

  return (
    <Box
      sx={{
        flex: '1 1 0',
        minWidth: 126,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.25,
        position: 'relative',
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          backgroundColor: isDone ? SUCCESS : isCurrent ? AI_DIGITAL_COLORS.yvesKleinBlue : '#fff',
          border: isDone || isCurrent ? 0 : '2px solid rgba(0, 9, 220, 0.2)',
          color: isCurrent || isDone ? '#fff' : '#80808E',
          display: 'grid',
          placeItems: 'center',
          fontFamily: '"Barlow Semi Condensed", Inter, Arial, sans-serif',
          fontWeight: 900,
          fontSize: 15,
          lineHeight: 1,
          zIndex: 1,
          position: 'relative',
          boxShadow: isCurrent ? '0 0 0 6px rgba(0, 9, 220, 0.12)' : 'none',
        }}
      >
        {isDone ? <CheckOutlinedIcon sx={{ fontSize: 17, strokeWidth: 3 }} /> : index + 1}
      </Box>

      <Box
        component={Link}
        href={`/lessons/${lesson.id}`}
        onClick={(event) => event.stopPropagation()}
        sx={{
          color: isCurrent
            ? AI_DIGITAL_COLORS.yvesKleinBlue
            : isDone
              ? '#0B0B0B'
              : '#80808E',
          textAlign: 'center',
          textDecoration: 'none',
          fontSize: 12,
          fontWeight: isCurrent || isDone ? 700 : 600,
          lineHeight: 1.3,
          px: 0.5,
          display: '-webkit-box',
          overflow: 'hidden',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          '&:hover': {
            color: AI_DIGITAL_COLORS.yvesKleinBlue,
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          },
        }}
      >
        {lesson.title}
      </Box>
    </Box>
  );
}

function getPrimaryLessonHref(roadmap, activeStep) {
  const targetLesson =
    activeStep >= 0
      ? roadmap.lessons[activeStep]
      : roadmap.lessons[roadmap.lessons.length - 1];

  return targetLesson ? `/lessons/${targetLesson.id}` : '#';
}

export default function RoadmapsGrid({
  roadmaps = [],
  onEnrollRoadmap,
  onUnenrollRoadmap,
  onAssignRoadmap,
  onOpenRoadmap,
  canAssignLearning = false,
}) {
  const [enrollmentMenu, setEnrollmentMenu] = useState({
    anchorEl: null,
    roadmap: null,
  });
  const isEnrollmentMenuOpen = Boolean(enrollmentMenu.anchorEl);

  const closeEnrollmentMenu = () => {
    setEnrollmentMenu({
      anchorEl: null,
      roadmap: null,
    });
  };

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 2,
        }}
      >
        {roadmaps.map((roadmap, roadmapIndex) => {
          const progress = getRoadmapProgress(roadmap);
          const canOpenRoadmap = Boolean(onOpenRoadmap && roadmap.viewerCanManage);
          const tags = Array.isArray(roadmap.tags) ? roadmap.tags : [];
          const accentColor = ACCENTS[roadmapIndex % ACCENTS.length];
          const primaryLessonHref = getPrimaryLessonHref(roadmap, progress.activeStep);
          const hasEnrollmentAction = Boolean(onEnrollRoadmap || onUnenrollRoadmap);
          const showContinueAction = roadmap.isEnrolled && progress.totalCount > 0;
          const progressRatio =
            progress.totalCount <= 1
              ? progress.completedCount > 0 ? 1 : 0
              : Math.min(progress.completedCount, progress.totalCount - 1) / (progress.totalCount - 1);
          const trackInset = progress.totalCount > 0
            ? `${100 / (progress.totalCount * 2)}%`
            : '50%';

          return (
            <Paper
              key={roadmap.id}
              elevation={0}
              onClick={canOpenRoadmap ? () => onOpenRoadmap(roadmap) : undefined}
              sx={{
                p: { xs: 2.25, md: 3 },
                borderRadius: 2,
                border: '1px solid rgba(0, 9, 220, 0.12)',
                backgroundColor: '#fff',
                position: 'relative',
                overflow: 'hidden',
                cursor: canOpenRoadmap ? 'pointer' : 'default',
                transition: 'border-color 150ms ease, box-shadow 150ms ease',
                '&:hover': canOpenRoadmap
                  ? {
                      borderColor: 'rgba(0, 9, 220, 0.28)',
                      boxShadow: '0 18px 40px rgba(11, 11, 11, 0.08)',
                    }
                  : undefined,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  backgroundColor: accentColor,
                },
              }}
            >
              <Stack spacing={2.5}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={2}
                  sx={{
                    alignItems: { xs: 'stretch', md: 'flex-start' },
                    justifyContent: 'space-between',
                    pl: { xs: 0, md: 0.25 },
                  }}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 1.25 }}>
                      <Chip
                        icon={<AccountTreeOutlinedIcon />}
                        label="Roadmap"
                        size="small"
                        sx={{
                          height: 25,
                          borderRadius: 999,
                          backgroundColor: '#F5F5FE',
                          color: AI_DIGITAL_COLORS.yvesKleinBlue,
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          '& .MuiChip-icon': {
                            color: 'inherit',
                            fontSize: 14,
                          },
                        }}
                      />
                      <Chip
                        label={`${progress.completedCount}/${progress.totalCount} completed`}
                        size="small"
                        sx={{
                          height: 25,
                          borderRadius: 999,
                          backgroundColor: '#F2F1F3',
                          color: '#33344A',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      />
                      {roadmap.viewerCanManage && (
                        <Chip
                          label="Editable"
                          size="small"
                          sx={{
                            height: 25,
                            borderRadius: 999,
                            backgroundColor: '#fff',
                            border: '1px solid rgba(0, 9, 220, 0.18)',
                            color: '#33344A',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        />
                      )}
                    </Stack>

                    <Typography
                      component="h3"
                      sx={{
                        color: '#0B0B0B',
                        fontFamily: '"Barlow Semi Condensed", Inter, Arial, sans-serif',
                        fontSize: { xs: 26, md: 32 },
                        fontWeight: 900,
                        letterSpacing: 0,
                        lineHeight: 1,
                      }}
                    >
                      {roadmap.title}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 1,
                        color: '#80808E',
                        fontSize: 14,
                        lineHeight: 1.45,
                        maxWidth: 620,
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {roadmap.description || 'A curated learning path built from existing lessons.'}
                    </Typography>

                    {tags.length > 0 && (
                      <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', mt: 1.5 }}>
                        {tags.slice(0, 5).map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            sx={{
                              height: 24,
                              borderRadius: 999,
                              backgroundColor: '#F2F1F3',
                              color: '#33344A',
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          />
                        ))}
                        {tags.length > 5 && (
                          <Chip
                            label={`+${tags.length - 5}`}
                            size="small"
                            sx={{ height: 24, borderRadius: 999, fontWeight: 800 }}
                          />
                        )}
                      </Stack>
                    )}
                  </Box>

                  <Box sx={{ textAlign: { xs: 'left', md: 'right' }, flexShrink: 0 }}>
                    <Typography
                      sx={{
                        color: AI_DIGITAL_COLORS.yvesKleinBlue,
                        fontFamily: '"Barlow Semi Condensed", Inter, Arial, sans-serif',
                        fontSize: 36,
                        fontWeight: 900,
                        letterSpacing: 0,
                        lineHeight: 1,
                      }}
                    >
                      {progress.percent}%
                    </Typography>
                    <Typography sx={{ mt: 0.5, color: '#80808E', fontSize: 11 }}>
                      {roadmap.createdBy || 'AI Onboarding'} - Created {formatDate(roadmap.createdAt)}
                    </Typography>
                  </Box>
                </Stack>

                {progress.totalCount > 0 && (
                  <Box sx={{ overflowX: 'auto', px: { xs: 0, md: 2 }, py: 1 }}>
                    <Box
                      sx={{
                        position: 'relative',
                        minWidth: Math.max(520, roadmap.lessons.length * 150),
                        pt: 1,
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          left: trackInset,
                          right: trackInset,
                          top: 30,
                          height: 2,
                          backgroundColor: 'rgba(0, 9, 220, 0.14)',
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: `${progressRatio * 100}%`,
                            backgroundColor: AI_DIGITAL_COLORS.yvesKleinBlue,
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        {roadmap.lessons.map((lesson, index) => (
                          <RoadmapStep
                            key={lesson.id}
                            lesson={lesson}
                            index={index}
                            state={
                              index < progress.completedCount
                                ? 'done'
                                : index === progress.completedCount
                                  ? 'current'
                                  : 'idle'
                            }
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                )}

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  sx={{
                    alignItems: { xs: 'stretch', sm: 'center' },
                    justifyContent: 'space-between',
                    pt: 2,
                    borderTop: '1px solid rgba(0, 9, 220, 0.12)',
                  }}
                >
                  <Typography sx={{ color: '#80808E', fontSize: 13 }}>
                    {progress.totalCount} lesson{progress.totalCount === 1 ? '' : 's'}
                  </Typography>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' } }}>
                    {showContinueAction && (
                      <Button
                        component={Link}
                        href={primaryLessonHref}
                        variant="contained"
                        endIcon={<ArrowForwardOutlinedIcon />}
                        onClick={(event) => event.stopPropagation()}
                        sx={{
                          borderRadius: 999,
                          backgroundColor: AI_DIGITAL_COLORS.yvesKleinBlue,
                          boxShadow: 'none',
                          color: '#fff',
                          px: 2.25,
                          py: 1.2,
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          '&:hover': {
                            backgroundColor: '#0007B8',
                            boxShadow: 'none',
                          },
                        }}
                      >
                        Continue path
                      </Button>
                    )}

                    {hasEnrollmentAction && (
                      <Button
                        variant={roadmap.isEnrolled ? 'outlined' : 'contained'}
                        color="inherit"
                        startIcon={!roadmap.isEnrolled ? <PlaylistAddOutlinedIcon /> : undefined}
                        endIcon={canAssignLearning ? <ArrowDropDownOutlinedIcon /> : undefined}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          if (canAssignLearning) {
                            setEnrollmentMenu({
                              anchorEl: event.currentTarget,
                              roadmap,
                            });
                            return;
                          }

                          if (roadmap.isEnrolled) {
                            onUnenrollRoadmap?.(roadmap);
                            return;
                          }

                          onEnrollRoadmap?.(roadmap);
                        }}
                        sx={{
                          borderRadius: 999,
                          borderColor: 'rgba(0, 9, 220, 0.24)',
                          boxShadow: 'none',
                          px: 2.25,
                          py: 1.2,
                          color: roadmap.isEnrolled ? '#33344A' : '#fff',
                          backgroundColor: roadmap.isEnrolled ? '#fff' : AI_DIGITAL_COLORS.yvesKleinBlue,
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          '&:hover': {
                            borderColor: 'rgba(0, 9, 220, 0.36)',
                            backgroundColor: roadmap.isEnrolled ? '#F5F5FE' : '#0007B8',
                            boxShadow: 'none',
                          },
                        }}
                      >
                        {canAssignLearning
                          ? roadmap.isEnrolled
                            ? 'Added to...'
                            : 'Add to...'
                          : roadmap.isEnrolled
                            ? 'Remove path'
                            : 'Subscribe'}
                      </Button>
                    )}
                  </Stack>
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
            const roadmap = enrollmentMenu.roadmap;
            closeEnrollmentMenu();

            if (!roadmap) {
              return;
            }

            if (roadmap.isEnrolled) {
              onUnenrollRoadmap?.(roadmap);
              return;
            }

            onEnrollRoadmap?.(roadmap);
          }}
        >
          {enrollmentMenu.roadmap?.isEnrolled ? 'Remove from My Roadmaps' : 'My Roadmaps'}
        </MenuItem>
        <MenuItem
          onClick={() => {
            const roadmap = enrollmentMenu.roadmap;
            closeEnrollmentMenu();
            onAssignRoadmap?.(roadmap);
          }}
        >
          Team members...
        </MenuItem>
      </Menu>
    </>
  );
}
