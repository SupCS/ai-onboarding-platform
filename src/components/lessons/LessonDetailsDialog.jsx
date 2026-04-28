'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  IconButton,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { SimpleEditor } from '../tiptap/tiptap-templates/simple/simple-editor';
import { markdownToHtml } from '../../lib/lessonContent';

function formatDateTime(isoString) {
  try {
    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return '';
  }
}

function getStatusColor(status) {
  if (status === 'ready') {
    return 'success';
  }

  if (status === 'failed') {
    return 'error';
  }

  if (status === 'generating') {
    return 'warning';
  }

  return 'default';
}

const revisionOptions = [
  { value: 'simpler', label: 'Simpler' },
  { value: 'deeper', label: 'Deeper' },
  { value: 'examples', label: 'More examples' },
  { value: 'structured', label: 'Better structure' },
  { value: 'shorter', label: 'Shorter' },
];

const activityTypeOptions = [
  { value: 'quiz', label: 'Quiz', min: 3, max: 20, defaultCount: 8 },
  { value: 'flashcards', label: 'Flashcards', min: 5, max: 40, defaultCount: 12 },
];

function getActivityTypeSettings(type) {
  return activityTypeOptions.find((option) => option.value === type) || activityTypeOptions[0];
}

export default function LessonDetailsDialog({
  lesson,
  open,
  onClose,
  onOpenSourceMaterial,
  onLessonDeleted,
  onLessonUpdated,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  const [isGeneratingActivity, setIsGeneratingActivity] = useState(false);
  const [revisionRequest, setRevisionRequest] = useState('');
  const [selectedRevisionOptions, setSelectedRevisionOptions] = useState([]);
  const [revisionError, setRevisionError] = useState('');
  const [activityType, setActivityType] = useState('quiz');
  const [activityCount, setActivityCount] = useState(8);
  const [activityError, setActivityError] = useState('');
  const [activitySuccess, setActivitySuccess] = useState('');
  const initialHtml = useMemo(() => {
    return lesson?.contentHtml || markdownToHtml(lesson?.contentMarkdown || '');
  }, [lesson]);
  const [draftHtml, setDraftHtml] = useState(initialHtml);

  useEffect(() => {
    setIsEditing(false);
    setDraftHtml(initialHtml);
    setIsRevising(false);
    setRevisionRequest('');
    setSelectedRevisionOptions([]);
    setRevisionError('');
    setActivityType('quiz');
    setActivityCount(8);
    setActivityError('');
    setActivitySuccess('');
  }, [initialHtml, lesson?.id]);

  if (!lesson) {
    return null;
  }

  const metadata = lesson.generationMetadata || {};
  const preparedMaterials = metadata.preparedMaterials || {};
  const sourceReferences = preparedMaterials.sourceReferences || [];
  const revisionHistory = Array.isArray(metadata.revisionHistory)
    ? metadata.revisionHistory
    : [];
  const lastRevision = revisionHistory[revisionHistory.length - 1] || null;
  const activities = Array.isArray(lesson.activities) ? lesson.activities : [];
  const activitySettings = getActivityTypeSettings(activityType);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const response = await fetch(`/api/lessons/${lesson.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentHtml: draftHtml,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save lesson.');
      }

      setIsEditing(false);
      await onLessonUpdated?.(data.lesson);
    } catch (error) {
      console.error('Failed to save lesson:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setDraftHtml(initialHtml);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete lesson "${lesson.title}"? This removes it from the whole library and from every user's My Lessons.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/lessons/${lesson.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete lesson.');
      }

      await onLessonDeleted?.(lesson.id);
    } catch (error) {
      console.error('Failed to delete lesson:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleRevisionOption = (value) => {
    setSelectedRevisionOptions((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }

      return [...prev, value];
    });
  };

  const handleRevise = async () => {
    if (!revisionRequest.trim() && selectedRevisionOptions.length === 0) {
      setRevisionError('Add revision notes or select at least one revision option.');
      return;
    }

    try {
      setIsRevising(true);
      setRevisionError('');

      const response = await fetch(`/api/lessons/${lesson.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          revisionRequest,
          selectedOptions: selectedRevisionOptions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revise lesson.');
      }

      setRevisionRequest('');
      setSelectedRevisionOptions([]);
      await onLessonUpdated?.(data.lesson);
    } catch (error) {
      console.error('Failed to revise lesson:', error);
      setRevisionError(error.message || 'Failed to revise lesson.');
    } finally {
      setIsRevising(false);
    }
  };

  const handleActivityTypeChange = (nextType) => {
    const nextSettings = getActivityTypeSettings(nextType);

    setActivityType(nextType);
    setActivityCount(nextSettings.defaultCount);
    setActivityError('');
    setActivitySuccess('');
  };

  const handleGenerateActivity = async () => {
    const normalizedCount = Number.parseInt(activityCount, 10);

    if (
      Number.isNaN(normalizedCount) ||
      normalizedCount < activitySettings.min ||
      normalizedCount > activitySettings.max
    ) {
      setActivityError(
        `Choose a number between ${activitySettings.min} and ${activitySettings.max}.`
      );
      return;
    }

    try {
      setIsGeneratingActivity(true);
      setActivityError('');
      setActivitySuccess('');

      const response = await fetch(`/api/lessons/${lesson.id}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: activityType,
          count: normalizedCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate activity.');
      }

      console.group('Generated lesson activity');
      console.log('Lesson:', lesson);
      console.log('Activity:', data.activity);
      console.log('Activity payload:', data.activity?.payload);
      console.log('Prompt:', data.prompt);
      console.log('Full response:', data);
      console.groupEnd();

      setActivitySuccess('Activity generated and saved. Check the browser console for the JSON.');
      await onLessonUpdated?.({
        ...lesson,
        activities: [data.activity, ...activities],
      });
    } catch (error) {
      console.error('Failed to generate lesson activity:', error);
      setActivityError(error.message || 'Failed to generate activity.');
    } finally {
      setIsGeneratingActivity(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      slotProps={{
        paper: {
          sx: {
            height: '92vh',
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        },
      }}
    >
      <DialogTitle sx={{ pr: 7, flex: '0 0 auto' }}>
        <Stack spacing={1.5}>
          <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.12 }}>
            {lesson.title}
          </Typography>

          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Chip
              label={lesson.status}
              color={getStatusColor(lesson.status)}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`Created ${formatDateTime(lesson.createdAt)}`}
              size="small"
            />
            <Chip
              label={`By ${lesson.createdBy || 'AI Onboarding'}`}
              size="small"
            />
            {metadata.model && (
              <Chip label={`Model: ${metadata.model}`} size="small" />
            )}
            {metadata.promptVersion && (
              <Chip label={`Prompt: ${metadata.promptVersion}`} size="small" />
            )}
            {metadata.lastRevisionAt && (
              <Chip label={`Revised ${formatDateTime(metadata.lastRevisionAt)}`} size="small" />
            )}
          </Stack>

          {lesson.description && (
            <Typography variant="body1" color="text.secondary">
              {lesson.description}
            </Typography>
          )}
        </Stack>

        <IconButton
          aria-label="Close lesson details"
          onClick={onClose}
          sx={{ position: 'absolute', right: 16, top: 16 }}
        >
          <CloseOutlinedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 320px' },
            gap: 3,
            alignItems: 'stretch',
            flex: '1 1 auto',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              border: '1px solid #e5e7eb',
              backgroundColor: '#fff',
              minHeight: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {lesson.status === 'failed' ? (
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <ErrorOutlineOutlinedIcon color="error" />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Generation failed
                  </Typography>
                </Stack>
                <Typography color="text.secondary">
                  {lesson.errorMessage || 'No error message was saved.'}
                </Typography>
              </Stack>
            ) : (
              <SimpleEditor
                content={draftHtml}
                editable={isEditing}
                onChange={(nextHtml) => setDraftHtml(nextHtml)}
                className="lesson-details-editor"
              />
            )}
          </Paper>

          <Stack
            spacing={2}
            sx={{
              minHeight: 0,
              overflow: 'auto',
              pr: 0.5,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                backgroundColor: '#fff',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                Source materials
              </Typography>

              {sourceReferences.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No source snapshot found.
                </Typography>
              ) : (
                <Stack spacing={1.25}>
                  {sourceReferences.map((source) => (
                    <Box
                      key={source.id}
                      component={onOpenSourceMaterial ? 'button' : 'div'}
                      type={onOpenSourceMaterial ? 'button' : undefined}
                      onClick={
                        onOpenSourceMaterial
                          ? () => onOpenSourceMaterial(source.id)
                          : undefined
                      }
                      sx={{
                        width: '100%',
                        p: 1,
                        border: '1px solid #eef2f7',
                        borderRadius: 2,
                        backgroundColor: '#f8fafc',
                        textAlign: 'left',
                        cursor: onOpenSourceMaterial ? 'pointer' : 'default',
                        font: 'inherit',
                        transition: 'background-color 0.15s ease, border-color 0.15s ease',
                        '&:hover': onOpenSourceMaterial
                          ? {
                              backgroundColor: '#eff6ff',
                              borderColor: '#bfdbfe',
                            }
                          : undefined,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {source.sourceNumber}. {source.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(source.links?.length || 0) +
                          (source.youtubeUrls?.length || 0)} link(s),{' '}
                        {source.attachments?.length || 0} attachment(s)
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                backgroundColor: '#fff',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                Generation
              </Typography>

              <Stack spacing={0.75}>
                <Typography variant="body2" color="text.secondary">
                  Depth: {lesson.depth || 'standard'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tone: {lesson.tone || 'clear'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Format: {lesson.desiredFormat || 'structured theoretical lesson'}
                </Typography>
              </Stack>

              {lesson.userInstructions && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Extra instructions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {lesson.userInstructions}
                  </Typography>
                </>
              )}
            </Paper>

            {lesson.status !== 'failed' && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#fff',
                }}
              >
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
                      Revise lesson
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Describe what should change. The system will decide how broad the rewrite needs to be.
                    </Typography>
                  </Box>

                  {revisionError && <Alert severity="error">{revisionError}</Alert>}

                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                    {revisionOptions.map((option) => (
                      <Chip
                        key={option.value}
                        label={option.label}
                        clickable
                        color={selectedRevisionOptions.includes(option.value) ? 'primary' : 'default'}
                        variant={selectedRevisionOptions.includes(option.value) ? 'filled' : 'outlined'}
                        onClick={() => handleToggleRevisionOption(option.value)}
                      />
                    ))}
                  </Stack>

                  <TextField
                    label="Revision notes"
                    value={revisionRequest}
                    onChange={(event) => setRevisionRequest(event.target.value)}
                    minRows={4}
                    multiline
                    placeholder="Example: keep the factual content, but make the explanation less course-like and add one clear example for naming conventions."
                    fullWidth
                    disabled={isEditing || isDeleting || isSaving || isRevising}
                  />

                  {lastRevision && (
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: '#f8fafc',
                        border: '1px solid #eef2f7',
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}>
                        Last revision
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        {formatDateTime(lastRevision.revisedAt)} • {lastRevision.revisionBrief?.changeScope || 'substantial'}
                      </Typography>
                      {lastRevision.revisionRequest && (
                        <Typography variant="body2" color="text.secondary">
                          {lastRevision.revisionRequest}
                        </Typography>
                      )}
                    </Box>
                  )}

                  <Button
                    variant="contained"
                    onClick={handleRevise}
                    disabled={isEditing || isDeleting || isSaving || isRevising}
                  >
                    {isRevising ? 'Revising lesson...' : 'Revise lesson'}
                  </Button>
                </Stack>
              </Paper>
            )}

            {lesson.status !== 'failed' && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#fff',
                }}
              >
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
                      Generate activity
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Create a saved quiz or flashcards from this lesson. Passing flow comes later.
                    </Typography>
                  </Box>

                  {activityError && <Alert severity="error">{activityError}</Alert>}
                  {activitySuccess && <Alert severity="success">{activitySuccess}</Alert>}

                  <FormControl fullWidth size="small">
                    <InputLabel id="activity-type-label">Activity type</InputLabel>
                    <Select
                      labelId="activity-type-label"
                      value={activityType}
                      label="Activity type"
                      onChange={(event) => handleActivityTypeChange(event.target.value)}
                      disabled={isEditing || isDeleting || isSaving || isRevising || isGeneratingActivity}
                    >
                      {activityTypeOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label={activityType === 'quiz' ? 'Questions' : 'Cards'}
                    type="number"
                    value={activityCount}
                    onChange={(event) => setActivityCount(event.target.value)}
                    size="small"
                    fullWidth
                    inputProps={{
                      min: activitySettings.min,
                      max: activitySettings.max,
                    }}
                    helperText={`Allowed: ${activitySettings.min}-${activitySettings.max}`}
                    disabled={isEditing || isDeleting || isSaving || isRevising || isGeneratingActivity}
                  />

                  {activities.length > 0 && (
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: '#f8fafc',
                        border: '1px solid #eef2f7',
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}>
                        Saved activities
                      </Typography>
                      <Stack spacing={0.75}>
                        {activities.slice(0, 3).map((activity) => (
                          <Typography key={activity.id} variant="body2" color="text.secondary">
                            {activity.title || activity.type} - {activity.itemCount} item(s)
                          </Typography>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  <Button
                    variant="contained"
                    onClick={handleGenerateActivity}
                    disabled={isEditing || isDeleting || isSaving || isRevising || isGeneratingActivity}
                  >
                    {isGeneratingActivity ? 'Generating activity...' : 'Generate activity'}
                  </Button>
                </Stack>
              </Paper>
            )}
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, flex: '0 0 auto' }}>
        <Button
          onClick={handleDelete}
          color="error"
          disabled={isSaving || isDeleting || isRevising || isGeneratingActivity}
          sx={{ mr: 'auto' }}
        >
          {isDeleting ? 'Deleting...' : 'Delete lesson'}
        </Button>

        {isEditing ? (
          <>
            <Button onClick={handleCancelEdit} color="inherit" disabled={isSaving || isDeleting || isGeneratingActivity}>
              Cancel
            </Button>
            <Button onClick={handleSave} variant="contained" disabled={isSaving || isDeleting || isRevising || isGeneratingActivity}>
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </>
        ) : (
          lesson.status !== 'failed' && (
            <Button onClick={() => setIsEditing(true)} variant="contained" disabled={isDeleting || isRevising || isGeneratingActivity}>
              Edit lesson
            </Button>
          )
        )}
        <Button onClick={onClose} color="inherit" disabled={isSaving || isDeleting || isRevising || isGeneratingActivity}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
