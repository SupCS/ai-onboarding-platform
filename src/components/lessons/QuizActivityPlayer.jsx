'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Radio,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import ConfettiBurst from '../roadmaps/ConfettiBurst';
import RoadmapCompletionCelebration from '../roadmaps/RoadmapCompletionCelebration';

const PASSING_SCORE = 80;
const QUIZ_COLORS = {
  ink: '#0B0B0B',
  slate: '#33344A',
  mute: '#80808E',
  blue: '#0009DC',
  blue50: '#F5F5FE',
  blue100: '#E5E5FA',
  blue200: '#C7C7F0',
  bg2: '#FAFAFB',
  lime: '#AEF33E',
  orange: '#FF642D',
  success: 'rgb(34,158,90)',
  danger: 'rgb(214,47,47)',
};

function getQuestions(activity) {
  return Array.isArray(activity?.payload?.items) ? activity.payload.items : [];
}

function getSavedResults(activity) {
  const metadataResults = activity?.progress?.metadata?.results;

  return Array.isArray(metadataResults) ? metadataResults : null;
}

function shuffleItems(items) {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[randomIndex]] = [shuffledItems[randomIndex], shuffledItems[index]];
  }

  return shuffledItems;
}

function buildAttemptQuestions(questions) {
  return questions.map((question) => ({
    ...question,
    options: shuffleItems(Array.isArray(question.options) ? question.options : []),
  }));
}

function buildInitialQuestions(questions) {
  return questions.map((question) => ({
    ...question,
    options: Array.isArray(question.options) ? question.options : [],
  }));
}

function formatAttemptDate(value) {
  if (!value) {
    return 'Just now';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getOptionState({ isSelected, isSubmitted, isCorrectOption, isWrongSelection }) {
  if (isSubmitted && isCorrectOption) {
    return 'correct';
  }

  if (isSubmitted && isWrongSelection) {
    return 'incorrect';
  }

  if (isSelected) {
    return 'selected';
  }

  return 'idle';
}

function getOptionPalette(state) {
  const palettes = {
    idle: {
      bg: '#fff',
      border: QUIZ_COLORS.blue100,
      dotBorder: '#9999E0',
      dotInner: 'transparent',
    },
    selected: {
      bg: QUIZ_COLORS.blue50,
      border: QUIZ_COLORS.blue,
      dotBorder: QUIZ_COLORS.blue,
      dotInner: QUIZ_COLORS.blue,
    },
    correct: {
      bg: 'rgba(34,158,90,0.06)',
      border: QUIZ_COLORS.success,
      dotBorder: QUIZ_COLORS.success,
      dotInner: QUIZ_COLORS.success,
    },
    incorrect: {
      bg: 'rgba(214,47,47,0.05)',
      border: QUIZ_COLORS.danger,
      dotBorder: QUIZ_COLORS.danger,
      dotInner: QUIZ_COLORS.danger,
    },
  };

  return palettes[state] || palettes.idle;
}

function isActivityComplete(activity) {
  if (activity.type === 'quiz') {
    return Boolean(activity.progress?.completedAt) && Number(activity.progress?.score || 0) >= PASSING_SCORE;
  }

  return Boolean(activity.progress?.completedAt);
}

function getContinuePathHref(lesson, currentActivityId) {
  const activities = Array.isArray(lesson.activities) ? lesson.activities : [];
  const currentIndex = activities.findIndex((item) => item.id === currentActivityId);
  const followingActivities = currentIndex >= 0 ? activities.slice(currentIndex + 1) : activities;
  const nextIncompleteActivity = followingActivities.find((item) => !isActivityComplete(item));

  if (nextIncompleteActivity) {
    return `/lessons/${lesson.id}/activities/${nextIncompleteActivity.id}`;
  }

  return `/lessons/${lesson.id}`;
}

export default function QuizActivityPlayer({
  lesson,
  activity,
  initialAttempts = [],
}) {
  const router = useRouter();
  const questions = useMemo(() => getQuestions(activity), [activity]);
  const savedResults = useMemo(() => getSavedResults(activity), [activity]);
  const [attemptQuestions, setAttemptQuestions] = useState(() => buildInitialQuestions(questions));
  const [answers, setAnswers] = useState(() =>
    savedResults
      ? savedResults.map((result) => result.selectedAnswer || '')
      : questions.map(() => '')
  );
  const [results, setResults] = useState(savedResults);
  const [score, setScore] = useState(activity.progress?.score ?? null);
  const [attempts, setAttempts] = useState(initialAttempts);
  const [lessonActivities, setLessonActivities] = useState(() =>
    Array.isArray(lesson.activities) ? lesson.activities : []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isConfettiActive, setIsConfettiActive] = useState(false);
  const [completedRoadmapsCelebration, setCompletedRoadmapsCelebration] = useState([]);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const answeredCount = answers.filter(Boolean).length;
  const progressValue = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const isSubmitted = Array.isArray(results);
  const isPassed = isSubmitted && Number(score || 0) >= PASSING_SCORE;
  const canSubmit = questions.length > 0 && answeredCount === questions.length && !isSaving;
  const continuePathHref = getContinuePathHref(
    {
      ...lesson,
      activities: lessonActivities,
    },
    activity.id
  );

  useEffect(() => {
    setAttemptQuestions(buildAttemptQuestions(questions));
    setAnswers(savedResults
      ? savedResults.map((result) => result.selectedAnswer || '')
      : questions.map(() => '')
    );
    setResults(savedResults);
    setScore(activity.progress?.score ?? null);
    setAttempts(initialAttempts);
    setLessonActivities(Array.isArray(lesson.activities) ? lesson.activities : []);
  }, [activity.id, activity.progress?.score, initialAttempts, lesson.activities, questions, savedResults]);

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

  const handleAnswerChange = (questionIndex, option) => {
    if (isSubmitted) {
      return;
    }

    setAnswers((current) => current.map((answer, index) => (
      index === questionIndex ? option : answer
    )));
  };

  const handleSubmit = async () => {
    try {
      setIsSaving(true);

      const response = await fetch(`/api/lessons/${lesson.id}/activities/${activity.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'quiz',
          answers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save quiz progress.');
      }

      const nextScore = data.attempt?.score ?? data.progress?.score ?? 0;
      const nextResults = data.attempt?.results || data.progress?.metadata?.results || [];

      setScore(nextScore);
      setResults(nextResults);
      if (data.attempt?.id) {
        setAttempts((current) => [data.attempt, ...current]);
      }
      if (Array.isArray(data.activities)) {
        setLessonActivities(data.activities);
      }
      router.refresh();

      if (nextScore >= PASSING_SCORE) {
        setIsConfettiActive(false);
        window.setTimeout(() => setIsConfettiActive(true), 20);
      }

      if (data.completedRoadmaps?.length) {
        setCompletedRoadmapsCelebration(data.completedRoadmaps);
      }

      setToast({
        open: true,
        message: nextScore >= PASSING_SCORE
          ? data.lessonCompleted
            ? 'Quiz passed. Lesson marked as completed.'
            : 'Quiz passed.'
          : 'Quiz finished. Score at least 80% to pass.',
        severity: nextScore >= PASSING_SCORE ? 'success' : 'warning',
      });
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      setToast({
        open: true,
        message: error.message || 'Failed to submit quiz.',
        severity: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetry = async () => {
    try {
      setIsSaving(true);

      const response = await fetch(`/api/lessons/${lesson.id}/activities/${activity.id}/progress`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset quiz progress.');
      }

      setAttemptQuestions(buildAttemptQuestions(questions));
      setAnswers(questions.map(() => ''));
      setResults(null);
      setScore(null);
      router.refresh();
    } catch (error) {
      console.error('Failed to reset quiz:', error);
      setToast({
        open: true,
        message: error.message || 'Failed to reset quiz.',
        severity: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (questions.length === 0) {
    return (
      <Alert severity="warning">
        This quiz activity has no questions.
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
            p: { xs: '24px', md: '32px' },
            mb: 0.5,
            borderRadius: '20px',
            border: `1px solid ${QUIZ_COLORS.blue100}`,
            background: `linear-gradient(135deg, #fff 0%, ${QUIZ_COLORS.blue50} 100%)`,
          }}
        >
          <Stack sx={{ gap: '24px' }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              sx={{
                alignItems: { xs: 'stretch', md: 'flex-start' },
                justifyContent: 'space-between',
                gap: '24px',
              }}
            >
              <Box>
                <Stack
                  direction="row"
                  useFlexGap
                  sx={{
                    alignItems: 'center',
                    gap: '10px',
                    flexWrap: 'wrap',
                    mb: '16px',
                  }}
                >
                  <Chip
                    icon={<QuizOutlinedIcon />}
                    label="Quiz"
                    sx={{
                      height: 30,
                      borderRadius: 999,
                      backgroundColor: QUIZ_COLORS.blue,
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      '& .MuiChip-icon': {
                        color: 'inherit',
                        fontSize: 15,
                      },
                    }}
                  />
                  <Chip
                    label={`${questions.length} question${questions.length === 1 ? '' : 's'}`}
                    sx={{
                      height: 30,
                      borderRadius: 999,
                      border: `1px solid ${QUIZ_COLORS.blue100}`,
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      color: QUIZ_COLORS.slate,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  />
                  <Chip
                    label={`${PASSING_SCORE}% to pass`}
                    sx={{
                      height: 30,
                      borderRadius: 999,
                      border: `1px solid ${QUIZ_COLORS.blue100}`,
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      color: QUIZ_COLORS.slate,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  />
                  {isSubmitted && (
                    <Chip
                      label={`${isPassed ? 'Passed' : 'Not passed'} - ${score}%`}
                      sx={{
                        height: 30,
                        borderRadius: 999,
                        backgroundColor: isPassed ? QUIZ_COLORS.success : QUIZ_COLORS.orange,
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    />
                  )}
                </Stack>

                <Typography
                  component="h1"
                  sx={{
                    color: QUIZ_COLORS.ink,
                    fontFamily: '"Barlow Semi Condensed", Inter, Arial, sans-serif',
                    fontSize: { xs: 42, md: 56 },
                    fontWeight: 900,
                    letterSpacing: 0,
                    lineHeight: 0.95,
                  }}
                >
                  {activity.title || 'Lesson quiz'}
                </Typography>
                <Typography sx={{ color: QUIZ_COLORS.mute, fontSize: 14 }}>
                  From lesson - {lesson.title}
                </Typography>
              </Box>

              <Button
                component={Link}
                href={`/lessons/${lesson.id}`}
                startIcon={<ArrowBackOutlinedIcon />}
                variant="outlined"
                color="inherit"
                sx={{
                  borderRadius: 999,
                  borderColor: QUIZ_COLORS.blue200,
                  color: QUIZ_COLORS.blue,
                  px: 2.5,
                  py: 1.35,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  '&:hover': {
                    borderColor: QUIZ_COLORS.blue,
                    backgroundColor: QUIZ_COLORS.blue50,
                  },
                }}
              >
                Back to lesson
              </Button>
            </Stack>

            <Box sx={{ mb: '8px' }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Typography
                  sx={{
                    color: isSubmitted && isPassed ? QUIZ_COLORS.success : QUIZ_COLORS.blue,
                    fontFamily: '"Barlow Semi Condensed", Inter, Arial, sans-serif',
                    fontSize: 36,
                    fontWeight: 900,
                    lineHeight: 1,
                  }}
                >
                  {isSubmitted
                    ? `${Math.round((Number(score || 0) / 100) * questions.length)}/${questions.length}`
                    : `${answeredCount}/${questions.length}`}
                </Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <LinearProgress
                    variant="determinate"
                    value={isSubmitted ? Number(score || 0) : progressValue}
                    sx={{
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: 'rgba(0,9,220,0.08)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 999,
                        backgroundColor: isSubmitted && isPassed
                          ? QUIZ_COLORS.success
                          : isSubmitted
                            ? QUIZ_COLORS.orange
                            : QUIZ_COLORS.blue,
                      },
                    }}
                  />
                  <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 0.75 }}>
                    <Typography sx={{ color: QUIZ_COLORS.mute, fontSize: 12 }}>
                      {isSubmitted
                        ? isPassed
                          ? 'Quiz passed'
                          : 'Try again to reach the passing score'
                        : 'Answer all questions to submit'}
                    </Typography>
                    <Typography sx={{ color: QUIZ_COLORS.mute, fontSize: 12 }}>
                      {PASSING_SCORE}% to pass
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Paper>

        <Stack spacing={2}>
          {attemptQuestions.map((question, questionIndex) => {
            const result = results?.[questionIndex] || null;
            const selectedAnswer = result?.selectedAnswer || answers[questionIndex] || '';

            return (
              <Paper
                key={`${question.question}-${questionIndex}`}
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: '28px' },
                  borderRadius: '16px',
                  border: `1px solid ${QUIZ_COLORS.blue100}`,
                  backgroundColor: '#fff',
                  overflow: 'hidden',
                }}
              >
                <Stack spacing="18px">
                  <Stack direction="row" sx={{ alignItems: 'flex-start', gap: '14px' }}>
                    <Box
                      sx={{
                        flexShrink: 0,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: QUIZ_COLORS.blue,
                        color: '#fff',
                        display: 'grid',
                        placeItems: 'center',
                        fontFamily: '"Barlow Semi Condensed", Inter, Arial, sans-serif',
                        fontWeight: 800,
                        fontSize: 14,
                      }}
                    >
                      {questionIndex + 1}
                    </Box>
                    <Typography
                      component="h3"
                      sx={{
                        color: QUIZ_COLORS.ink,
                        fontSize: 18,
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                        lineHeight: 1.4,
                      }}
                    >
                      {question.question}
                    </Typography>
                  </Stack>

                  <Stack sx={{ gap: '10px' }}>
                    {(question.options || []).map((option) => {
                      const isSelected = selectedAnswer === option;
                      const isCorrectOption = result?.correctAnswer === option;
                      const isWrongSelection = isSubmitted && isSelected && !isCorrectOption;
                      const optionState = getOptionState({
                        isSelected,
                        isSubmitted,
                        isCorrectOption,
                        isWrongSelection,
                      });
                      const optionPalette = getOptionPalette(optionState);

                      return (
                        <Box
                          key={option}
                          component="button"
                          type="button"
                          onClick={() => handleAnswerChange(questionIndex, option)}
                          sx={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            px: '20px',
                            py: '16px',
                            borderRadius: 999,
                            border: `1.5px solid ${optionPalette.border}`,
                            backgroundColor: optionPalette.bg,
                            color: QUIZ_COLORS.ink,
                            textAlign: 'left',
                            cursor: isSubmitted ? 'default' : 'pointer',
                            transition: 'border-color 120ms ease, background-color 120ms ease',
                            '&:hover': !isSubmitted
                              ? {
                                  borderColor: isSelected ? QUIZ_COLORS.blue : QUIZ_COLORS.blue200,
                                  backgroundColor: isSelected ? QUIZ_COLORS.blue50 : QUIZ_COLORS.bg2,
                                }
                              : undefined,
                          }}
                        >
                          <Radio
                            checked={isSelected}
                            disabled={isSubmitted}
                            size="small"
                            sx={{
                              p: 0.5,
                              flexShrink: 0,
                              color: optionPalette.dotBorder,
                              '&.Mui-checked': {
                                color: optionPalette.dotInner || QUIZ_COLORS.blue,
                              },
                            }}
                          />
                          <Typography
                            sx={{
                              flex: '1 1 auto',
                              minWidth: 0,
                              fontSize: 15,
                              fontWeight: 600,
                              letterSpacing: '-0.01em',
                              lineHeight: 1.35,
                            }}
                          >
                            {option}
                          </Typography>
                          {isCorrectOption && (
                            <CheckCircleOutlineOutlinedIcon
                              sx={{
                                color: QUIZ_COLORS.success,
                                fontSize: 24,
                                flexShrink: 0,
                              }}
                            />
                          )}
                          {isWrongSelection && (
                            <HighlightOffOutlinedIcon
                              sx={{
                                color: QUIZ_COLORS.danger,
                                fontSize: 24,
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </Box>
                      );
                    })}
                  </Stack>

                  {isSubmitted && (
                    <Alert
                      severity={result?.isCorrect ? 'success' : 'error'}
                      sx={{
                        mt: 0.75,
                        px: '18px',
                        py: '14px',
                        borderRadius: '12px',
                        border: result?.isCorrect
                          ? '1px solid rgba(34,158,90,0.2)'
                          : '1px solid rgba(214,47,47,0.18)',
                        backgroundColor: result?.isCorrect
                          ? 'rgba(34,158,90,0.07)'
                          : 'rgba(214,47,47,0.05)',
                        '& .MuiAlert-icon': {
                          color: result?.isCorrect ? QUIZ_COLORS.success : QUIZ_COLORS.danger,
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 700,
                          letterSpacing: '0.02em',
                          textTransform: 'uppercase',
                          mb: 0.75,
                        }}
                      >
                        {result?.isCorrect ? 'Correct' : 'Incorrect'}
                      </Typography>
                      <Typography sx={{ fontSize: 14, lineHeight: 1.55, fontWeight: 500 }}>
                        {result?.explanation || 'No explanation was provided for this question.'}
                      </Typography>
                    </Alert>
                  )}
                </Stack>
              </Paper>
            );
          })}
        </Stack>

        {!isSubmitted && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ justifyContent: 'flex-end' }}>
            <Button
              startIcon={<CheckCircleOutlineOutlinedIcon />}
              onClick={handleSubmit}
              variant="contained"
              disabled={!canSubmit}
              sx={{
                minWidth: { xs: '100%', sm: 220 },
                borderRadius: 999,
                backgroundColor: QUIZ_COLORS.blue,
                boxShadow: 'none',
                px: 2.75,
                py: 1.35,
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
              {isSaving
                ? 'Submitting...'
                : canSubmit
                  ? 'Submit quiz'
                  : 'Answer all questions'}
            </Button>
          </Stack>
        )}

        {isSubmitted && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2,
              mt: 1,
              alignItems: 'start',
            }}
          >
            <Box
              sx={{
                backgroundColor: QUIZ_COLORS.blue,
                color: '#fff',
                borderRadius: 4,
                p: 3.5,
                minHeight: 300,
              }}
            >
              <Typography
                sx={{
                  mb: 1.5,
                  opacity: 0.7,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Your score
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Barlow Semi Condensed", Inter, Arial, sans-serif',
                  fontSize: { xs: 78, md: 96 },
                  fontWeight: 900,
                  letterSpacing: 0,
                  lineHeight: 0.9,
                }}
              >
                {score ?? 0}
                <Box component="span" sx={{ fontSize: { xs: 38, md: 48 } }}>
                  %
                </Box>
              </Typography>
              <Typography sx={{ mt: 1.5, fontSize: 14, opacity: 0.85 }}>
                {results?.filter((result) => result.isCorrect).length || 0} of {questions.length} correct - {isPassed ? 'Passed' : 'Not passed'}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mt: 3 }}>
                <Button
                  component={isPassed ? Link : 'button'}
                  href={isPassed ? continuePathHref : undefined}
                  disabled={!isPassed}
                  sx={{
                    borderRadius: 999,
                    backgroundColor: QUIZ_COLORS.lime,
                    color: QUIZ_COLORS.slate,
                    px: 2.5,
                    py: 1.35,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    '&:hover': {
                      backgroundColor: QUIZ_COLORS.lime,
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'rgba(255,255,255,0.16)',
                      color: 'rgba(255,255,255,0.48)',
                    },
                  }}
                >
                  Continue path
                </Button>
                <Button
                  startIcon={<RestartAltOutlinedIcon />}
                  onClick={handleRetry}
                  disabled={isSaving}
                  sx={{
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#fff',
                    px: 2.5,
                    py: 1.35,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.45)',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                    },
                  }}
                >
                  Try again
                </Button>
              </Stack>
            </Box>

            <Box
              sx={{
                backgroundColor: '#fff',
                border: `1px solid ${QUIZ_COLORS.blue100}`,
                borderRadius: 4,
                p: 3.5,
                height: { xs: 'auto', md: 300 },
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              <Typography
                sx={{
                  color: QUIZ_COLORS.ink,
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  mb: 0.5,
                }}
              >
                Attempt history
              </Typography>
              <Typography sx={{ color: QUIZ_COLORS.mute, fontSize: 13, mb: 2 }}>
                Every submitted attempt is saved.
              </Typography>
              <Stack
                spacing={1}
                sx={{
                  flex: '1 1 auto',
                  overflowY: 'auto',
                  pr: 0.5,
                  minHeight: 0,
                  scrollbarWidth: 'thin',
                  scrollbarColor: `${QUIZ_COLORS.blue200} transparent`,
                  '&::-webkit-scrollbar': {
                    width: 6,
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: QUIZ_COLORS.blue200,
                    borderRadius: 999,
                  },
                }}
              >
                {attempts.map((attempt) => (
                  <Box
                    key={attempt.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr auto auto' },
                      gap: 1,
                      alignItems: 'center',
                      px: 1.75,
                      py: 1.5,
                      borderRadius: 2.5,
                      backgroundColor: attempt.passed ? 'rgba(34,158,90,0.06)' : QUIZ_COLORS.bg2,
                      border: attempt.passed ? '1px solid rgba(34,158,90,0.18)' : `1px solid ${QUIZ_COLORS.blue100}`,
                    }}
                  >
                    <Box>
                      <Typography sx={{ color: QUIZ_COLORS.ink, fontSize: 13, fontWeight: 700 }}>
                        Attempt {attempt.attemptNumber}
                      </Typography>
                      <Typography sx={{ color: QUIZ_COLORS.mute, fontSize: 11 }}>
                        {formatAttemptDate(attempt.createdAt)}
                      </Typography>
                    </Box>

                    <Chip
                      label={`${attempt.score ?? 0}%`}
                      sx={{
                        borderRadius: 999,
                        backgroundColor: attempt.passed ? QUIZ_COLORS.success : QUIZ_COLORS.orange,
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    />
                    <Chip
                      label={`${attempt.correctCount}/${attempt.totalCount} correct`}
                      sx={{
                        borderRadius: 999,
                        border: `1px solid ${QUIZ_COLORS.blue100}`,
                        backgroundColor: '#fff',
                        color: QUIZ_COLORS.mute,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                ))}
                {attempts.length === 0 && (
                  <Box
                    sx={{
                      px: 1.75,
                      py: 1.5,
                      borderRadius: 2.5,
                      backgroundColor: QUIZ_COLORS.bg2,
                      border: `1px solid ${QUIZ_COLORS.blue100}`,
                    }}
                  >
                    <Typography sx={{ color: QUIZ_COLORS.mute, fontSize: 13 }}>
                      This submitted attempt is being saved.
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          </Box>
        )}
      </Stack>

      <Snackbar
        open={toast.open}
        autoHideDuration={3600}
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
