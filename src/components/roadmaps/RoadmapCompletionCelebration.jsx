'use client';

import { useEffect } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import { confetti } from '@tsparticles/confetti';
import { confettiColors } from './ConfettiBurst';

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function getCelebrationTitle(roadmaps = []) {
  if (roadmaps.length === 1) {
    return roadmaps[0].title;
  }

  return `${roadmaps.length} roadmaps completed`;
}

export default function RoadmapCompletionCelebration({
  active = false,
  roadmaps = [],
}) {
  useEffect(() => {
    if (!active) {
      return undefined;
    }

    const duration = 9000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 34,
      spread: 360,
      ticks: 90,
      zIndex: 2300,
      colors: confettiColors,
      shapes: ['square', 'circle', 'star'],
      scalar: 1,
      disableForReducedMotion: true,
    };

    const intervalId = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        window.clearInterval(intervalId);
        return;
      }

      const count = Math.max(12, Math.round(70 * (timeLeft / duration)));

      confetti({
        ...defaults,
        count,
        position: {
          x: randomInRange(10, 30),
          y: randomInRange(-20, 35),
        },
      });
      confetti({
        ...defaults,
        count,
        position: {
          x: randomInRange(70, 90),
          y: randomInRange(-20, 35),
        },
      });
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [active]);

  if (!active) {
    return null;
  }

  return (
    <Box
      aria-live="polite"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 2250,
        pointerEvents: 'none',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        background:
          'radial-gradient(circle at center, rgba(16, 185, 129, 0.14), transparent 36%)',
        '@keyframes roadmapCelebrationIn': {
          '0%': {
            opacity: 0,
            transform: 'translateY(16px) scale(0.96)',
          },
          '14%': {
            opacity: 1,
            transform: 'translateY(0) scale(1)',
          },
          '82%': {
            opacity: 1,
            transform: 'translateY(0) scale(1)',
          },
          '100%': {
            opacity: 0,
            transform: 'translateY(-10px) scale(0.98)',
          },
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: 'min(560px, 100%)',
          p: { xs: 3, md: 4 },
          borderRadius: 4,
          border: '1px solid rgba(16, 185, 129, 0.24)',
          textAlign: 'center',
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(240,253,250,0.96) 100%)',
          boxShadow: '0 28px 90px rgba(4, 120, 87, 0.24)',
          animation: 'roadmapCelebrationIn 6.2s ease forwards',
          backdropFilter: 'blur(14px)',
        }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            mx: 'auto',
            mb: 2,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            background: 'linear-gradient(135deg, #047857 0%, #00E676 100%)',
            boxShadow: '0 18px 36px rgba(16, 185, 129, 0.3)',
          }}
        >
          <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 42 }} />
        </Box>

        <Typography
          variant="overline"
          sx={{
            color: '#047857',
            fontWeight: 950,
            letterSpacing: 0,
          }}
        >
          Roadmap Completed
        </Typography>

        <Typography
          variant="h3"
          sx={{
            mt: 0.5,
            fontWeight: 950,
            lineHeight: 1,
            color: '#0f172a',
          }}
        >
          {getCelebrationTitle(roadmaps)}
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mt: 2, fontWeight: 600 }}
        >
          Nice work. Every lesson in this roadmap is complete.
        </Typography>

        <Typography
          variant="h6"
          sx={{
            mt: 2.5,
            color: '#047857',
            fontWeight: 950,
          }}
        >
          100% complete
        </Typography>
      </Paper>
    </Box>
  );
}
