'use client';

import { useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import LessonsGrid from './LessonsGrid';
import EmptyState from '../ui/EmptyState';

export default function MyLessonsClient({ initialLessons = [] }) {
  const [lessons, setLessons] = useState(initialLessons);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

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
        <LessonsGrid
          lessons={lessons}
          getLessonHref={(lesson) => `/lessons/${lesson.id}`}
          showUnenrollAction
          onUnenrollLesson={handleUnenrollLesson}
        />
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
