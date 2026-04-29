'use client';

import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import SmartDisplayOutlinedIcon from '@mui/icons-material/SmartDisplayOutlined';
import { AI_DIGITAL_COLORS, hexToRgba } from '../../lib/brandColors';

export function getSourceAttachments(sourceReferences = []) {
  return sourceReferences.flatMap((source) => {
    const youtubeMetadataByUrl = new Map(
      (source.youtubeVideos || []).map((video) => [video.url, video])
    );
    const youtubeAssets = (source.youtubeUrls || []).map((url, index) => {
      const metadata = youtubeMetadataByUrl.get(url) || {};

      return {
        id: `${source.id || source.sourceNumber}-youtube-${index}`,
        name: metadata.title || getYoutubeAssetName(url, index),
        kind: 'youtube',
        mimeType: 'video/youtube',
        url,
        youtubeTitle: metadata.title || '',
        youtubeAuthorName: metadata.authorName || '',
        youtubeThumbnailUrl: metadata.thumbnailUrl || '',
        youtubeMetadataError: metadata.metadataError || '',
        sourceId: source.id,
        sourceNumber: source.sourceNumber,
        sourceTitle: source.title,
      };
    });
    const fileAssets = (source.attachments || []).map((attachment) => ({
      ...attachment,
      sourceId: source.id,
      sourceNumber: source.sourceNumber,
      sourceTitle: source.title,
    }));

    return [...youtubeAssets, ...fileAssets];
  });
}

function getYoutubeAssetName(url, index) {
  try {
    const parsedUrl = new URL(url);
    const videoId = parsedUrl.hostname.includes('youtu.be')
      ? parsedUrl.pathname.replace('/', '').split('/')[0]
      : parsedUrl.searchParams.get('v');

    return videoId ? `YouTube video ${videoId}` : `YouTube video ${index + 1}`;
  } catch {
    return `YouTube video ${index + 1}`;
  }
}

function getYoutubeThumbnailUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const videoId = parsedUrl.hostname.includes('youtu.be')
      ? parsedUrl.pathname.replace('/', '').split('/')[0]
      : parsedUrl.searchParams.get('v');

    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
  } catch {
    return '';
  }
}

function useYouTubeAssetPreview(attachment) {
  const hasStoredMetadata = Boolean(
    attachment.youtubeTitle ||
      attachment.youtubeAuthorName ||
      attachment.youtubeThumbnailUrl
  );
  const [metadata, setMetadata] = useState(
    hasStoredMetadata
      ? {
          title: attachment.youtubeTitle,
          authorName: attachment.youtubeAuthorName,
          thumbnailUrl: attachment.youtubeThumbnailUrl,
        }
      : null
  );
  const [hasImageError, setHasImageError] = useState(false);
  const fallbackThumbnailUrl = getYoutubeThumbnailUrl(attachment.url);
  const thumbnailUrl = metadata?.thumbnailUrl || fallbackThumbnailUrl;

  useEffect(() => {
    let isMounted = true;

    async function loadMetadata() {
      try {
        const response = await fetch(
          `/api/youtube/oembed?url=${encodeURIComponent(attachment.url)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load YouTube metadata.');
        }

        if (isMounted) {
          setMetadata(data);
        }
      } catch (error) {
        console.error('Failed to load YouTube asset metadata:', error);
      }
    }

    if (attachment.url && !hasStoredMetadata) {
      loadMetadata();
    }

    return () => {
      isMounted = false;
    };
  }, [attachment.url, hasStoredMetadata]);

  return {
    title: metadata?.title || attachment.name,
    subtitle: metadata?.authorName || 'YouTube video',
    preview: thumbnailUrl && !hasImageError ? (
      <Box
        component="img"
        src={thumbnailUrl}
        alt=""
        onError={() => setHasImageError(true)}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    ) : (
      <SmartDisplayOutlinedIcon
        sx={{
          fontSize: 46,
          color: AI_DIGITAL_COLORS.yvesKleinBlue,
        }}
      />
    ),
  };
}

function LessonAssetCard({
  attachment,
  index,
  onOpenAttachment,
  onOpenSourceMaterial,
}) {
  const isYoutube = attachment.kind === 'youtube';
  const youtubeAsset = useYouTubeAssetPreview(attachment);
  const isImage = attachment.kind === 'image' || attachment.mimeType?.startsWith('image/');
  const badge = getFileBadge(attachment);
  const canOpen = Boolean(isYoutube || attachment.storageKey || onOpenSourceMaterial);
  const title = isYoutube ? youtubeAsset.title : attachment.name;

  return (
    <Box
      key={attachment.id || `${attachment.sourceId}-${attachment.name}-${index}`}
      component="button"
      type="button"
      disabled={!canOpen}
      onClick={() => onOpenAttachment(attachment)}
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
          backgroundColor: isYoutube
            ? hexToRgba(AI_DIGITAL_COLORS.yvesKleinBlue, 0.08)
            : '#f8fafc',
        }}
      >
        {isYoutube ? (
          youtubeAsset.preview
        ) : isImage && attachment.previewUrl ? (
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
        {title}
      </Typography>
      {isYoutube && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            width: '100%',
            maxWidth: 132,
            lineHeight: 1.1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {youtubeAsset.subtitle}
        </Typography>
      )}
      <OpenInNewOutlinedIcon sx={{ display: 'none' }} />
    </Box>
  );
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
  layout = 'grid',
  showTitle = true,
}) {
  const resolvedAttachments = attachments.length > 0
    ? attachments
    : getSourceAttachments(sourceReferences);

  const handleOpenAttachment = async (attachment) => {
    if (attachment.kind === 'youtube' && attachment.url) {
      window.open(attachment.url, '_blank', 'noopener,noreferrer');
      return;
    }

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
      {showTitle && (
        <Typography variant="h6" sx={{ fontWeight: 900, mb: 1.25 }}>
          Assets
        </Typography>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: layout === 'column'
            ? 'minmax(0, 136px)'
            : {
                xs: 'repeat(2, 136px)',
                sm: 'repeat(3, 136px)',
                md: 'repeat(4, 136px)',
                xl: 'repeat(5, 136px)',
              },
          gap: 1.5,
          justifyContent: layout === 'column'
            ? 'flex-start'
            : { xs: 'center', sm: 'flex-start' },
        }}
      >
        {resolvedAttachments.map((attachment, index) => (
          <LessonAssetCard
            key={attachment.id || `${attachment.sourceId}-${attachment.name}-${index}`}
            attachment={attachment}
            index={index}
            onOpenAttachment={handleOpenAttachment}
            onOpenSourceMaterial={onOpenSourceMaterial}
          />
        ))}
      </Box>
    </Box>
  );
}
