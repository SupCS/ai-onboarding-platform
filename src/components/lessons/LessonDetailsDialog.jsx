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
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import SourceOutlinedIcon from '@mui/icons-material/SourceOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import LessonAttachments, { getSourceAttachments } from './LessonAttachments';
import { SimpleEditor } from '../tiptap/tiptap-templates/simple/simple-editor';
import { markdownToHtml } from '../../lib/lessonContent';
import { AI_DIGITAL_COLORS, hexToRgba } from '../../lib/brandColors';

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

function DetailPanel({ icon, title, children, accent = AI_DIGITAL_COLORS.yvesKleinBlue }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${hexToRgba(accent, 0.22)}`,
        backgroundColor: '#fff',
        boxShadow: `0 14px 34px ${hexToRgba(AI_DIGITAL_COLORS.midnightCharcoal, 0.05)}`,
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              display: 'grid',
              placeItems: 'center',
              color: AI_DIGITAL_COLORS.midnightCharcoal,
              backgroundColor: hexToRgba(accent, 0.18),
            }}
          >
            {icon}
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
            {title}
          </Typography>
        </Stack>

        {children}
      </Stack>
    </Paper>
  );
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
  const [draftTitle, setDraftTitle] = useState(lesson?.title || '');

  useEffect(() => {
    setIsEditing(false);
    setDraftHtml(initialHtml);
    setDraftTitle(lesson?.title || '');
    setIsRevising(false);
    setRevisionRequest('');
    setSelectedRevisionOptions([]);
    setRevisionError('');
    setActivityType('quiz');
    setActivityCount(8);
    setActivityError('');
    setActivitySuccess('');
  }, [initialHtml, lesson?.id, lesson?.title]);

  if (!lesson) {
    return null;
  }

  const metadata = lesson.generationMetadata || {};
  const preparedMaterials = metadata.preparedMaterials || {};
  const sourceReferences = preparedMaterials.sourceReferences || [];
  const sourceAttachments = getSourceAttachments(sourceReferences);
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
          title: draftTitle.trim(),
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
    setDraftTitle(lesson.title || '');
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
            height: '94vh',
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: AI_DIGITAL_COLORS.silverHaze,
            border: 0,
            boxShadow: `0 28px 80px ${hexToRgba(AI_DIGITAL_COLORS.midnightCharcoal, 0.2)}`,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 0,
          flex: '0 0 auto',
          color: '#fff',
          background: `linear-gradient(115deg, ${AI_DIGITAL_COLORS.yvesKleinBlue} 0%, ${AI_DIGITAL_COLORS.violetPulse} 64%, ${AI_DIGITAL_COLORS.neonAzure} 100%)`,
        }}
      >
        <Box sx={{ position: 'relative', px: { xs: 2, md: 3 }, py: { xs: 2, md: 2.5 }, pr: 8 }}>
          <Stack spacing={1.5}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
              sx={{
                alignItems: { xs: 'flex-start', md: isEditing ? 'stretch' : 'center' },
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ minWidth: 0, flex: '1 1 auto', width: '100%' }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                  <Chip
                    icon={isEditing ? <EditOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    label={isEditing ? 'Editing lesson' : 'Lesson preview'}
                    size="small"
                    sx={{
                      color: AI_DIGITAL_COLORS.midnightCharcoal,
                      backgroundColor: AI_DIGITAL_COLORS.lime,
                      fontWeight: 900,
                      '& .MuiChip-icon': { color: AI_DIGITAL_COLORS.midnightCharcoal },
                    }}
                  />
                  <Chip
                    label={lesson.status}
                    color={getStatusColor(lesson.status)}
                    size="small"
                    sx={{ backgroundColor: 'rgba(255,255,255,0.16)', color: '#fff', fontWeight: 800 }}
                  />
                </Stack>

                {isEditing ? (
                  <Box
                    component="input"
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    placeholder="Lesson title"
                    sx={{
                      display: 'block',
                      width: '100%',
                      maxWidth: 980,
                      minWidth: 0,
                      border: 0,
                      outline: 0,
                      p: 0,
                      m: 0,
                      color: '#fff',
                      backgroundColor: 'transparent',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: { xs: '1.65rem', md: '2.125rem' },
                      fontWeight: 950,
                      lineHeight: 1.08,
                      letterSpacing: 0,
                      '&::placeholder': {
                        color: 'rgba(255,255,255,0.68)',
                      },
                      '&:focus': {
                        boxShadow: `0 2px 0 ${AI_DIGITAL_COLORS.lime}`,
                      },
                    }}
                  />
                ) : (
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 950,
                      lineHeight: 1.08,
                      letterSpacing: 0,
                      maxWidth: 980,
                      wordBreak: 'break-word',
                    }}
                  >
                    {lesson.title}
                  </Typography>
                )}
              </Box>

              {!isEditing && (
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', flex: '0 0 auto' }}>
                  <Chip label={`Created ${formatDateTime(lesson.createdAt)}`} size="small" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.36)' }} variant="outlined" />
                  <Chip label={`By ${lesson.createdBy || 'AI Onboarding'}`} size="small" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.36)' }} variant="outlined" />
                </Stack>
              )}
            </Stack>

            {(lesson.description || metadata.model || metadata.promptVersion || metadata.lastRevisionAt) && (
              <Stack spacing={1}>
                {lesson.description && (
                  <Typography sx={{ maxWidth: 900, color: 'rgba(255,255,255,0.84)', lineHeight: 1.55 }}>
                    {lesson.description}
                  </Typography>
                )}

                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  {metadata.model && <Chip label={`Model: ${metadata.model}`} size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.14)', color: '#fff' }} />}
                  {metadata.promptVersion && <Chip label={`Prompt: ${metadata.promptVersion}`} size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.14)', color: '#fff' }} />}
                  {metadata.lastRevisionAt && <Chip label={`Revised ${formatDateTime(metadata.lastRevisionAt)}`} size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.14)', color: '#fff' }} />}
                </Stack>
              </Stack>
            )}
          </Stack>
        </Box>

        <IconButton
          aria-label="Close lesson details"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: '#fff',
            backgroundColor: 'rgba(255,255,255,0.14)',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.24)' },
          }}
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
          p: { xs: 1.5, md: 2.5 },
          borderColor: hexToRgba(AI_DIGITAL_COLORS.yvesKleinBlue, 0.1),
          backgroundColor: AI_DIGITAL_COLORS.silverHaze,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 340px' },
            gap: 2.5,
            alignItems: 'stretch',
            flex: '1 1 auto',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: 0,
              backgroundColor: '#fff',
              minHeight: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: isEditing
                ? `0 20px 52px ${hexToRgba(AI_DIGITAL_COLORS.yvesKleinBlue, 0.12)}`
                : `0 18px 44px ${hexToRgba(AI_DIGITAL_COLORS.midnightCharcoal, 0.06)}`,
            }}
          >
            {lesson.status === 'failed' ? (
              <Stack spacing={1.5} sx={{ p: { xs: 2, md: 3 } }}>
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
              <Stack sx={{ minHeight: 0, overflow: 'hidden', height: '100%' }}>
                <Box
                  sx={{
                    px: { xs: 1.5, md: 2 },
                    py: 1.5,
                    borderBottom: '1px solid #e8edf5',
                    backgroundColor: isEditing ? hexToRgba(AI_DIGITAL_COLORS.lime, 0.16) : '#fff',
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      {isEditing ? <EditOutlinedIcon sx={{ color: AI_DIGITAL_COLORS.yvesKleinBlue }} /> : <VisibilityOutlinedIcon sx={{ color: AI_DIGITAL_COLORS.yvesKleinBlue }} />}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                          {isEditing ? 'Editor mode' : 'Reading preview'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {isEditing ? 'Make changes in the rich-text canvas below.' : 'Review generated lesson content as learners will read it.'}
                        </Typography>
                      </Box>
                    </Stack>

                    <Chip
                      label={`${sourceReferences.length} source${sourceReferences.length === 1 ? '' : 's'} · ${activities.length} activit${activities.length === 1 ? 'y' : 'ies'}`}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        color: AI_DIGITAL_COLORS.yvesKleinBlue,
                        backgroundColor: hexToRgba(AI_DIGITAL_COLORS.skywave, 0.24),
                      }}
                    />
                  </Stack>
                </Box>

                <Box sx={{ minHeight: 0, flex: '1 1 auto', overflow: 'hidden' }}>
                  <SimpleEditor
                    content={draftHtml}
                    editable={isEditing}
                    onChange={(nextHtml) => setDraftHtml(nextHtml)}
                    className="lesson-details-editor"
                  />
                </Box>

                {sourceAttachments.length > 0 && (
                  <Box
                    sx={{
                      flex: '0 0 auto',
                      p: { xs: 1.5, md: 2 },
                      borderTop: '1px solid #e8edf5',
                      backgroundColor: '#fff',
                      maxHeight: 240,
                      overflow: 'auto',
                    }}
                  >
                    <LessonAttachments
                      attachments={sourceAttachments}
                      onOpenSourceMaterial={onOpenSourceMaterial}
                    />
                  </Box>
                )}
              </Stack>
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
            <DetailPanel
              title="Source materials"
              icon={<SourceOutlinedIcon fontSize="small" />}
              accent={AI_DIGITAL_COLORS.brightAqua}
            >
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
                        border: `1px solid ${hexToRgba(AI_DIGITAL_COLORS.brightAqua, 0.36)}`,
                        borderRadius: 2,
                        backgroundColor: hexToRgba(AI_DIGITAL_COLORS.brightAqua, 0.08),
                        textAlign: 'left',
                        cursor: onOpenSourceMaterial ? 'pointer' : 'default',
                        font: 'inherit',
                        transition: 'background-color 0.15s ease, border-color 0.15s ease',
                        '&:hover': onOpenSourceMaterial
                          ? {
                              backgroundColor: hexToRgba(AI_DIGITAL_COLORS.brightAqua, 0.16),
                              borderColor: AI_DIGITAL_COLORS.neonAzure,
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
            </DetailPanel>

            <DetailPanel
              title="Generation"
              icon={<TuneOutlinedIcon fontSize="small" />}
              accent={AI_DIGITAL_COLORS.digitalLilac}
            >
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                <Chip label={`Depth: ${lesson.depth || 'standard'}`} size="small" />
                <Chip label={`Tone: ${lesson.tone || 'clear'}`} size="small" />
                <Chip label={lesson.desiredFormat || 'structured theoretical lesson'} size="small" />
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
            </DetailPanel>

            {lesson.status !== 'failed' && (
              <DetailPanel
                title="Revise lesson"
                icon={<AutoAwesomeOutlinedIcon fontSize="small" />}
                accent={AI_DIGITAL_COLORS.pink}
              >
                <Stack spacing={1.5}>
                  <Box>
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
                        backgroundColor: hexToRgba(AI_DIGITAL_COLORS.pink, 0.08),
                        border: `1px solid ${hexToRgba(AI_DIGITAL_COLORS.pink, 0.22)}`,
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
                    startIcon={<AutoAwesomeOutlinedIcon />}
                    onClick={handleRevise}
                    disabled={isEditing || isDeleting || isSaving || isRevising}
                  >
                    {isRevising ? 'Revising lesson...' : 'Revise lesson'}
                  </Button>
                </Stack>
              </DetailPanel>
            )}

            {lesson.status !== 'failed' && (
              <DetailPanel
                title="Generate activity"
                icon={<QuizOutlinedIcon fontSize="small" />}
                accent={AI_DIGITAL_COLORS.lime}
              >
                <Stack spacing={1.5}>
                  <Box>
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
                    slotProps={{
                      htmlInput: {
                        min: activitySettings.min,
                        max: activitySettings.max,
                      },
                    }}
                    helperText={`Allowed: ${activitySettings.min}-${activitySettings.max}`}
                    disabled={isEditing || isDeleting || isSaving || isRevising || isGeneratingActivity}
                  />

                  {activities.length > 0 && (
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: hexToRgba(AI_DIGITAL_COLORS.lime, 0.1),
                        border: `1px solid ${hexToRgba(AI_DIGITAL_COLORS.lime, 0.28)}`,
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
                    startIcon={<QuizOutlinedIcon />}
                    onClick={handleGenerateActivity}
                    disabled={isEditing || isDeleting || isSaving || isRevising || isGeneratingActivity}
                  >
                    {isGeneratingActivity ? 'Generating activity...' : 'Generate activity'}
                  </Button>
                </Stack>
              </DetailPanel>
            )}
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, md: 3 },
          py: 1.5,
          flex: '0 0 auto',
          borderTop: '1px solid #e4e8f0',
          backgroundColor: '#fff',
        }}
      >
        <Button
          onClick={handleDelete}
          color="error"
          startIcon={<DeleteOutlineOutlinedIcon />}
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
            <Button
              onClick={handleSave}
              variant="contained"
              startIcon={<SaveOutlinedIcon />}
              disabled={isSaving || isDeleting || isRevising || isGeneratingActivity}
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </>
        ) : (
          lesson.status !== 'failed' && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="contained"
              startIcon={<EditOutlinedIcon />}
              disabled={isDeleting || isRevising || isGeneratingActivity}
            >
              Edit lesson
            </Button>
          )
        )}
        <Button
          onClick={onClose}
          color="inherit"
          startIcon={<LibraryBooksOutlinedIcon />}
          disabled={isSaving || isDeleting || isRevising || isGeneratingActivity}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
