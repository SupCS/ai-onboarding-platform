'use client';

import {
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import TextSnippetOutlinedIcon from '@mui/icons-material/TextSnippetOutlined';
import SmartDisplayOutlinedIcon from '@mui/icons-material/SmartDisplayOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { AI_DIGITAL_COLORS } from '../../lib/brandColors';

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

function getMaterialBadges(material) {
  const badges = [];

if (material.youtubeUrls?.length) {
  badges.push('YouTube');
}

  if (material.links?.length) {
    badges.push('Links');
  }

  if (material.text) {
    badges.push('Text');
  }

  if (material.attachments?.some((item) => item.kind === 'file')) {
    badges.push('Files');
  }

  if (material.attachments?.some((item) => item.kind === 'image')) {
    badges.push('Images');
  }

  return badges;
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

function getYoutubeThumbnail(url) {
  const videoId = extractYoutubeVideoId(url);

  if (!videoId) {
    return null;
  }

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function getFilePreviewLabel(attachment) {
  const fileName = attachment?.name || '';
  const extension = fileName.includes('.')
    ? fileName.split('.').pop()?.toUpperCase()
    : '';

  if (extension) {
    return extension;
  }

  if (attachment?.mimeType) {
    return attachment.mimeType.split('/').pop()?.toUpperCase() || 'FILE';
  }

  return 'FILE';
}

function getMaterialMetaItems(material) {
  const items = [];

  if (material.youtubeUrls?.length > 0) {
    items.push({
      key: 'youtube',
      icon: <SmartDisplayOutlinedIcon fontSize="small" color="action" />,
      label: `${material.youtubeUrls.length} YouTube video(s)`,
    });
  }

  if (material.links?.length > 0) {
    items.push({
      key: 'links',
      icon: <LinkOutlinedIcon fontSize="small" color="action" />,
      label: `${material.links.length} link(s)`,
    });
  }

  if (material.text) {
    items.push({
      key: 'text',
      icon: <TextSnippetOutlinedIcon fontSize="small" color="action" />,
      label: 'Text included',
    });
  }

  if (material.attachments?.some((item) => item.kind === 'file')) {
    items.push({
      key: 'files',
      icon: <DescriptionOutlinedIcon fontSize="small" color="action" />,
      label: 'File attached',
    });
  }

  if (material.attachments?.some((item) => item.kind === 'image')) {
    items.push({
      key: 'images',
      icon: <ImageOutlinedIcon fontSize="small" color="action" />,
      label: 'Image attached',
    });
  }

  return items;
}

export default function MaterialsGrid({
  materials,
  onOpenMaterial,
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
        xs: '1fr',
        sm: 'repeat(2, minmax(0, 1fr))',
        md: 'repeat(3, minmax(0, 1fr))',
        lg: 'repeat(4, minmax(0, 1fr))',
        xl: 'repeat(5, minmax(0, 1fr))',
        },
        gap: 2.5,
      }}
    >
      {materials.map((material) => {
        const badges = getMaterialBadges(material);
        const tags = Array.isArray(material.tags) ? material.tags : [];
        const metaItems = getMaterialMetaItems(material);
        const firstYoutubeUrl = material.youtubeUrls?.[0] || '';
        const youtubeThumbnail = firstYoutubeUrl
          ? getYoutubeThumbnail(firstYoutubeUrl)
          : null;
        const linkPreview = material.linkAssets?.find((item) => item.imageUrl) ||
          material.linkAssets?.[0] ||
          null;
        const imagePreview = material.attachments?.find(
          (item) => item.kind === 'image'
        );
        const filePreview = material.attachments?.find(
          (item) => item.kind === 'file'
        );

        return (
          <Paper
            key={material.id}
            elevation={0}
            onClick={() => onOpenMaterial(material)}
            sx={{
              borderRadius: 1.75,
              border: '1px solid rgba(0, 9, 220, 0.12)',
              backgroundColor: '#fff',
              minHeight: 332,
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              cursor: 'pointer',
              transition: 'border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                borderColor: 'rgba(0, 9, 220, 0.28)',
                boxShadow: '0 18px 40px rgba(11, 11, 11, 0.08)',
              },
            }}
          >
          <Box
            sx={{
                aspectRatio: '16 / 10',
                borderRadius: 1.25,
                border: '1px solid rgba(0, 9, 220, 0.12)',
                backgroundColor: '#F5F5FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
            }}
          >
            {youtubeThumbnail ? (
              <Box
                component="img"
                src={youtubeThumbnail}
                alt={material.title}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : linkPreview?.imageUrl ? (
              <Box
                component="img"
                src={linkPreview.imageUrl}
                alt={linkPreview.title || material.title}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : imagePreview ? (
                <Box
                component="img"
                src={imagePreview.previewUrl}
                alt={material.title}
                sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                }}
                />
            ) : linkPreview ? (
              <Stack
                spacing={1}
                sx={{
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 2,
                  textAlign: 'center',
                  backgroundColor: '#F5F5FE',
                }}
              >
                <LinkOutlinedIcon sx={{ fontSize: 42, color: AI_DIGITAL_COLORS.yvesKleinBlue }} />
                <Typography
                  variant="body2"
                  sx={{
                    maxWidth: '100%',
                    fontWeight: 800,
                    color: '#0B0B0B',
                    display: '-webkit-box',
                    overflow: 'hidden',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    wordBreak: 'break-word',
                  }}
                >
                  {linkPreview.title || linkPreview.siteName || 'Web link'}
                </Typography>
                {(linkPreview.siteName || linkPreview.description) && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      maxWidth: '100%',
                      display: '-webkit-box',
                      overflow: 'hidden',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      wordBreak: 'break-word',
                    }}
                  >
                    {linkPreview.siteName || linkPreview.description}
                  </Typography>
                )}
              </Stack>
            ) : filePreview ? (
              <Stack
                spacing={1}
                sx={{
                  alignItems: 'center',
                  px: 2,
                }}
              >
                <DescriptionOutlinedIcon color="action" sx={{ fontSize: 42 }} />
                <Chip
                  label={getFilePreviewLabel(filePreview)}
                  size="small"
                  sx={{
                    borderRadius: 999,
                    backgroundColor: '#F5F5FE',
                    color: AI_DIGITAL_COLORS.yvesKleinBlue,
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    textAlign: 'center',
                    display: '-webkit-box',
                    overflow: 'hidden',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    wordBreak: 'break-word',
                  }}
                >
                  {filePreview.name}
                </Typography>
              </Stack>
            ) : (
                <Stack
                spacing={1}
                sx={{
                    alignItems: 'center',
                }}
                >
                <DescriptionOutlinedIcon sx={{ color: '#80808E' }} />
                <Typography variant="body2" sx={{ color: '#80808E', fontSize: 12 }}>
                    Material preview
                </Typography>
                </Stack>
            )}
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  mb: 1,
                }}
              >
                <Typography
                  component="h3"
                  sx={{
                    color: '#0B0B0B',
                    fontSize: 16,
                    fontWeight: 700,
                    lineHeight: 1.3,
                    letterSpacing: 0,
                    display: '-webkit-box',
                    overflow: 'hidden',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {material.title}
                </Typography>
              </Box>

              {material.description && (
                <Typography
                  variant="body2"
                  sx={{
                    color: '#33344A',
                    fontSize: 13,
                    lineHeight: 1.45,
                    mb: 1.5,
                    display: '-webkit-box',
                    overflow: 'hidden',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {material.description}
                </Typography>
              )}

              {tags.length > 0 && (
                <Stack
                  direction="row"
                  spacing={0.75}
                  useFlexGap
                  sx={{
                    flexWrap: 'wrap',
                    mb: 1.5,
                  }}
                >
                  {tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{
                        height: 24,
                        borderRadius: 999,
                        backgroundColor: '#F2F1F3',
                        color: '#33344A',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    />
                  ))}
                </Stack>
              )}

              {badges.length > 0 && (
                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  sx={{
                    flexWrap: 'wrap',
                    mb: 1.5,
                  }}
                >
                  {badges.map((badge) => (
                    <Chip
                      key={badge}
                      label={badge}
                      size="small"
                      sx={{
                        height: 24,
                        borderRadius: 999,
                        backgroundColor: '#F5F5FE',
                        color: AI_DIGITAL_COLORS.yvesKleinBlue,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    />
                  ))}
                </Stack>
              )}

              {metaItems.length > 0 && (
                <Stack spacing={0.75} sx={{ mb: 2 }}>
                  {metaItems.map((item) => (
                    <Box
                      key={item.key}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}
                    >
                      {item.icon}
                      <Typography variant="caption" sx={{ color: '#80808E' }} noWrap>
                        {item.label}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}

              <Box
                sx={{
                  mt: 'auto',
                  pt: 1.5,
                  borderTop: '1px solid rgba(0, 9, 220, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    minWidth: 0,
                    color: '#33344A',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                  noWrap
                >
                  By {material.createdBy || 'Unknown author'}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    flexShrink: 0,
                    color: '#80808E',
                    fontSize: 12,
                  }}
                >
                  Added {formatDate(material.createdAt)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
}
