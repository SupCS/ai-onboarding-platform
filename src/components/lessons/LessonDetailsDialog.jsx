'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
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
  const initialHtml = useMemo(() => {
    return lesson?.contentHtml || markdownToHtml(lesson?.contentMarkdown || '');
  }, [lesson]);
  const [draftHtml, setDraftHtml] = useState(initialHtml);

  useEffect(() => {
    setIsEditing(false);
    setDraftHtml(initialHtml);
  }, [initialHtml, lesson?.id]);

  if (!lesson) {
    return null;
  }

  const metadata = lesson.generationMetadata || {};
  const preparedMaterials = metadata.preparedMaterials || {};
  const sourceReferences = preparedMaterials.sourceReferences || [];

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
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, flex: '0 0 auto' }}>
        <Button
          onClick={handleDelete}
          color="error"
          disabled={isSaving || isDeleting}
          sx={{ mr: 'auto' }}
        >
          {isDeleting ? 'Deleting...' : 'Delete lesson'}
        </Button>

        {isEditing ? (
          <>
            <Button onClick={handleCancelEdit} color="inherit" disabled={isSaving || isDeleting}>
              Cancel
            </Button>
            <Button onClick={handleSave} variant="contained" disabled={isSaving || isDeleting}>
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </>
        ) : (
          lesson.status !== 'failed' && (
            <Button onClick={() => setIsEditing(true)} variant="contained" disabled={isDeleting}>
              Edit lesson
            </Button>
          )
        )}
        <Button onClick={onClose} color="inherit" disabled={isSaving || isDeleting}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
