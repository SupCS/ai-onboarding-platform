'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Snackbar } from '@mui/material';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import RadioButtonUncheckedOutlinedIcon from '@mui/icons-material/RadioButtonUncheckedOutlined';

export default function LessonCompletionButton({
  lessonId,
  initialIsCompleted = false,
}) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleToggleCompletion = async () => {
    const nextIsCompleted = !isCompleted;

    setIsSaving(true);
    setIsCompleted(nextIsCompleted);

    try {
      const response = await fetch(`/api/lessons/${lessonId}/enrollment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: nextIsCompleted }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update lesson progress.');
      }

      setIsCompleted(Boolean(data.enrollment?.isCompleted));
      router.refresh();
      setToast({
        open: true,
        message: nextIsCompleted
          ? 'Lesson marked as completed.'
          : 'Lesson marked as not completed.',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to update lesson progress:', error);
      setIsCompleted(!nextIsCompleted);
      setToast({
        open: true,
        message: error.message || 'Failed to update lesson progress.',
        severity: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 5, md: 7 } }}>
        <Button
          variant={isCompleted ? 'outlined' : 'contained'}
          color={isCompleted ? 'success' : 'primary'}
          size="large"
          startIcon={
            isCompleted ? (
              <CheckCircleOutlineOutlinedIcon />
            ) : (
              <RadioButtonUncheckedOutlinedIcon />
            )
          }
          disabled={isSaving}
          onClick={handleToggleCompletion}
          sx={{
            minWidth: { xs: '100%', sm: 260 },
            minHeight: 58,
            borderRadius: 999,
            textTransform: 'none',
            fontSize: 18,
            fontWeight: 900,
          }}
        >
          {isSaving
            ? 'Saving...'
            : isCompleted
              ? 'Completed'
              : 'Complete'}
        </Button>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
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
