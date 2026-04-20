'use client';

import {
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';

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

function getLessonPreview(lesson) {
  if (lesson.contentHtml) {
    const plainHtmlText = lesson.contentHtml
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (plainHtmlText) {
      return plainHtmlText;
    }
  }

  const markdown = lesson.contentMarkdown || '';
  const withoutHeadings = markdown
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*/g, '')
    .trim();

  return withoutHeadings || lesson.description || 'Generated lesson preview will appear here.';
}

export default function LessonsGrid({ lessons = [], onOpenLesson }) {
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
      {lessons.map((lesson) => (
        <Paper
          key={lesson.id}
          elevation={0}
          onClick={() => onOpenLesson(lesson)}
          sx={{
            borderRadius: 4,
            border: '1px solid #e5e7eb',
            backgroundColor: '#fff',
            overflow: 'hidden',
            minHeight: 340,
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
              background:
                'linear-gradient(135deg, #0f766e 0%, #2563eb 48%, #f59e0b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.32), transparent 28%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.22), transparent 30%)',
              }}
            />
            <Stack spacing={1} sx={{ alignItems: 'center', zIndex: 1 }}>
              <ImageOutlinedIcon sx={{ fontSize: 34, opacity: 0.9 }} />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                Cover image coming soon
              </Typography>
            </Stack>
          </Box>

          <Box
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
            }}
          >
            <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: 'center' }}>
              <AutoStoriesOutlinedIcon fontSize="small" color="action" />
              <Chip
                label={lesson.status}
                color={getStatusColor(lesson.status)}
                size="small"
                variant="outlined"
              />
            </Stack>

            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                lineHeight: 1.25,
                mb: 1,
                display: '-webkit-box',
                overflow: 'hidden',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {lesson.title}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                display: '-webkit-box',
                overflow: 'hidden',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {getLessonPreview(lesson)}
            </Typography>

            <Stack spacing={0.75} sx={{ mt: 'auto' }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <PersonOutlineOutlinedIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary" noWrap>
                  Created by {lesson.createdBy || 'AI Onboarding'}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <ScheduleOutlinedIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  Created {formatDate(lesson.createdAt)}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
