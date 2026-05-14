'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import StyleOutlinedIcon from '@mui/icons-material/StyleOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ConfettiBurst from '../roadmaps/ConfettiBurst';
import RoadmapCompletionCelebration from '../roadmaps/RoadmapCompletionCelebration';

function getCards(activity) {
  return Array.isArray(activity?.payload?.cards) ? activity.payload.cards : [];
}

function ScrollableCardText({ children, onScrollableClick }) {
  const contentRef = useRef(null);
  const animationRef = useRef(null);
  const targetScrollTopRef = useRef(0);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const element = contentRef.current;

    if (!element) {
      return undefined;
    }

    const updateOverflow = () => {
      setHasOverflow(element.scrollHeight > element.clientHeight + 1);
      targetScrollTopRef.current = element.scrollTop;
    };

    updateOverflow();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateOverflow);
      return () => window.removeEventListener('resize', updateOverflow);
    }

    const observer = new ResizeObserver(updateOverflow);
    observer.observe(element);

    return () => observer.disconnect();
  }, [children]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const animateScroll = () => {
    const element = contentRef.current;

    if (!element) {
      animationRef.current = null;
      return;
    }

    const distance = targetScrollTopRef.current - element.scrollTop;

    if (Math.abs(distance) < 0.5) {
      element.scrollTop = targetScrollTopRef.current;
      animationRef.current = null;
      return;
    }

    element.scrollTop += distance * 0.22;
    animationRef.current = window.requestAnimationFrame(animateScroll);
  };

  return (
    <Box
      ref={contentRef}
      onWheel={(event) => {
        if (!hasOverflow) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        const element = event.currentTarget;
        const maxScrollTop = element.scrollHeight - element.clientHeight;
        const nextTarget = targetScrollTopRef.current || element.scrollTop;

        targetScrollTopRef.current = Math.max(
          0,
          Math.min(maxScrollTop, nextTarget + event.deltaY)
        );

        if (!animationRef.current) {
          animationRef.current = window.requestAnimationFrame(animateScroll);
        }
      }}
      onClick={(event) => {
        if (hasOverflow) {
          event.stopPropagation();
          onScrollableClick?.();
        }
      }}
      sx={{
        flex: '1 1 auto',
        minHeight: 0,
        overflowY: hasOverflow ? 'auto' : 'hidden',
        overflowX: 'hidden',
        pr: hasOverflow ? 1 : 0,
        cursor: hasOverflow ? 'auto' : 'inherit',
        overscrollBehavior: 'contain',
        scrollbarWidth: hasOverflow ? 'thin' : 'none',
        '&::-webkit-scrollbar': {
          width: hasOverflow ? 8 : 0,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(100, 116, 139, 0.35)',
          borderRadius: 999,
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
      }}
    >
      {children}
    </Box>
  );
}

export default function FlashcardsActivityPlayer({
  lesson,
  activity,
}) {
  const router = useRouter();
  const cards = useMemo(() => getCards(activity), [activity]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [revealedIndexes, setRevealedIndexes] = useState(() =>
    activity.progress?.isCompleted
      ? new Set(cards.map((_, index) => index))
      : new Set()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(Boolean(activity.progress?.isCompleted));
  const [isConfettiActive, setIsConfettiActive] = useState(false);
  const [completedRoadmapsCelebration, setCompletedRoadmapsCelebration] = useState([]);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const currentCard = cards[currentIndex] || null;
  const reviewedCount = revealedIndexes.size;
  const progressValue = cards.length ? Math.round((reviewedCount / cards.length) * 100) : 0;
  const allCardsSeen = cards.length > 0 && reviewedCount === cards.length;

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  useEffect(() => {
    if (!isConfettiActive) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsConfettiActive(false);
    }, 2600);

    return () => window.clearTimeout(timeoutId);
  }, [isConfettiActive]);

  useEffect(() => {
    if (completedRoadmapsCelebration.length === 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCompletedRoadmapsCelebration([]);
    }, 6200);

    return () => window.clearTimeout(timeoutId);
  }, [completedRoadmapsCelebration]);

  const goToCard = (nextIndex) => {
    if (nextIndex < 0 || nextIndex >= cards.length) {
      return;
    }

    setCurrentIndex(nextIndex);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setRevealedIndexes(new Set());
  };

  const handleFlip = () => {
    setIsFlipped((prev) => {
      const nextIsFlipped = !prev;

      if (nextIsFlipped) {
        setRevealedIndexes((current) => new Set([...current, currentIndex]));
      }

      return nextIsFlipped;
    });
  };

  const handleComplete = async () => {
    try {
      setIsSaving(true);

      const response = await fetch(`/api/lessons/${lesson.id}/activities/${activity.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'flashcards',
          reviewedCards: reviewedCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save activity progress.');
      }

      setIsConfettiActive(false);
      window.setTimeout(() => setIsConfettiActive(true), 20);
      setIsCompleted(true);
      router.refresh();

      if (data.completedRoadmaps?.length) {
        setCompletedRoadmapsCelebration(data.completedRoadmaps);
      }

      setToast({
        open: true,
        message: data.lessonCompleted
          ? 'Activity complete. Lesson marked as completed.'
          : 'Activity complete.',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to complete flashcards:', error);
      setToast({
        open: true,
        message: error.message || 'Failed to complete activity.',
        severity: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkIncomplete = async () => {
    try {
      setIsSaving(true);

      const response = await fetch(`/api/lessons/${lesson.id}/activities/${activity.id}/progress`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset activity progress.');
      }

      setIsCompleted(false);
      setCurrentIndex(0);
      setIsFlipped(false);
      setRevealedIndexes(new Set());
      router.refresh();
      setToast({
        open: true,
        message: 'Activity marked as incomplete.',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to reset flashcards:', error);
      setToast({
        open: true,
        message: error.message || 'Failed to reset activity.',
        severity: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (cards.length === 0) {
    return (
      <Alert severity="warning">
        This flashcard activity has no cards.
      </Alert>
    );
  }

  return (
    <>
      <ConfettiBurst active={isConfettiActive} />
      <RoadmapCompletionCelebration
        active={completedRoadmapsCelebration.length > 0}
        roadmaps={completedRoadmapsCelebration}
      />

      <Stack spacing={3}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 4 },
            borderRadius: 2.5,
            border: '1px solid rgba(0, 9, 220, 0.12)',
            backgroundColor: '#fff',
          }}
        >
          <Stack spacing={3}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={3}
              sx={{ alignItems: { xs: 'stretch', md: 'flex-start' }, justifyContent: 'space-between' }}
            >
              <Stack spacing={1} sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 0.75 }}>
                  <Chip
                    icon={<StyleOutlinedIcon />}
                    label="Flashcards"
                    sx={{
                      height: 28,
                      borderRadius: 999,
                      backgroundColor: '#0009DC',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      '& .MuiChip-icon': { color: 'inherit', fontSize: 15 },
                    }}
                  />
                  <Chip
                    label={`${reviewedCount} of ${cards.length} revealed`}
                    sx={{
                      height: 28,
                      borderRadius: 999,
                      backgroundColor: '#F2F1F3',
                      color: '#33344A',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  />
                  {isCompleted && (
                    <Chip
                      icon={<CheckCircleOutlineOutlinedIcon />}
                      label="Completed"
                      sx={{
                        height: 28,
                        borderRadius: 999,
                        backgroundColor: '#229E5A',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        '& .MuiChip-icon': { color: 'inherit', fontSize: 15 },
                      }}
                    />
                  )}
                </Stack>

                <Typography
                  component="h1"
                  sx={{
                    color: '#0B0B0B',
                    fontFamily: '"Barlow Semi Condensed", Inter, Arial, sans-serif',
                    fontSize: { xs: 38, md: 48 },
                    fontWeight: 900,
                    letterSpacing: 0,
                    lineHeight: 0.95,
                  }}
                >
                  {activity.title || 'Flashcards'}
                </Typography>
                <Typography sx={{ color: '#80808E', fontSize: 14 }}>
                  From lesson - {lesson.title}
                </Typography>
              </Stack>

              <Button
                component={Link}
                href={`/lessons/${lesson.id}`}
                startIcon={<ArrowBackOutlinedIcon />}
                variant="outlined"
                color="inherit"
                sx={{
                  borderRadius: 999,
                  borderColor: 'rgba(0, 9, 220, 0.2)',
                  color: '#0009DC',
                  px: 2.5,
                  py: 1.25,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  '&:hover': {
                    borderColor: 'rgba(0, 9, 220, 0.34)',
                    backgroundColor: '#F5F5FE',
                  },
                }}
              >
                Back to lesson
              </Button>
            </Stack>

            <Box>
              <LinearProgress
                variant="determinate"
                value={progressValue}
                sx={{
                  height: 7,
                  borderRadius: 999,
                  backgroundColor: 'rgba(0, 9, 220, 0.06)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, #0009DC 0%, #42B1CF 100%)',
                  },
                }}
              />
              <Typography sx={{ display: 'block', mt: 0.75, color: '#80808E', fontSize: 12 }}>
                {progressValue}% revealed
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: { xs: 352, md: 'clamp(390px, 44vh, 520px)' },
            backgroundColor: 'transparent',
            perspective: '1400px',
            textAlign: 'left',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              height: '100%',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.42s ease',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {[
              {
                side: 'front',
                label: 'Prompt',
                content: currentCard.front,
                helper: 'Click to reveal the answer',
                explanation: '',
                transform: 'rotateY(0deg)',
                contentVariant: 'prompt',
              },
              {
                side: 'back',
                label: 'Answer',
                content: currentCard.back,
                helper: 'Click to hide answer',
                explanation: '',
                transform: 'rotateY(180deg)',
                contentVariant: 'answer',
              },
            ].map((side) => (
              <Paper
                key={side.side}
                component="div"
                role="button"
                tabIndex={0}
                onClick={handleFlip}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleFlip();
                  }
                }}
                elevation={0}
                sx={{
                  position: 'absolute',
                  inset: 0,
                  p: { xs: 3.5, md: 7 },
                  borderRadius: 2.5,
                  border: '1px solid rgba(0, 9, 220, 0.12)',
                  backgroundColor: '#fff',
                  boxShadow:
                    '0 3px 0 rgba(0, 9, 220, 0.08), 0 18px 42px rgba(0, 9, 220, 0.10), 0 1px 2px rgba(15, 23, 42, 0.05)',
                  backfaceVisibility: 'hidden',
                  transform: side.transform,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <Stack
                  spacing={2}
                  sx={{
                    flex: '1 1 auto',
                    minHeight: 0,
                    overflow: 'hidden',
                  }}
                >
                  <Chip
                    label={side.label}
                    sx={{
                      alignSelf: 'flex-start',
                      height: 28,
                      borderRadius: 999,
                      backgroundColor: side.side === 'front' ? '#0009DC' : '#AEF33E',
                      color: side.side === 'front' ? '#fff' : '#33344A',
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  />
                  <ScrollableCardText>
                    <Typography
                      sx={{
                        mt: { xs: 2.5, md: 3 },
                        color: '#0B0B0B',
                        fontSize: side.side === 'back'
                          ? { xs: 26, md: 36 }
                          : { xs: 29, md: 41 },
                        fontWeight: side.side === 'back' ? 600 : 900,
                        letterSpacing: 0,
                        lineHeight: 1.1,
                        overflowWrap: 'anywhere',
                        wordBreak: 'break-word',
                      }}
                    >
                      {side.content}
                    </Typography>
                  </ScrollableCardText>
                </Stack>

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: 'center',
                    color: 'text.secondary',
                    flex: '0 0 auto',
                    pt: 2,
                  }}
                >
                  <VisibilityOutlinedIcon sx={{ fontSize: 18, color: '#80808E' }} />
                  <Typography sx={{ color: '#80808E', fontSize: 14, fontWeight: 600 }}>
                    {side.helper}
                  </Typography>
                </Stack>
              </Paper>
            ))}
          </Box>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <IconButton
              aria-label="Previous card"
              onClick={() => goToCard(currentIndex - 1)}
              disabled={currentIndex === 0}
              sx={{
                width: 48,
                height: 48,
                border: '1px solid rgba(0, 9, 220, 0.2)',
                backgroundColor: '#fff',
                color: '#33344A',
                '&:hover': { backgroundColor: '#F5F5FE' },
              }}
            >
              <ArrowBackOutlinedIcon />
            </IconButton>

            <Typography
              sx={{
                minWidth: 64,
                textAlign: 'center',
                color: '#0B0B0B',
                fontFamily: '"Barlow Semi Condensed", Inter, Arial, sans-serif',
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: 0,
              }}
            >
              {currentIndex + 1} <Box component="span" sx={{ color: '#80808E', fontWeight: 600 }}>/ {cards.length}</Box>
            </Typography>

            <IconButton
              aria-label="Next card"
              onClick={() => goToCard(currentIndex + 1)}
              disabled={currentIndex === cards.length - 1}
              sx={{
                width: 48,
                height: 48,
                backgroundColor: '#0009DC',
                color: '#fff',
                '&:hover': { backgroundColor: '#0007B8' },
                '&.Mui-disabled': {
                  backgroundColor: '#F2F1F3',
                  color: '#80808E',
                },
              }}
            >
              <ArrowForwardOutlinedIcon />
            </IconButton>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button
              startIcon={<RestartAltOutlinedIcon />}
              onClick={handleRestart}
              variant="outlined"
              color="inherit"
              sx={{
                borderRadius: 999,
                borderColor: 'rgba(0, 9, 220, 0.2)',
                color: '#0009DC',
                px: 2.75,
                py: 1.5,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                '&:hover': {
                  borderColor: 'rgba(0, 9, 220, 0.34)',
                  backgroundColor: '#F5F5FE',
                },
              }}
            >
              Restart
            </Button>
            <Button
              startIcon={<CheckCircleOutlineOutlinedIcon />}
              onClick={isCompleted ? handleMarkIncomplete : handleComplete}
              variant={isCompleted ? 'outlined' : 'contained'}
              color={isCompleted ? 'success' : 'primary'}
              disabled={(!isCompleted && !allCardsSeen) || isSaving}
              sx={{
                minWidth: { xs: '100%', sm: 230 },
                borderRadius: 999,
                boxShadow: 'none',
                backgroundColor: isCompleted ? '#fff' : '#229E5A',
                borderColor: isCompleted ? '#229E5A' : 'transparent',
                color: isCompleted ? '#229E5A' : '#fff',
                px: 2.75,
                py: 1.5,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                '&:hover': {
                  boxShadow: 'none',
                  backgroundColor: isCompleted ? 'rgba(34, 158, 90, 0.08)' : '#1D874C',
                },
              }}
            >
              {isSaving
                ? 'Saving...'
                : isCompleted
                  ? 'Mark as incomplete'
                  : allCardsSeen
                    ? 'Mark complete'
                    : 'Reveal all cards first'}
            </Button>
          </Stack>
        </Stack>
      </Stack>

      <Snackbar
        open={toast.open}
        autoHideDuration={3200}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
}
