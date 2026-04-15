'use client';

import {
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import TextSnippetOutlinedIcon from '@mui/icons-material/TextSnippetOutlined';
import SmartDisplayOutlinedIcon from '@mui/icons-material/SmartDisplayOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';

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
  badges.push(`YouTube: ${material.youtubeUrls.length}`);
}

  if (material.links?.length) {
    badges.push(`Links: ${material.links.length}`);
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

export default function MaterialsGrid({
  materials,
  onDeleteMaterial,
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
        gap: 2,
      }}
    >
      {materials.map((material) => {
        const badges = getMaterialBadges(material);
        const imagePreview = material.attachments?.find(
          (item) => item.kind === 'image'
        );
        const firstYoutubeUrl = material.youtubeUrls?.[0] || '';
        const youtubeThumbnail = firstYoutubeUrl
            ? getYoutubeThumbnail(firstYoutubeUrl)
            : null;

        return (
          <Paper
            key={material.id}
            elevation={0}
            onClick={() => onOpenMaterial(material)}
            sx={{
              borderRadius: 4,
              border: '1px solid #e5e7eb',
              backgroundColor: '#fff',
              overflow: 'hidden',
              minHeight: 320,
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
              },
            }}
          >
          <Box
            sx={{
                height: 160,
                borderBottom: '1px solid #eef2f7',
                backgroundColor: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
            }}
          >
            {imagePreview ? (
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
            ) : youtubeThumbnail ? (
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
            ) : (
                <Stack
                spacing={1}
                sx={{
                    alignItems: 'center',
                }}
                >
                <DescriptionOutlinedIcon color="disabled" />
                <Typography variant="body2" color="text.secondary">
                    Material Preview
                </Typography>
                </Stack>
            )}
            </Box>

            <Box
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 1,
                  mb: 1,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    overflow: 'hidden',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {material.title}
                </Typography>

                <IconButton
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteMaterial(material.id);
                  }}
                >
                  <DeleteOutlineOutlinedIcon fontSize="small" />
                </IconButton>
              </Box>

              {material.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 1.5,
                    display: '-webkit-box',
                    overflow: 'hidden',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    minHeight: 60,
                  }}
                >
                  {material.description}
                </Typography>
              )}

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
                  <Chip key={badge} label={badge} size="small" />
                ))}
              </Stack>

              <Stack spacing={0.75} sx={{ mb: 2 }}>
                {material.youtubeUrls?.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SmartDisplayOutlinedIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary" noWrap>
                    {material.youtubeUrls.length} YouTube video(s)
                    </Typography>
                </Box>
                )}
                {material.links?.length > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinkOutlinedIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {material.links.length} link(s)
                    </Typography>
                  </Box>
                )}

                {material.text && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextSnippetOutlinedIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary" noWrap>
                      Text included
                    </Typography>
                  </Box>
                )}

                {material.attachments?.some((item) => item.kind === 'file') && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionOutlinedIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary" noWrap>
                      File attached
                    </Typography>
                  </Box>
                )}

                {material.attachments?.some((item) => item.kind === 'image') && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ImageOutlinedIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary" noWrap>
                      Image attached
                    </Typography>
                  </Box>
                )}
              </Stack>

              <Box sx={{ mt: 'auto' }}>
                <Typography variant="caption" color="text.secondary">
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
