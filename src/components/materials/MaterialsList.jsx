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
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import SmartDisplayOutlinedIcon from '@mui/icons-material/SmartDisplayOutlined';

function formatMaterialDate(isoString) {
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

export default function MaterialsList({ materials, onDeleteMaterial }) {
  return (
    <Stack spacing={2}>
      {materials.map((material) => {
        const isVideo = material.type === 'video';

        return (
          <Paper
            key={material.id}
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px solid #e5e7eb',
              backgroundColor: '#fff',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                gap: 2,
                flexDirection: { xs: 'column', md: 'row' },
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1,
                    flexWrap: 'wrap',
                  }}
                >
                  {isVideo ? (
                    <SmartDisplayOutlinedIcon fontSize="small" color="action" />
                  ) : (
                    <DescriptionOutlinedIcon fontSize="small" color="action" />
                  )}

                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {material.title}
                  </Typography>

                  <Chip
                    size="small"
                    label={isVideo ? 'Video' : 'Document'}
                    color={isVideo ? 'secondary' : 'primary'}
                    variant="outlined"
                  />
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1.5 }}
                >
                  {material.description}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    mb: 0.75,
                    wordBreak: 'break-word',
                  }}
                >
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    Source:
                  </Box>{' '}
                  {material.source}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  Added {formatMaterialDate(material.createdAt)}
                </Typography>
              </Box>

              <Box sx={{ flexShrink: 0 }}>
                <IconButton
                  aria-label={`Delete ${material.title}`}
                  onClick={() => onDeleteMaterial(material.id)}
                >
                  <DeleteOutlineOutlinedIcon />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        );
      })}
    </Stack>
  );
}