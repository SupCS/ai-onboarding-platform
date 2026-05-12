'use client';

import { useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowDownwardOutlinedIcon from '@mui/icons-material/ArrowDownwardOutlined';
import ArrowUpwardOutlinedIcon from '@mui/icons-material/ArrowUpwardOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { normalizeLessonTagInput, suggestedLessonTags } from '../../lib/lessonTags';

function buildInitialForm(initialRoadmap = null, lessons = []) {
  if (initialRoadmap) {
    const readyLessonsById = new Map(
      lessons
        .filter((lesson) => lesson.status === 'ready' && lesson.isPublished)
        .map((lesson) => [lesson.id, lesson])
    );

    return {
      title: initialRoadmap.title || '',
      description: initialRoadmap.description || '',
      tags: normalizeLessonTagInput(initialRoadmap.tags || []),
      selectedLessons: (initialRoadmap.lessonIds || [])
        .map((lessonId) => readyLessonsById.get(lessonId))
        .filter(Boolean),
    };
  }

  return {
    title: '',
    description: '',
    tags: [],
    selectedLessons: [],
  };
}

export default function RoadmapFormDialog({
  open,
  lessons = [],
  isSaving = false,
  isDeleting = false,
  mode = 'create',
  initialRoadmap = null,
  onClose,
  onSave,
  onDelete,
}) {
  const [form, setForm] = useState(() => buildInitialForm(initialRoadmap, lessons));
  const [errors, setErrors] = useState({});
  const [pendingLesson, setPendingLesson] = useState(null);
  const [pendingLessonInput, setPendingLessonInput] = useState('');
  const isEditMode = mode === 'edit';
  const readyLessons = useMemo(() => {
    return lessons.filter((lesson) => lesson.status === 'ready' && lesson.isPublished);
  }, [lessons]);
  const availableLessons = useMemo(() => {
    const selectedLessonIds = new Set(form.selectedLessons.map((lesson) => lesson.id));

    return readyLessons.filter((lesson) => !selectedLessonIds.has(lesson.id));
  }, [form.selectedLessons, readyLessons]);

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

  const handleTagsChange = (_event, nextTags) => {
    setForm((prev) => ({
      ...prev,
      tags: normalizeLessonTagInput(nextTags),
    }));
  };

  const handleAddLesson = (_event, selectedLesson) => {
    if (!selectedLesson) {
      setPendingLesson(null);
      return;
    }

    setForm((prev) => ({
      ...prev,
      selectedLessons: [...prev.selectedLessons, selectedLesson],
      tags: normalizeLessonTagInput([
        ...prev.tags,
        ...(Array.isArray(selectedLesson.tags) ? selectedLesson.tags : []),
      ]),
    }));
    setErrors((prev) => ({
      ...prev,
      selectedLessons: '',
    }));
    setPendingLesson(null);
    setPendingLessonInput('');
  };

  const moveSelectedLesson = (fromIndex, toIndex) => {
    setForm((prev) => {
      if (
        toIndex < 0 ||
        toIndex >= prev.selectedLessons.length ||
        fromIndex === toIndex
      ) {
        return prev;
      }

      const nextLessons = [...prev.selectedLessons];
      const [movedLesson] = nextLessons.splice(fromIndex, 1);
      nextLessons.splice(toIndex, 0, movedLesson);

      return {
        ...prev,
        selectedLessons: nextLessons,
      };
    });
  };

  const removeSelectedLesson = (lessonId) => {
    setForm((prev) => ({
      ...prev,
      selectedLessons: prev.selectedLessons.filter((lesson) => lesson.id !== lessonId),
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
      tags: form.tags,
      lessonIds: form.selectedLessons.map((lesson) => lesson.id),
    });
  };

  const handleDialogClose = (...args) => {
    if (isSaving || isDeleting) {
      return;
    }

    onClose(...args);
  };

  const handleExited = () => {
    setForm(buildInitialForm(initialRoadmap, lessons));
    setErrors({});
    setPendingLesson(null);
    setPendingLessonInput('');
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
      <DialogTitle>{isEditMode ? 'Edit Roadmap' : 'Create Roadmap'}</DialogTitle>

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
            freeSolo
            options={suggestedLessonTags}
            value={form.tags}
            onChange={handleTagsChange}
            renderValue={(value, getItemProps) =>
              value.map((tag, index) => {
                const { key, ...itemProps } = getItemProps({ index });

                return (
                  <Chip
                    key={key}
                    label={tag}
                    {...itemProps}
                  />
                );
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags"
                placeholder="Add tags"
                helperText="Roadmap tags merge with tags from added lessons."
              />
            )}
          />

          {form.selectedLessons.length > 0 && (
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>
                Lesson order
              </Typography>

              <Stack spacing={0.75}>
                {form.selectedLessons.map((lesson, index) => (
                  <Box
                    key={lesson.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '32px minmax(0, 1fr) auto',
                      gap: 1,
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 2,
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#fff',
                    }}
                  >
                    <Chip
                      label={index + 1}
                      size="small"
                      sx={{ fontWeight: 900 }}
                    />
                    <Typography variant="body2" noWrap sx={{ fontWeight: 750 }}>
                      {lesson.title}
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton
                        aria-label="Move lesson up"
                        size="small"
                        onClick={() => moveSelectedLesson(index, index - 1)}
                        disabled={index === 0 || isSaving || isDeleting}
                      >
                        <ArrowUpwardOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label="Move lesson down"
                        size="small"
                        onClick={() => moveSelectedLesson(index, index + 1)}
                        disabled={index === form.selectedLessons.length - 1 || isSaving || isDeleting}
                      >
                        <ArrowDownwardOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label="Remove lesson"
                        size="small"
                        color="error"
                        onClick={() => removeSelectedLesson(lesson.id)}
                        disabled={isSaving || isDeleting}
                      >
                        <DeleteOutlineOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Stack>
          )}

          <Autocomplete
            options={availableLessons}
            value={pendingLesson}
            inputValue={pendingLessonInput}
            onChange={handleAddLesson}
            onInputChange={(_event, nextValue) => setPendingLessonInput(nextValue)}
            getOptionLabel={(lesson) => lesson.title}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText="No more ready lessons available"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Add lesson"
                placeholder="Choose a lesson to append"
                error={Boolean(errors.selectedLessons)}
                helperText={
                  errors.selectedLessons ||
                  'Selected lessons are added to the end of the roadmap.'
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
        {isEditMode && (
          <Button
            onClick={() => onDelete?.(initialRoadmap)}
            color="error"
            disabled={isSaving || isDeleting}
            sx={{
              mr: 'auto',
              textTransform: 'none',
              fontWeight: 800,
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Roadmap'}
          </Button>
        )}

        <Button onClick={handleDialogClose} color="inherit" disabled={isSaving || isDeleting}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSaving || isDeleting || readyLessons.length === 0}
        >
          {isSaving
            ? isEditMode ? 'Saving...' : 'Creating...'
            : isEditMode ? 'Save Roadmap' : 'Create Roadmap'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
