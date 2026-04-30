'use client';

import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Step,
  StepConnector,
  StepLabel,
  Stepper,
  Typography,
  stepConnectorClasses,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import PlaylistAddCheckOutlinedIcon from '@mui/icons-material/PlaylistAddCheckOutlined';
import PlaylistAddOutlinedIcon from '@mui/icons-material/PlaylistAddOutlined';
import RadioButtonUncheckedOutlinedIcon from '@mui/icons-material/RadioButtonUncheckedOutlined';

const ACCENT_GREEN = '#10b981';
const ACCENT_GREEN_DARK = '#047857';
const ACCENT_GREEN_LIGHT = '#d1fae5';

const RoadmapConnector = styled(StepConnector)(() => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
    left: 'calc(-50% + 22px)',
    right: 'calc(50% + 22px)',
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 4,
    border: 0,
    borderRadius: 999,
    backgroundColor: '#dbe4ea',
  },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
    background: `linear-gradient(90deg, ${ACCENT_GREEN} 0%, #8ee7f1 100%)`,
  },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
    background: `linear-gradient(90deg, ${ACCENT_GREEN_DARK} 0%, ${ACCENT_GREEN} 100%)`,
  },
}));

function RoadmapStepIcon({ active, completed, className }) {
  const Icon = completed ? CheckCircleOutlineOutlinedIcon : active ? FlagOutlinedIcon : RadioButtonUncheckedOutlinedIcon;

  return (
    <Box
      className={className}
      sx={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        color: completed || active ? '#fff' : '#64748b',
        background: completed
          ? `linear-gradient(135deg, ${ACCENT_GREEN_DARK} 0%, ${ACCENT_GREEN} 100%)`
          : active
            ? `linear-gradient(135deg, ${ACCENT_GREEN} 0%, #14b8a6 100%)`
            : '#fff',
        border: completed || active ? '0' : '2px solid #cbd5e1',
        boxShadow: completed || active
          ? '0 12px 24px rgba(16, 185, 129, 0.24)'
          : '0 8px 18px rgba(15, 23, 42, 0.08)',
      }}
    >
      <Icon fontSize="small" />
    </Box>
  );
}

function getRoadmapProgress(roadmap) {
  const completedCount = roadmap.lessons.filter((lesson) => lesson.isCompleted).length;
  const totalCount = roadmap.lessons.length;
  const activeStep = totalCount === 0
    ? 0
    : Math.min(completedCount, totalCount - 1);

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

export default function RoadmapsGrid({
  roadmaps = [],
  onEnrollRoadmap,
  onUnenrollRoadmap,
  onOpenRoadmap,
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 2,
      }}
    >
      {roadmaps.map((roadmap) => {
        const progress = getRoadmapProgress(roadmap);

        return (
          <Paper
            key={roadmap.id}
            elevation={0}
            onClick={() => onOpenRoadmap?.(roadmap)}
            sx={{
              p: { xs: 2.25, md: 3 },
              borderRadius: 4,
              border: '1px solid #dbe4ea',
              background:
                'linear-gradient(135deg, #ffffff 0%, #f8fffc 58%, #eefbf7 100%)',
              boxShadow: '0 18px 44px rgba(15, 23, 42, 0.06)',
              cursor: onOpenRoadmap ? 'pointer' : 'default',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
              '&:hover': onOpenRoadmap
                ? {
                    transform: 'translateY(-2px)',
                    borderColor: '#99f6e4',
                    boxShadow: '0 24px 56px rgba(15, 23, 42, 0.1)',
                  }
                : undefined,
            }}
          >
            <Stack spacing={3}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{
                  alignItems: { xs: 'stretch', md: 'flex-start' },
                  justifyContent: 'space-between',
                }}
              >
                <Stack direction="row" spacing={2} sx={{ minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      color: ACCENT_GREEN_DARK,
                      backgroundColor: ACCENT_GREEN_LIGHT,
                      flexShrink: 0,
                    }}
                  >
                    <AccountTreeOutlinedIcon />
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 1 }}>
                      <Chip
                        label={roadmap.isEnrolled ? 'Subscribed' : 'Roadmap'}
                        sx={{
                          color: roadmap.isEnrolled ? '#fff' : ACCENT_GREEN_DARK,
                          backgroundColor: roadmap.isEnrolled ? ACCENT_GREEN : ACCENT_GREEN_LIGHT,
                          fontWeight: 800,
                        }}
                        size="small"
                      />
                      <Chip
                        icon={<PlaylistAddCheckOutlinedIcon />}
                        label={`${progress.completedCount}/${progress.totalCount} completed`}
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </Stack>

                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 950,
                        lineHeight: 1.08,
                        mb: 1,
                        color: '#0f172a',
                      }}
                    >
                      {roadmap.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        maxWidth: 820,
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {roadmap.description || 'A curated learning path built from existing lessons.'}
                    </Typography>
                  </Box>
                </Stack>

                <Stack
                  spacing={1}
                  sx={{
                    alignItems: { xs: 'stretch', md: 'flex-end' },
                    flexShrink: 0,
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 950, color: ACCENT_GREEN_DARK }}>
                    {progress.percent}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Created {formatDate(roadmap.createdAt)}
                  </Typography>
                  <Chip
                    icon={<PersonOutlineOutlinedIcon />}
                    label={roadmap.createdBy || 'AI Onboarding'}
                    variant="outlined"
                    size="small"
                  />
                </Stack>
              </Stack>

              <Box
                sx={{
                  overflowX: 'auto',
                  px: { xs: 0, md: 1 },
                  pb: 0.5,
                }}
              >
                <Stepper
                  alternativeLabel
                  activeStep={progress.activeStep}
                  connector={<RoadmapConnector />}
                  sx={{
                    minWidth: Math.max(560, roadmap.lessons.length * 150),
                    py: 1,
                    '& .MuiStepLabel-label': {
                      mt: 1,
                      fontSize: 13,
                      fontWeight: 800,
                      color: '#475569',
                      lineHeight: 1.25,
                    },
                    '& .MuiStepLabel-label.Mui-completed': {
                      color: ACCENT_GREEN_DARK,
                    },
                    '& .MuiStepLabel-label.Mui-active': {
                      color: '#0f766e',
                    },
                  }}
                >
                  {roadmap.lessons.map((lesson) => (
                    <Step key={lesson.id} completed={lesson.isCompleted}>
                      <StepLabel slots={{ stepIcon: RoadmapStepIcon }}>
                        {lesson.title}
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{
                  alignItems: { xs: 'stretch', sm: 'center' },
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {progress.totalCount} lesson{progress.totalCount === 1 ? '' : 's'} in this roadmap
                </Typography>

                <Button
                  variant={roadmap.isEnrolled ? 'outlined' : 'contained'}
                  color={roadmap.isEnrolled ? 'inherit' : 'primary'}
                  startIcon={
                    roadmap.isEnrolled ? (
                      <CheckCircleOutlineOutlinedIcon />
                    ) : (
                      <PlaylistAddOutlinedIcon />
                    )
                  }
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (roadmap.isEnrolled) {
                      onUnenrollRoadmap?.(roadmap);
                      return;
                    }

                    onEnrollRoadmap?.(roadmap);
                  }}
                  sx={{
                    borderRadius: 999,
                    textTransform: 'none',
                    fontWeight: 900,
                    px: 2.5,
                    ...(roadmap.isEnrolled
                      ? {}
                      : {
                          backgroundColor: ACCENT_GREEN,
                          '&:hover': {
                            backgroundColor: ACCENT_GREEN_DARK,
                          },
                        }),
                  }}
                >
                  {roadmap.isEnrolled ? 'Unsubscribe' : 'Subscribe'}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        );
      })}
    </Box>
  );
}
