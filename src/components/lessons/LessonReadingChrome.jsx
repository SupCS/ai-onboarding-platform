'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';

function slugify(value, fallback) {
  const slug = (value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '');

  return slug || fallback;
}

function getInitials(name) {
  const parts = (name || 'AI Digital')
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AI';
}

function formatDate(value) {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function SectionIcon({ index }) {
  if (index % 3 === 1) {
    return <GridViewOutlinedIcon sx={{ fontSize: 15 }} />;
  }

  if (index % 3 === 2) {
    return <NotesOutlinedIcon sx={{ fontSize: 15 }} />;
  }

  return <ArticleOutlinedIcon sx={{ fontSize: 15 }} />;
}

export default function LessonReadingChrome({
  lesson,
  roadmapContext,
  lessonNavigation,
  children,
}) {
  const contentRef = useRef(null);
  const sectionsRef = useRef([]);
  const maxProgressRef = useRef(0);
  const pendingActiveIdRef = useRef('');
  const pendingScrollTargetRef = useRef(null);
  const pendingScrollTimeoutRef = useRef(null);
  const [sections, setSections] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [progress, setProgress] = useState(0);

  const authorName = lesson.createdBy || 'AI Digital';
  const updatedDate = formatDate(lesson.updatedAt || lesson.publishedAt || lesson.createdAt);
  const eyebrow = roadmapContext
    ? `Lesson - ${String(roadmapContext.lessonNumber).padStart(2, '0')} of ${roadmapContext.title}`
    : 'Lesson';

  const sectionItems = useMemo(() => sections.slice(0, 12), [sections]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [lesson.id]);

  useEffect(() => {
    const root = contentRef.current;

    if (!root) {
      return undefined;
    }

    const headings = Array.from(root.querySelectorAll('.lesson-reader h2, .lesson-reader h3'));
    const usedIds = new Set();
    const items = headings.map((heading, index) => {
      const label = heading.textContent?.trim() || `Section ${index + 1}`;
      let id = heading.id || slugify(label, `section-${index + 1}`);
      let suffix = 2;

      while (usedIds.has(id)) {
        id = `${id}-${suffix}`;
        suffix += 1;
      }

      usedIds.add(id);
      heading.id = id;

      return {
        id,
        label,
        level: heading.tagName.toLowerCase() === 'h3' ? 3 : 2,
      };
    });

    sectionsRef.current = items;
    maxProgressRef.current = 0;
    setSections(items);
    setActiveId(items[0]?.id || '');
    setProgress(0);
    return undefined;
  }, [children]);

  useEffect(() => {
    let animationFrameId = null;

    const updateReadingState = () => {
      const root = contentRef.current;

      if (!root) {
        return;
      }

      const rect = root.getBoundingClientRect();
      const total = Math.max(1, rect.height - window.innerHeight * 0.72);
      const read = Math.min(Math.max(-rect.top + window.innerHeight * 0.12, 0), total);
      const pageBottomReached =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
      const nextProgress = pageBottomReached ? 100 : Math.round((read / total) * 100);

      maxProgressRef.current = Math.max(maxProgressRef.current, nextProgress);
      setProgress(maxProgressRef.current);

      if (
        pendingActiveIdRef.current &&
        pendingScrollTargetRef.current !== null
      ) {
        const reachedTarget = Math.abs(window.scrollY - pendingScrollTargetRef.current) < 8;

        if (reachedTarget) {
          pendingActiveIdRef.current = '';
          pendingScrollTargetRef.current = null;
        } else {
          setActiveId(pendingActiveIdRef.current);
          return;
        }
      }

      const currentSections = sectionsRef.current;

      if (currentSections.length > 0) {
        const markerTop = 150;
        const sectionHeadings = currentSections
          .map((section) => document.getElementById(section.id))
          .filter(Boolean);
        const currentHeading = sectionHeadings.reduce((current, heading) => {
          if (heading.getBoundingClientRect().top <= markerTop) {
            return heading;
          }

          return current;
        }, sectionHeadings[0]);

        if (currentHeading?.id) {
          setActiveId(currentHeading.id);
        }
      }
    };

    const scheduleUpdate = () => {
      if (animationFrameId) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = null;
        updateReadingState();
      });
    };

    updateReadingState();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }

      if (pendingScrollTimeoutRef.current) {
        window.clearTimeout(pendingScrollTimeoutRef.current);
      }

      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);

    if (!element) {
      return;
    }

    setActiveId(id);

    const targetTop = element.getBoundingClientRect().top + window.scrollY - 132;
    const normalizedTargetTop = Math.max(0, targetTop);

    pendingActiveIdRef.current = id;
    pendingScrollTargetRef.current = normalizedTargetTop;

    if (pendingScrollTimeoutRef.current) {
      window.clearTimeout(pendingScrollTimeoutRef.current);
    }

    pendingScrollTimeoutRef.current = window.setTimeout(() => {
      pendingActiveIdRef.current = '';
      pendingScrollTargetRef.current = null;
    }, 900);

    window.scrollTo({
      top: normalizedTargetTop,
      behavior: 'smooth',
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        pl: { xs: 0, lg: '248px' },
        overflowX: 'hidden',
      }}
    >
      <Box
        component="aside"
        sx={{
          display: { xs: 'none', lg: 'flex' },
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 1200,
          width: 248,
          height: '100vh',
          flexDirection: 'column',
          borderRight: '1px solid rgba(0, 9, 220, 0.12)',
          backgroundColor: 'rgba(255,255,255,0.92)',
          overflow: 'hidden',
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', p: 2 }}>
          <Button
            component={Link}
            href="/lessons"
            aria-label="Back to lessons"
            variant="outlined"
            color="inherit"
            sx={{
              minWidth: 32,
              width: 32,
              height: 32,
              p: 0,
              borderRadius: 1.5,
              borderColor: 'rgba(0, 9, 220, 0.16)',
              color: '#0009DC',
            }}
          >
            <ArrowBackOutlinedIcon sx={{ fontSize: 17 }} />
          </Button>
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: '#80808E',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.1em',
                lineHeight: 1,
                textTransform: 'uppercase',
              }}
            >
              {roadmapContext ? `Lesson - ${String(roadmapContext.lessonNumber).padStart(2, '0')}` : 'Lesson'}
            </Typography>
            <Typography
              sx={{
                color: '#0B0B0B',
                fontSize: 13,
                fontWeight: 800,
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {lesson.title}
            </Typography>
          </Stack>
        </Stack>

        <Typography
          sx={{
            px: 2,
            pt: 1,
            pb: 0.75,
            color: '#80808E',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Sections
        </Typography>

        <Stack component="nav" spacing={0.25} sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 1.25 }}>
          {sectionItems.length === 0 ? (
            <Typography sx={{ px: 1, py: 1, color: '#80808E', fontSize: 12 }}>
              Sections will appear here.
            </Typography>
          ) : sectionItems.map((section, index) => {
            const active = section.id === activeId;

            return (
              <Button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                startIcon={<SectionIcon index={index} />}
                sx={{
                  justifyContent: 'flex-start',
                  gap: 0.75,
                  minHeight: 34,
                  px: 1.25,
                  ml: section.level === 3 ? 1.5 : 0,
                  borderRadius: 1.5,
                  color: active ? '#0009DC' : '#667085',
                  backgroundColor: active ? 'rgba(0, 9, 220, 0.08)' : 'transparent',
                  fontSize: 12,
                  fontWeight: active ? 800 : 600,
                  letterSpacing: 0,
                  textTransform: 'none',
                  '& .MuiButton-startIcon': {
                    mr: 0.25,
                    color: 'inherit',
                  },
                  '&:hover': {
                    backgroundColor: active ? 'rgba(0, 9, 220, 0.1)' : 'rgba(15, 23, 42, 0.04)',
                  },
                }}
              >
                <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {section.label}
                </Box>
              </Button>
            );
          })}
        </Stack>

        <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 9, 220, 0.1)' }}>
          <Typography
            sx={{
              mb: 1,
              color: '#80808E',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Progress
          </Typography>
          <Box sx={{ height: 4, borderRadius: 999, overflow: 'hidden', backgroundColor: 'rgba(0, 9, 220, 0.1)' }}>
            <Box sx={{ width: `${progress}%`, height: '100%', backgroundColor: '#0009DC' }} />
          </Box>
          <Typography sx={{ mt: 0.75, color: '#667085', fontSize: 11, fontWeight: 700 }}>
            {progress}% read
          </Typography>
        </Box>
      </Box>

      <Box
        component="article"
        ref={contentRef}
        sx={{
          minWidth: 0,
          maxWidth: 1180,
          width: '100%',
          mx: 'auto',
          px: { xs: 2, md: 5 },
          py: { xs: 2, md: 5 },
        }}
      >
        <Box
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            border: '1px solid rgba(0, 9, 220, 0.1)',
            borderRadius: { xs: 3, md: 4 },
            boxShadow: '0 28px 80px rgba(15, 23, 42, 0.10)',
            px: { xs: 2.5, md: 7 },
            py: { xs: 3.5, md: 7 },
          }}
        >
          <Button
            component={Link}
            href="/lessons"
            variant="outlined"
            color="inherit"
            startIcon={<ArrowBackOutlinedIcon />}
            sx={{
              display: { xs: 'inline-flex', lg: 'none' },
              mb: 3,
              borderRadius: 999,
              borderColor: 'rgba(0, 9, 220, 0.18)',
              backgroundColor: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(10px)',
              color: '#0009DC',
              fontWeight: 800,
              textTransform: 'none',
            }}
          >
            Back to My Lessons
          </Button>

          <Stack spacing={1.5} sx={{ mb: { xs: 4, md: 6 } }}>
            <Typography
              sx={{
                color: '#0009DC',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {eyebrow}
            </Typography>
            <Typography
              component="h1"
              sx={{
                color: '#0B0B0B',
                fontFamily: '"Barlow Semi Condensed", Inter, Arial, sans-serif',
                fontSize: { xs: 52, md: 82 },
                fontWeight: 900,
                letterSpacing: 0,
                lineHeight: 0.92,
              }}
            >
              {lesson.title}
            </Typography>
            {lesson.description && (
              <Typography
                sx={{
                  maxWidth: 660,
                  color: '#4C5065',
                  fontSize: { xs: 18, md: 23 },
                  lineHeight: 1.38,
                }}
              >
                {lesson.description}
              </Typography>
            )}
          </Stack>

          <Stack
            direction="row"
            spacing={2}
            sx={{
              alignItems: 'center',
              mb: { xs: 4, md: 6 },
              py: 2.5,
              borderTop: '1px solid rgba(0, 9, 220, 0.16)',
              borderBottom: '1px solid rgba(0, 9, 220, 0.16)',
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                flex: '0 0 auto',
                display: 'grid',
                placeItems: 'center',
                borderRadius: '50%',
                backgroundColor: '#0B0B0B',
                color: '#fff',
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              {getInitials(authorName)}
            </Box>
            <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ color: '#0B0B0B', fontSize: 14, fontWeight: 800 }}>
                {authorName}
              </Typography>
              <Typography sx={{ color: '#80808E', fontSize: 12, fontWeight: 600 }}>
                {updatedDate ? `Updated ${updatedDate}` : 'Lesson author'}
              </Typography>
            </Stack>
            <Chip
              label="Internal"
              sx={{
                height: 28,
                borderRadius: 999,
                backgroundColor: '#F235A8',
                color: '#fff',
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            />
          </Stack>

          {children}

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{
              mt: { xs: 5, md: 7 },
              pt: 4,
              borderTop: '1px solid rgba(0, 9, 220, 0.16)',
              alignItems: 'stretch',
              justifyContent: 'space-between',
            }}
          >
            <Button
              component={lessonNavigation?.previous ? Link : 'button'}
              href={lessonNavigation?.previous ? `/lessons/${lessonNavigation.previous.id}` : undefined}
              disabled={!lessonNavigation?.previous}
              startIcon={<ArrowBackOutlinedIcon />}
              variant="outlined"
              color="inherit"
              sx={{
                minHeight: 48,
                px: 2.75,
                borderRadius: 999,
                borderColor: 'rgba(0, 9, 220, 0.2)',
                color: '#0009DC',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                justifyContent: 'center',
                '&:hover': {
                  borderColor: 'rgba(0, 9, 220, 0.34)',
                  backgroundColor: '#F5F5FE',
                },
              }}
            >
              Previous lesson
            </Button>

            <Button
              component={lessonNavigation?.next ? Link : 'button'}
              href={lessonNavigation?.next ? `/lessons/${lessonNavigation.next.id}` : undefined}
              disabled={!lessonNavigation?.next}
              endIcon={<ArrowForwardOutlinedIcon />}
              variant="contained"
              sx={{
                minHeight: 48,
                px: 3,
                borderRadius: 999,
                backgroundColor: '#0009DC',
                boxShadow: 'none',
                color: '#fff',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                justifyContent: 'center',
                '&:hover': {
                  backgroundColor: '#0007B8',
                  boxShadow: 'none',
                },
                '&.Mui-disabled': {
                  backgroundColor: '#F2F1F3',
                  color: '#80808E',
                },
              }}
            >
              Next lesson
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
