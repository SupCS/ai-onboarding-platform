'use client';

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
}) {
  if (!lesson) {
    return null;
  }

  const metadata = lesson.generationMetadata || {};
  const preparedMaterials = metadata.preparedMaterials || {};
  const sourceReferences = preparedMaterials.sourceReferences || [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      PaperProps={{
        sx: {
          height: '92vh',
          borderRadius: 4,
        },
      }}
    >
      <DialogTitle sx={{ pr: 7 }}>
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

      <DialogContent dividers>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 320px' },
            gap: 3,
            alignItems: 'start',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              border: '1px solid #e5e7eb',
              backgroundColor: '#fff',
              minHeight: 420,
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
              <Typography
                component="pre"
                variant="body1"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'inherit',
                  lineHeight: 1.75,
                }}
              >
                {lesson.contentMarkdown || 'This lesson does not have content yet.'}
              </Typography>
            )}
          </Paper>

          <Stack spacing={2}>
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

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
