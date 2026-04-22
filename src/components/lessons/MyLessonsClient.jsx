'use client';

import { useMemo, useState } from 'react';
import { Alert, Box, Snackbar, Stack, Typography } from '@mui/material';
import LessonsGrid from './LessonsGrid';
import EmptyState from '../ui/EmptyState';

export default function MyLessonsClient({ initialLessons = [] }) {
  const [lessons, setLessons] = useState(initialLessons);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const { completedLessons, incompleteLessons } = useMemo(() => {
    return lessons.reduce(
      (groups, lesson) => {
        if (lesson.isCompleted) {
          groups.completedLessons.push(lesson);
          return groups;
        }

        groups.incompleteLessons.push(lesson);
        return groups;
      },
      {
        completedLessons: [],
        incompleteLessons: [],
      }
    );
  }, [lessons]);

  const handleUnenrollLesson = async (lesson) => {
    setLessons((prev) => prev.filter((item) => item.id !== lesson.id));

    try {
      const response = await fetch(`/api/lessons/${lesson.id}/enrollment`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove lesson from My Lessons.');
      }

      setToast({
        open: true,
        message: 'Lesson removed from My Lessons.',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to remove lesson from My Lessons:', error);

      setLessons((prev) =>
        [...prev, lesson].sort((a, b) => {
          return new Date(b.enrolledAt || b.createdAt) - new Date(a.enrolledAt || a.createdAt);
        })
      );

      setToast({
        open: true,
        message: error.message || 'Failed to remove lesson from My Lessons.',
        severity: 'error',
      });
    }
  };

  return (
    <>
      {lessons.length === 0 ? (
        <EmptyState
          title="No lessons added yet"
          description="Open the Lessons tab in Library and click Add to My Lessons on any ready lesson."
        />
      ) : (
        <Stack spacing={4}>
          <Box>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{
                mb: 2,
                alignItems: { xs: 'flex-start', sm: 'baseline' },
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                Not completed
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {incompleteLessons.length} lesson{incompleteLessons.length === 1 ? '' : 's'}
              </Typography>
            </Stack>

            {incompleteLessons.length === 0 ? (
              <EmptyState
                title="All lessons completed"
                description="Completed lessons are collected below."
              />
            ) : (
              <LessonsGrid
                lessons={incompleteLessons}
                getLessonHref={(lesson) => `/lessons/${lesson.id}`}
                showUnenrollAction
                showProgressStatus
                onUnenrollLesson={handleUnenrollLesson}
              />
            )}
          </Box>

          <Box>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{
                mb: 2,
                alignItems: { xs: 'flex-start', sm: 'baseline' },
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                Completed
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {completedLessons.length} lesson{completedLessons.length === 1 ? '' : 's'}
              </Typography>
            </Stack>

            {completedLessons.length === 0 ? (
              <EmptyState
                title="No completed lessons yet"
                description="Open a lesson and click Complete at the end when you finish reading."
              />
            ) : (
              <LessonsGrid
                lessons={completedLessons}
                getLessonHref={(lesson) => `/lessons/${lesson.id}`}
                showUnenrollAction
                showProgressStatus
                onUnenrollLesson={handleUnenrollLesson}
              />
            )}
          </Box>
        </Stack>
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
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
