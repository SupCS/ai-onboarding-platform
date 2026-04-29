'use client';

import { Box, Typography } from '@mui/material';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';

export function getSourceAttachments(sourceReferences = []) {
  return sourceReferences.flatMap((source) => (
    (source.attachments || []).map((attachment) => ({
      ...attachment,
      sourceId: source.id,
      sourceNumber: source.sourceNumber,
      sourceTitle: source.title,
    }))
  ));
}

function getFileBadge(attachment) {
  const mimeType = (attachment.mimeType || '').toLowerCase();
  const name = (attachment.name || '').toLowerCase();

  if (mimeType.includes('pdf') || name.endsWith('.pdf')) {
    return { label: 'PDF', color: '#dc2626' };
  }

  if (mimeType.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) {
    return { label: 'DOC', color: '#2563eb' };
  }

  if (
    mimeType.includes('excel') ||
    mimeType.includes('spreadsheet') ||
    name.endsWith('.xls') ||
    name.endsWith('.xlsx')
  ) {
    return { label: 'XLS', color: '#15803d' };
  }

  if (mimeType.includes('presentation') || name.endsWith('.ppt') || name.endsWith('.pptx')) {
    return { label: 'PPT', color: '#c2410c' };
  }

  if (mimeType.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md')) {
    return { label: 'TXT', color: '#475569' };
  }

  return { label: 'FILE', color: '#0009DC' };
}

export default function LessonAttachments({
  attachments = [],
  sourceReferences = [],
  onOpenSourceMaterial,
}) {
  const resolvedAttachments = attachments.length > 0
    ? attachments
    : getSourceAttachments(sourceReferences);

  const handleOpenAttachment = async (attachment) => {
    if (!attachment.storageKey) {
      onOpenSourceMaterial?.(attachment.sourceId);
      return;
    }

    const openedWindow = window.open('', '_blank');

    try {
      const response = await fetch(
        `/api/files/preview?storageKey=${encodeURIComponent(attachment.storageKey)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open attachment.');
      }

      if (openedWindow) {
        openedWindow.opener = null;
        openedWindow.location.href = data.previewUrl;
      }
    } catch (error) {
      console.error('Failed to open attachment:', error);
      openedWindow?.close();
      onOpenSourceMaterial?.(attachment.sourceId);
    }
  };

  if (resolvedAttachments.length === 0) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 900, mb: 1.25 }}>
        Attachments
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 136px)',
            sm: 'repeat(3, 136px)',
            md: 'repeat(4, 136px)',
            xl: 'repeat(5, 136px)',
          },
          gap: 1.5,
          justifyContent: { xs: 'center', sm: 'flex-start' },
        }}
      >
        {resolvedAttachments.map((attachment, index) => {
          const isImage = attachment.kind === 'image' || attachment.mimeType?.startsWith('image/');
          const badge = getFileBadge(attachment);
          const canOpen = Boolean(attachment.storageKey || onOpenSourceMaterial);

          return (
            <Box
              key={attachment.id || `${attachment.sourceId}-${attachment.name}-${index}`}
              component="button"
              type="button"
              disabled={!canOpen}
              onClick={() => handleOpenAttachment(attachment)}
              sx={{
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                p: 1,
                border: '1px solid #e5e7eb',
                borderRadius: 3,
                backgroundColor: '#fff',
                color: 'inherit',
                cursor: canOpen ? 'pointer' : 'not-allowed',
                font: 'inherit',
                opacity: canOpen ? 1 : 0.62,
                textAlign: 'center',
                transition: 'border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease',
                '&:hover': canOpen ? {
                  backgroundColor: '#f8fafc',
                  borderColor: '#bfdbfe',
                  transform: 'translateY(-1px)',
                } : undefined,
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  maxWidth: 112,
                  aspectRatio: '1 / 1',
                  display: 'grid',
                  placeItems: 'center',
                  overflow: 'hidden',
                  border: '1px solid #eef2f7',
                  borderRadius: 2,
                  backgroundColor: '#f8fafc',
                }}
              >
                {isImage && attachment.previewUrl ? (
                  <Box
                    component="img"
                    src={attachment.previewUrl}
                    alt=""
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : isImage ? (
                  <ImageOutlinedIcon sx={{ fontSize: 42, color: '#0f766e' }} />
                ) : (
                  <Typography
                    sx={{
                      color: badge.color,
                      fontSize: 18,
                      fontWeight: 950,
                      lineHeight: 1,
                    }}
                  >
                    {badge.label}
                  </Typography>
                )}
              </Box>

              <Typography
                variant="body2"
                sx={{
                  width: '100%',
                  maxWidth: 132,
                  fontWeight: 850,
                  lineHeight: 1.2,
                  display: '-webkit-box',
                  overflow: 'hidden',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  wordBreak: 'break-word',
                }}
              >
                {attachment.name}
              </Typography>
              <OpenInNewOutlinedIcon sx={{ display: 'none' }} />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
