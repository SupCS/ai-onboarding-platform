'use client';

import { useState } from 'react';
import {
  Box,
  Chip,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import TextSnippetOutlinedIcon from '@mui/icons-material/TextSnippetOutlined';
import SmartDisplayOutlinedIcon from '@mui/icons-material/SmartDisplayOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { AI_DIGITAL_COLORS } from '../../lib/brandColors';

const CARD_TOKENS = {
  ink: '#0B0B0B',
  slate: '#33344A',
  mute: '#80808E',
  blue: '#0009DC',
  blue50: '#F5F5FE',
  blue100: '#E5E5FA',
  blue200: '#C7C7F0',
  bg3: '#F2F1F3',
};

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
  const [expandedTagMaterialIds, setExpandedTagMaterialIds] = useState(() => new Set());

  const toggleExpandedTags = (event, materialId) => {
    event.preventDefault();
    event.stopPropagation();

    setExpandedTagMaterialIds((prev) => {
      const next = new Set(prev);

      if (next.has(materialId)) {
        next.delete(materialId);
      } else {
        next.add(materialId);
      }

      return next;
    });
  };

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
        gap: 2,
      }}
    >
      {materials.map((material) => {
        const badges = getMaterialBadges(material);
        const tags = Array.isArray(material.tags) ? material.tags : [];
        const areTagsExpanded = expandedTagMaterialIds.has(material.id);
        const visibleTags = areTagsExpanded ? tags : tags.slice(0, 2);
        const hiddenTagCount = Math.max(tags.length - 2, 0);
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
              borderRadius: '14px',
              border: `1px solid ${CARD_TOKENS.blue100}`,
              backgroundColor: '#fff',
              minHeight: 400,
              p: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              cursor: 'pointer',
              transition: 'transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                borderColor: CARD_TOKENS.blue200,
                boxShadow: '0 12px 32px rgba(11, 11, 11, 0.08)',
              },
            }}
          >
          <Box
            sx={{
                aspectRatio: '16 / 8',
                borderRadius: '10px',
                backgroundColor: CARD_TOKENS.blue50,
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
                  backgroundColor: CARD_TOKENS.blue50,
                }}
              >
                <LinkOutlinedIcon sx={{ fontSize: 42, color: AI_DIGITAL_COLORS.yvesKleinBlue }} />
                <Typography
                  variant="body2"
                  sx={{
                    maxWidth: '100%',
                    fontWeight: 800,
                    color: CARD_TOKENS.ink,
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
                    backgroundColor: CARD_TOKENS.blue50,
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
                <Typography variant="body2" sx={{ color: CARD_TOKENS.mute, fontSize: 12 }}>
                    Material preview
                </Typography>
                </Stack>
            )}
            </Box>

                <Typography
                  component="h3"
                  sx={{
                    mx: 0.5,
                    mt: 0.5,
                    mb: 0,
                    color: CARD_TOKENS.ink,
                    fontSize: 16,
                    fontWeight: 700,
                    lineHeight: 1.3,
                    letterSpacing: '-0.01em',
                    display: '-webkit-box',
                    overflow: 'hidden',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    textWrap: 'balance',
                  }}
                >
                  {material.title}
                </Typography>

              {material.description && (
                <Typography
                  sx={{
                    mx: 0.5,
                    color: CARD_TOKENS.slate,
                    fontSize: 12,
                    lineHeight: 1.5,
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
                  spacing={0.625}
                  useFlexGap
                  sx={{
                    flexWrap: 'wrap',
                    px: 0.5,
                  }}
                >
                  {visibleTags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{
                        height: 23,
                        maxWidth: '100%',
                        borderRadius: 999,
                        border: `1px solid ${CARD_TOKENS.blue100}`,
                        backgroundColor: '#fff',
                        color: CARD_TOKENS.slate,
                        fontSize: 11,
                        fontWeight: 600,
                        '& .MuiChip-label': {
                          px: 1.1,
                        },
                      }}
                    />
                  ))}
                  {hiddenTagCount > 0 && !areTagsExpanded && (
                    <Chip
                      label={`+${hiddenTagCount} more`}
                      size="small"
                      onClick={(event) => toggleExpandedTags(event, material.id)}
                      sx={{
                        height: 23,
                        borderRadius: 999,
                        backgroundColor: CARD_TOKENS.bg3,
                        color: CARD_TOKENS.mute,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: CARD_TOKENS.blue50,
                        },
                      }}
                    />
                  )}
                  {hiddenTagCount > 0 && areTagsExpanded && (
                    <Chip
                      label="Less"
                      size="small"
                      onClick={(event) => toggleExpandedTags(event, material.id)}
                      sx={{
                        height: 23,
                        borderRadius: 999,
                        backgroundColor: CARD_TOKENS.bg3,
                        color: CARD_TOKENS.mute,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: CARD_TOKENS.blue50,
                        },
                      }}
                    />
                  )}
                </Stack>
              )}

              {badges.length > 0 && (
                <Stack
                  direction="row"
                  spacing={0.75}
                  useFlexGap
                  sx={{
                    flexWrap: 'wrap',
                    px: 0.5,
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
                        backgroundColor: CARD_TOKENS.blue50,
                        color: CARD_TOKENS.blue,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    />
                  ))}
                </Stack>
              )}

              {metaItems.length > 0 && (
                <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', px: 0.5 }}>
                  {metaItems.slice(0, 2).map((item) => (
                    <Chip
                      key={item.key}
                      icon={item.icon}
                      label={item.label}
                      size="small"
                      sx={{
                        height: 24,
                        maxWidth: '100%',
                        borderRadius: 999,
                        backgroundColor: CARD_TOKENS.blue50,
                        color: CARD_TOKENS.blue,
                        fontSize: 11,
                        fontWeight: 600,
                        '& .MuiChip-icon': {
                          color: 'inherit',
                          fontSize: 13,
                          ml: 0.9,
                          mr: -0.4,
                        },
                      }}
                    />
                  ))}
                  {metaItems.length > 2 && (
                    <Chip
                      label={`+${metaItems.length - 2} sources`}
                      size="small"
                      sx={{
                        height: 24,
                        borderRadius: 999,
                        backgroundColor: CARD_TOKENS.bg3,
                        color: CARD_TOKENS.mute,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    />
                  )}
                </Stack>
              )}

              <Stack
                direction="row"
                sx={{
                  mt: 'auto',
                  mx: 0.5,
                  pt: 1.5,
                  pb: 0.5,
                  borderTop: `1px solid ${CARD_TOKENS.blue100}`,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                  minWidth: 0,
                }}
              >
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{
                    minWidth: 0,
                    flex: '1 1 auto',
                    alignItems: 'center',
                    color: CARD_TOKENS.mute,
                    fontSize: 11,
                  }}
                >
                  <Tooltip title={material.createdBy || 'Unknown author'} enterDelay={400}>
                    <Typography
                      component="span"
                      sx={{
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'inherit',
                        fontSize: 'inherit',
                      }}
                    >
                      {material.createdBy || 'Unknown author'}
                    </Typography>
                  </Tooltip>
                  <Typography
                    component="span"
                    sx={{
                      flexShrink: 0,
                      color: 'inherit',
                      fontSize: 'inherit',
                    }}
                  >
                    - {formatDate(material.createdAt)}
                  </Typography>
                </Stack>
              </Stack>
          </Paper>
        );
      })}
    </Box>
  );
}
