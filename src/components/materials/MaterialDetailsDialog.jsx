'use client';

import { useState } from 'react';
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
  Link,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import SmartDisplayOutlinedIcon from '@mui/icons-material/SmartDisplayOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import TextSnippetOutlinedIcon from '@mui/icons-material/TextSnippetOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import { AI_DIGITAL_COLORS, hexToRgba } from '../../lib/brandColors';

function formatDate(isoString) {
  try {
    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(isoString));
  } catch {
    return '';
  }
}

function formatFileSize(size) {
  if (!Number.isFinite(size) || size <= 0) {
    return '';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function extractYoutubeVideoId(url) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes('youtu.be')) {
      return parsedUrl.pathname.replace('/', '');
    }

    if (parsedUrl.hostname.includes('youtube.com')) {
      return parsedUrl.searchParams.get('v');
    }

    return null;
  } catch {
    return null;
  }
}

function getYoutubeEmbedUrl(url) {
  const videoId = extractYoutubeVideoId(url);

  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

function Section({ icon, title, children }) {
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        {icon}
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
      </Stack>
      {children}
    </Stack>
  );
}

const badgeStyles = [
  {
    backgroundColor: hexToRgba(AI_DIGITAL_COLORS.lime, 0.72),
    color: AI_DIGITAL_COLORS.midnightCharcoal,
  },
  {
    backgroundColor: hexToRgba(AI_DIGITAL_COLORS.brightAqua, 0.62),
    color: AI_DIGITAL_COLORS.midnightCharcoal,
  },
  {
    backgroundColor: hexToRgba(AI_DIGITAL_COLORS.pink, 0.26),
    color: AI_DIGITAL_COLORS.midnightCharcoal,
  },
  {
    backgroundColor: hexToRgba(AI_DIGITAL_COLORS.skywave, 0.5),
    color: AI_DIGITAL_COLORS.midnightCharcoal,
  },
  {
    backgroundColor: hexToRgba(AI_DIGITAL_COLORS.digitalLilac, 0.48),
    color: AI_DIGITAL_COLORS.midnightCharcoal,
  },
];

function MaterialBadge({ label, index = 0 }) {
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        ...badgeStyles[index % badgeStyles.length],
        height: 26,
        borderRadius: 999,
        fontWeight: 850,
        border: `1px solid ${hexToRgba(AI_DIGITAL_COLORS.yvesKleinBlue, 0.08)}`,
        '& .MuiChip-label': {
          px: 1.1,
        },
      }}
    />
  );
}

export default function MaterialDetailsDialog({
  material,
  open,
  isDeleting = false,
  allowDelete = true,
  onClose,
  onDelete,
  onEdit,
}) {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  if (!material) {
    return null;
  }

  const imageAttachments = material.attachments?.filter(
    (item) => item.kind === 'image'
  ) || [];
  const fileAttachments = material.attachments?.filter(
    (item) => item.kind === 'file'
  ) || [];
  const handleDialogClose = (...args) => {
    if (isDeleting) {
      return;
    }

    setIsConfirmDialogOpen(false);
    onClose(...args);
  };

  return (
    <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ pr: 16 }}>
        <Stack spacing={1}>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
            {material.title}
          </Typography>

          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <MaterialBadge label={`Added ${formatDate(material.createdAt)}`} index={0} />
            {material.youtubeUrls?.length > 0 && (
              <MaterialBadge label={`${material.youtubeUrls.length} video(s)`} index={1} />
            )}
            {material.links?.length > 0 && (
              <MaterialBadge label={`${material.links.length} link(s)`} index={2} />
            )}
            {imageAttachments.length > 0 && (
              <MaterialBadge label={`${imageAttachments.length} image(s)`} index={3} />
            )}
            {fileAttachments.length > 0 && (
              <MaterialBadge label={`${fileAttachments.length} file(s)`} index={4} />
            )}
            {material.text && <MaterialBadge label="Text included" index={5} />}
          </Stack>

          {material.description && (
            <Typography variant="body1" color="text.secondary">
              {material.description}
            </Typography>
          )}
        </Stack>

        <Stack
          direction="row"
          spacing={0.5}
          sx={{ position: 'absolute', right: 16, top: 16 }}
        >
          <IconButton
            aria-label="Edit material"
            onClick={onEdit}
            disabled={isDeleting}
            color="default"
          >
            <EditOutlinedIcon />
          </IconButton>
          {allowDelete && (
            <IconButton
              aria-label="Delete material"
              onClick={() => setIsConfirmDialogOpen(true)}
              disabled={isDeleting}
              color="error"
            >
              <DeleteOutlineOutlinedIcon />
            </IconButton>
          )}
          <IconButton
            aria-label="Close material details"
            onClick={handleDialogClose}
            disabled={isDeleting}
          >
            <CloseOutlinedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {material.text && (
            <>
              <Section
                icon={<TextSnippetOutlinedIcon sx={{ color: AI_DIGITAL_COLORS.yvesKleinBlue }} />}
                title="Text"
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#fff',
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  >
                    {material.text}
                  </Typography>
                </Paper>
              </Section>
              <Divider />
            </>
          )}

          {material.youtubeUrls?.length > 0 && (
            <>
              <Section
                icon={<SmartDisplayOutlinedIcon sx={{ color: AI_DIGITAL_COLORS.yvesKleinBlue }} />}
                title="Videos"
              >
                <Stack spacing={2}>
                  {material.youtubeUrls.map((url) => {
                    const embedUrl = getYoutubeEmbedUrl(url);

                    return (
                      <Paper
                        key={url}
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          border: '1px solid #e5e7eb',
                          backgroundColor: '#fff',
                        }}
                      >
                        <Stack spacing={1.5}>
                          {embedUrl ? (
                            <Box
                              sx={{
                                position: 'relative',
                                width: '100%',
                                paddingTop: '56.25%',
                                overflow: 'hidden',
                                borderRadius: 2,
                                backgroundColor: '#111827',
                              }}
                            >
                              <Box
                                component="iframe"
                                src={embedUrl}
                                title={`YouTube video for ${material.title}`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                sx={{
                                  position: 'absolute',
                                  inset: 0,
                                  width: '100%',
                                  height: '100%',
                                  border: 0,
                                }}
                              />
                            </Box>
                          ) : null}

                          <Link
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            underline="hover"
                            sx={{ wordBreak: 'break-all' }}
                          >
                            {url}
                          </Link>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              </Section>
              <Divider />
            </>
          )}

          {imageAttachments.length > 0 && (
            <>
              <Section
                icon={<ImageOutlinedIcon sx={{ color: AI_DIGITAL_COLORS.yvesKleinBlue }} />}
                title="Images"
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: 'repeat(2, minmax(0, 1fr))',
                    },
                    gap: 2,
                  }}
                >
                  {imageAttachments.map((attachment) => (
                    <Paper
                      key={attachment.id || attachment.storageKey}
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        border: `1px solid ${hexToRgba(AI_DIGITAL_COLORS.yvesKleinBlue, 0.12)}`,
                        backgroundColor: '#fff',
                        height: { xs: 430, sm: 456 },
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: `0 12px 34px ${hexToRgba(AI_DIGITAL_COLORS.midnightCharcoal, 0.05)}`,
                      }}
                    >
                      <Stack spacing={1.5} sx={{ minHeight: 0, height: '100%' }}>
                        <Box
                          sx={{
                            width: '100%',
                            height: { xs: 288, sm: 320 },
                            flex: '0 0 auto',
                            display: 'grid',
                            placeItems: 'center',
                            overflow: 'hidden',
                            borderRadius: 2,
                            backgroundColor: hexToRgba(AI_DIGITAL_COLORS.skywave, 0.12),
                          }}
                        >
                          <Box
                            component="img"
                            src={attachment.previewUrl}
                            alt={attachment.name}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              display: 'block',
                            }}
                          />
                        </Box>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1}
                          sx={{
                            flex: '1 1 auto',
                            minHeight: 0,
                            justifyContent: 'space-between',
                            alignItems: { xs: 'stretch', sm: 'flex-end' },
                          }}
                        >
                          <Box sx={{ minWidth: 0, pr: { sm: 1 } }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 800,
                                lineHeight: 1.25,
                                display: '-webkit-box',
                                overflow: 'hidden',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                wordBreak: 'break-word',
                              }}
                            >
                              {attachment.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatFileSize(attachment.size)}
                            </Typography>
                          </Box>
                          {attachment.fileUrl && (
                            <Button
                              component="a"
                              href={attachment.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              variant="outlined"
                              size="small"
                              endIcon={<OpenInNewOutlinedIcon />}
                              sx={{
                                flex: '0 0 auto',
                                alignSelf: { xs: 'flex-start', sm: 'flex-end' },
                                borderColor: AI_DIGITAL_COLORS.yvesKleinBlue,
                                color: AI_DIGITAL_COLORS.yvesKleinBlue,
                                fontWeight: 850,
                                minWidth: 82,
                                '&:hover': {
                                  borderColor: AI_DIGITAL_COLORS.yvesKleinBlue,
                                  backgroundColor: hexToRgba(AI_DIGITAL_COLORS.yvesKleinBlue, 0.06),
                                },
                              }}
                            >
                              Open
                            </Button>
                          )}
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                </Box>
              </Section>
              <Divider />
            </>
          )}

          {material.links?.length > 0 && (
            <>
              <Section
                icon={<LinkOutlinedIcon sx={{ color: AI_DIGITAL_COLORS.yvesKleinBlue }} />}
                title="Links"
              >
                <Stack spacing={1.25}>
                  {material.links.map((url) => (
                    <Paper
                      key={url}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#fff',
                      }}
                    >
                      <Link
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        underline="hover"
                        sx={{ wordBreak: 'break-all' }}
                      >
                        {url}
                      </Link>
                    </Paper>
                  ))}
                </Stack>
              </Section>
              <Divider />
            </>
          )}

          {fileAttachments.length > 0 && (
            <Section
              icon={<DescriptionOutlinedIcon sx={{ color: AI_DIGITAL_COLORS.yvesKleinBlue }} />}
              title="Files"
            >
              <Stack spacing={1.25}>
                {fileAttachments.map((attachment) => (
                  <Paper
                    key={attachment.id || attachment.storageKey}
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      border: `1px solid ${hexToRgba(AI_DIGITAL_COLORS.yvesKleinBlue, 0.12)}`,
                      backgroundColor: '#fff',
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1}
                      sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {attachment.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {[attachment.mimeType, formatFileSize(attachment.size)]
                            .filter(Boolean)
                            .join(' • ')}
                        </Typography>
                      </Box>

                      {attachment.fileUrl && (
                        <Button
                          component="a"
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          variant="contained"
                          endIcon={<OpenInNewOutlinedIcon />}
                          sx={{
                            flex: '0 0 auto',
                            fontWeight: 850,
                            backgroundColor: AI_DIGITAL_COLORS.yvesKleinBlue,
                            '&:hover': {
                              backgroundColor: '#0007B8',
                            },
                          }}
                        >
                          Open file
                        </Button>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Section>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleDialogClose} color="inherit" disabled={isDeleting}>
          Close
        </Button>
      </DialogActions>

      <Dialog
        open={allowDelete && isConfirmDialogOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsConfirmDialogOpen(false);
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete material?</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Typography variant="body1">
              This action will permanently remove <strong>{material.title}</strong>.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All related videos, links, text references, and uploaded files will be removed from the library.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setIsConfirmDialogOpen(false)}
            color="inherit"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => onDelete(material)}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
