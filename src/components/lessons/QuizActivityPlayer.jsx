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

export default function QuizActivityPlayer({
  lesson,
  activity,
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

  useEffect(() => {
    setAttemptQuestions(buildAttemptQuestions(questions));
    setAnswers(savedResults
      ? savedResults.map((result) => result.selectedAnswer || '')
      : questions.map(() => '')
    );
    setResults(savedResults);
    setScore(activity.progress?.score ?? null);
  }, [activity.id, activity.progress?.score, questions, savedResults]);

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
            p: { xs: 2, md: 3 },
            borderRadius: 4,
            border: '1px solid rgba(15, 23, 42, 0.08)',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(240,253,250,0.96) 100%)',
          }}
        >
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
              sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
            >
              <Stack spacing={0.75}>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  <Chip icon={<QuizOutlinedIcon />} label="Quiz" color="primary" sx={{ fontWeight: 800 }} />
                  <Chip
                    label={isSubmitted ? `${score}% score` : `${answeredCount}/${questions.length} answered`}
                    color={isPassed ? 'success' : 'default'}
                    variant={isPassed ? 'filled' : 'outlined'}
                    sx={{ backgroundColor: isPassed ? undefined : '#fff', fontWeight: 700 }}
                  />
                  <Chip
                    label={`${PASSING_SCORE}% to pass`}
                    variant="outlined"
                    sx={{ backgroundColor: '#fff', fontWeight: 700 }}
                  />
                </Stack>

                <Typography variant="h3" component="h1" sx={{ fontWeight: 950, lineHeight: 1 }}>
                  {activity.title || 'Lesson quiz'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  From lesson: {lesson.title}
                </Typography>
              </Stack>

              <Button
                component={Link}
                href={`/lessons/${lesson.id}`}
                startIcon={<ArrowBackOutlinedIcon />}
                variant="outlined"
                color="inherit"
                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
              >
                Back to lesson
              </Button>
            </Stack>

            <Box>
              <LinearProgress
                variant="determinate"
                value={isSubmitted ? Number(score || 0) : progressValue}
                color={isSubmitted && !isPassed ? 'warning' : 'primary'}
                sx={{
                  height: 10,
                  borderRadius: 999,
                  backgroundColor: '#e5e7eb',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 999,
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                {isSubmitted
                  ? isPassed
                    ? 'Passed'
                    : 'Not passed yet'
                  : `${progressValue}% answered`}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {isSubmitted && (
          <Alert severity={isPassed ? 'success' : 'warning'} sx={{ borderRadius: 3 }}>
            {isPassed
              ? `You scored ${score}%. This quiz is passed.`
              : `You scored ${score}%. You need at least ${PASSING_SCORE}% to pass.`}
          </Alert>
        )}

        <Stack spacing={2}>
          {attemptQuestions.map((question, questionIndex) => {
            const result = results?.[questionIndex] || null;
            const selectedAnswer = result?.selectedAnswer || answers[questionIndex] || '';

            return (
              <Paper
                key={`${question.question}-${questionIndex}`}
                elevation={0}
                sx={{
                  p: { xs: 2, md: 3 },
                  borderRadius: 3,
                  border: '1px solid rgba(15, 23, 42, 0.1)',
                  backgroundColor: '#fff',
                }}
              >
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                    <Chip label={questionIndex + 1} color="primary" sx={{ fontWeight: 900 }} />
                    <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.25 }}>
                      {question.question}
                    </Typography>
                  </Stack>

                  <Stack spacing={1}>
                    {(question.options || []).map((option) => {
                      const isSelected = selectedAnswer === option;
                      const isCorrectOption = result?.correctAnswer === option;
                      const isWrongSelection = isSubmitted && isSelected && !isCorrectOption;
                      const optionColor = isCorrectOption
                        ? '#dcfce7'
                        : isWrongSelection
                          ? '#fee2e2'
                          : isSelected
                            ? '#eff6ff'
                            : '#f8fafc';

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
                            gap: 1,
                            p: 1.25,
                            borderRadius: 2,
                            border: isCorrectOption
                              ? '1px solid #16a34a'
                              : isWrongSelection
                                ? '1px solid #dc2626'
                                : isSelected
                                  ? '1px solid #0009DC'
                                  : '1px solid #e5e7eb',
                            backgroundColor: optionColor,
                            color: '#0f172a',
                            textAlign: 'left',
                            cursor: isSubmitted ? 'default' : 'pointer',
                          }}
                        >
                          <Radio
                            checked={isSelected}
                            disabled={isSubmitted}
                            size="small"
                            sx={{ p: 0.5 }}
                          />
                          <Typography sx={{ flex: '1 1 auto', fontWeight: isSelected || isCorrectOption ? 800 : 600 }}>
                            {option}
                          </Typography>
                          {isCorrectOption && <CheckCircleOutlineOutlinedIcon color="success" />}
                          {isWrongSelection && <HighlightOffOutlinedIcon color="error" />}
                        </Box>
                      );
                    })}
                  </Stack>

                  {isSubmitted && (
                    <Alert severity={result?.isCorrect ? 'success' : 'error'} sx={{ borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.5 }}>
                        {result?.isCorrect ? 'Correct' : 'Incorrect'}
                      </Typography>
                      <Typography variant="body2">
                        {result?.explanation || 'No explanation was provided for this question.'}
                      </Typography>
                    </Alert>
                  )}
                </Stack>
              </Paper>
            );
          })}
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ justifyContent: 'flex-end' }}>
          {isSubmitted && (
            <Button
              startIcon={<RestartAltOutlinedIcon />}
              onClick={handleRetry}
              variant="outlined"
              color="inherit"
              disabled={isSaving}
              sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
            >
              Try again
            </Button>
          )}
          {!isSubmitted && (
            <Button
              startIcon={<CheckCircleOutlineOutlinedIcon />}
              onClick={handleSubmit}
              variant="contained"
              disabled={!canSubmit}
              sx={{
                minWidth: { xs: '100%', sm: 220 },
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 900,
              }}
            >
              {isSaving
                ? 'Submitting...'
                : canSubmit
                  ? 'Submit quiz'
                  : 'Answer all questions'}
            </Button>
          )}
        </Stack>
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
