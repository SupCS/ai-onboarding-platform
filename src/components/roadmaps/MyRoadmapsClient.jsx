'use client';

import { useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import EmptyState from '../ui/EmptyState';
import RoadmapsGrid from './RoadmapsGrid';

export default function MyRoadmapsClient({ initialRoadmaps = [] }) {
  const [roadmaps, setRoadmaps] = useState(initialRoadmaps);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleUnenrollRoadmap = async (roadmap) => {
    setRoadmaps((prev) => prev.filter((item) => item.id !== roadmap.id));

    try {
      const response = await fetch(`/api/roadmaps/${roadmap.id}/enrollment`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove roadmap.');
      }

      setToast({
        open: true,
        message: 'Roadmap removed from your learning plan.',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to remove roadmap:', error);

      setRoadmaps((prev) =>
        [...prev, roadmap].sort((a, b) => {
          return new Date(b.enrolledAt || b.createdAt) - new Date(a.enrolledAt || a.createdAt);
        })
      );

      setToast({
        open: true,
        message: error.message || 'Failed to remove roadmap.',
        severity: 'error',
      });
    }
  };

  return (
    <>
      {roadmaps.length === 0 ? (
        <EmptyState
          title="No roadmaps added yet"
          description="Open the Roadmaps tab in Library and subscribe to a roadmap."
        />
      ) : (
        <RoadmapsGrid
          roadmaps={roadmaps}
          onUnenrollRoadmap={handleUnenrollRoadmap}
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
