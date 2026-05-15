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
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { normalizeLessonTagInput, suggestedLessonTags } from '../../lib/lessonTags';

const FORM_COLORS = {
  blue: '#0009DC',
  ink: '#0B0B0B',
  slate: '#33344A',
  mute: '#80808E',
  blue50: '#F5F5FE',
  blue100: '#E3E5FF',
  blue200: '#CBD0FF',
  bg2: '#F9F9F9',
};

const sectionLabelSx = {
  mb: 1.25,
  color: FORM_COLORS.mute,
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.08em',
  lineHeight: 1,
  textTransform: 'uppercase',
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 1.5,
    backgroundColor: '#fff',
    '& fieldset': { borderColor: FORM_COLORS.blue100, borderWidth: 1.5 },
    '&:hover fieldset': { borderColor: FORM_COLORS.blue200 },
    '&.Mui-focused fieldset': { borderColor: FORM_COLORS.blue },
  },
  '& .MuiInputLabel-root': {
    color: FORM_COLORS.mute,
    fontSize: 13,
    fontWeight: 700,
  },
  '& .MuiInputBase-input': {
    color: FORM_COLORS.ink,
    fontSize: 14,
  },
  '& .MuiFormHelperText-root': {
    mx: 0,
    color: FORM_COLORS.mute,
    fontSize: 11,
  },
};

const actionButtonSx = {
  minHeight: 40,
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

function SectionLabel({ children }) {
  return <Typography sx={sectionLabelSx}>{children}</Typography>;
}

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
        paper: {
          sx: {
            borderRadius: 2.5,
            overflow: 'hidden',
          },
        },
        transition: {
          onExited: handleExited,
        },
      }}
    >
      <DialogTitle
        sx={{
          position: 'relative',
          px: 3,
          py: 2,
          pr: 7,
          color: FORM_COLORS.mute,
          borderBottom: `1px solid ${FORM_COLORS.blue100}`,
          fontSize: 13,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {isEditMode ? 'Edit roadmap' : 'Create roadmap'}
        <IconButton
          aria-label="Close roadmap dialog"
          onClick={handleDialogClose}
          disabled={isSaving || isDeleting}
          sx={{
            position: 'absolute',
            right: 16,
            top: 10,
            width: 32,
            height: 32,
            border: `1px solid ${FORM_COLORS.blue200}`,
            color: FORM_COLORS.slate,
            backgroundColor: '#fff',
            '&:hover': { backgroundColor: FORM_COLORS.blue50 },
          }}
        >
          <CloseOutlinedIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ px: { xs: 2.5, md: 4 }, pt: { xs: 3, md: 4 }, pb: 2.5 }}>
          <Typography
            component="h2"
            sx={{
              color: FORM_COLORS.ink,
              fontFamily: '"Barlow Semi Condensed", Inter, Arial, sans-serif',
              fontSize: { xs: 34, md: 44 },
              fontWeight: 900,
              letterSpacing: 0,
              lineHeight: 0.95,
            }}
          >
            {isEditMode ? 'Edit roadmap' : 'Create roadmap'}
          </Typography>
          <Typography sx={{ mt: 1, color: FORM_COLORS.mute, fontSize: 14, lineHeight: 1.45 }}>
            Assemble a learning path from ready lessons and set the order learners will follow.
          </Typography>
        </Box>

        <Stack spacing={3} sx={{ px: { xs: 2.5, md: 4 }, pb: 3 }}>
          <TextField
            label="Title"
            fullWidth
            value={form.title}
            onChange={handleChange('title')}
            error={Boolean(errors.title)}
            helperText={errors.title}
            sx={fieldSx}
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={3}
            value={form.description}
            onChange={handleChange('description')}
            placeholder="Describe what this roadmap helps people learn."
            sx={fieldSx}
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
                sx={fieldSx}
              />
            )}
          />

          {form.selectedLessons.length > 0 && (
            <Stack spacing={1}>
              <SectionLabel>Lesson order</SectionLabel>

              <Stack spacing={0.75}>
                {form.selectedLessons.map((lesson, index) => (
                  <Box
                    key={lesson.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '32px minmax(0, 1fr) auto',
                      gap: 1,
                      alignItems: 'center',
                      px: 1.25,
                      py: 1,
                      borderRadius: 1.5,
                      border: `1.5px solid ${FORM_COLORS.blue100}`,
                      backgroundColor: '#fff',
                    }}
                  >
                    <Chip
                      label={index + 1}
                      size="small"
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: 999,
                        color: FORM_COLORS.blue,
                        backgroundColor: FORM_COLORS.blue50,
                        fontWeight: 900,
                      }}
                    />
                    <Typography variant="body2" noWrap sx={{ color: FORM_COLORS.ink, fontWeight: 800 }}>
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
                        onClick={() => removeSelectedLesson(lesson.id)}
                        disabled={isSaving || isDeleting}
                        sx={{ color: '#D62F2F' }}
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
                sx={fieldSx}
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

      <DialogActions
        sx={{
          px: { xs: 2.5, md: 3.5 },
          py: 1.75,
          gap: 1,
          borderTop: `1px solid ${FORM_COLORS.blue100}`,
          backgroundColor: FORM_COLORS.bg2,
        }}
      >
        {isEditMode && (
          <Button
            onClick={() => onDelete?.(initialRoadmap)}
            disabled={isSaving || isDeleting}
            sx={{
              mr: 'auto',
              ...actionButtonSx,
              border: '1px solid rgba(214, 47, 47, 0.28)',
              color: '#D62F2F',
              backgroundColor: '#fff',
              '&:hover': { backgroundColor: 'rgba(214, 47, 47, 0.05)' },
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Roadmap'}
          </Button>
        )}

        <Button
          onClick={handleDialogClose}
          disabled={isSaving || isDeleting}
          sx={{
            ...actionButtonSx,
            border: `1px solid ${FORM_COLORS.blue200}`,
            color: FORM_COLORS.slate,
            backgroundColor: 'transparent',
            '&:hover': { backgroundColor: '#fff' },
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSaving || isDeleting || readyLessons.length === 0}
          sx={{
            ...actionButtonSx,
            px: 2.75,
            backgroundColor: FORM_COLORS.blue,
            boxShadow: 'none',
            '&:hover': { backgroundColor: FORM_COLORS.blue, boxShadow: 'none' },
          }}
        >
          {isSaving
            ? isEditMode ? 'Saving...' : 'Creating...'
            : isEditMode ? 'Save Roadmap' : 'Create Roadmap'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
