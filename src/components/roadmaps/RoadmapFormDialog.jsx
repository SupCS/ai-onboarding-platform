'use client';

import { useMemo, useState } from 'react';
import {
  Autocomplete,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

function buildInitialForm() {
  return {
    title: '',
    description: '',
    selectedLessons: [],
  };
}

export default function RoadmapFormDialog({
  open,
  lessons = [],
  isSaving = false,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(buildInitialForm);
  const [errors, setErrors] = useState({});
  const readyLessons = useMemo(() => {
    return lessons.filter((lesson) => lesson.status === 'ready');
  }, [lessons]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
    setErrors((prev) => ({
      ...prev,
      [field]: '',
    }));
  };

  const handleLessonsChange = (_event, selectedLessons) => {
    setForm((prev) => ({
      ...prev,
      selectedLessons,
    }));
    setErrors((prev) => ({
      ...prev,
      selectedLessons: '',
    }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = 'Title is required.';
    }

    if (form.selectedLessons.length === 0) {
      nextErrors.selectedLessons = 'Select at least one lesson.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      lessonIds: form.selectedLessons.map((lesson) => lesson.id),
    });
  };

  const handleDialogClose = (...args) => {
    if (isSaving) {
      return;
    }

    onClose(...args);
  };

  const handleExited = () => {
    setForm(buildInitialForm());
    setErrors({});
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        transition: {
          onExited: handleExited,
        },
      }}
    >
      <DialogTitle>Create Roadmap</DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="Title"
            fullWidth
            value={form.title}
            onChange={handleChange('title')}
            error={Boolean(errors.title)}
            helperText={errors.title}
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={3}
            value={form.description}
            onChange={handleChange('description')}
            placeholder="Describe what this roadmap helps people learn."
          />

          <Autocomplete
            multiple
            options={readyLessons}
            value={form.selectedLessons}
            onChange={handleLessonsChange}
            getOptionLabel={(lesson) => lesson.title}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText="No ready lessons available"
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });

                return (
                  <Chip
                    key={key}
                    label={option.title}
                    {...tagProps}
                  />
                );
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Lessons"
                placeholder="Select lessons"
                error={Boolean(errors.selectedLessons)}
                helperText={
                  errors.selectedLessons ||
                  'Choose lessons in the order they should appear in the roadmap.'
                }
              />
            )}
          />

          {readyLessons.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Create at least one ready lesson before building a roadmap.
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleDialogClose} color="inherit" disabled={isSaving}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSaving || readyLessons.length === 0}
        >
          {isSaving ? 'Creating...' : 'Create Roadmap'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
