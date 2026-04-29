import Image from 'next/image';
import { Box, Button, Stack, Typography } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { AI_DIGITAL_COLORS } from '../lib/brandColors';

export const metadata = {
  title: '404 | AI Onboarding Platform',
};

export default function NotFound() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        px: { xs: 2, sm: 4, md: 7 },
        py: { xs: 2, md: 4 },
        background: AI_DIGITAL_COLORS.silverHaze,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 2.5, sm: 3, md: 6, lg: 7 }}
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          width: 'min(100%, 1120px)',
          textAlign: { xs: 'center', md: 'left' },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            flex: '0 0 auto',
            width: { xs: 'min(78vw, 340px)', sm: 'min(58vw, 460px)', md: 500, lg: 560 },
            maxHeight: { xs: '46vh', md: '72vh' },
            aspectRatio: '1744 / 1463',
            filter: 'drop-shadow(0 18px 28px rgba(0, 9, 220, 0.16))',
          }}
        >
          <Image
            src="/not-found-dog-cropped.png"
            alt="A blue line-art dog looking a little guilty"
            fill
            priority
            sizes="(max-width: 600px) 78vw, 560px"
            style={{ objectFit: 'contain' }}
          />
        </Box>

        <Box
          sx={{
            flex: '0 1 500px',
            width: { xs: '100%', md: 'auto' },
            display: 'flex',
            flexDirection: 'column',
            alignItems: { xs: 'center', md: 'flex-start' },
          }}
        >
          <Typography
            variant="h1"
            sx={{
              color: AI_DIGITAL_COLORS.yvesKleinBlue,
              fontWeight: 950,
              lineHeight: 0.9,
              letterSpacing: 0,
              '& span': {
                display: 'block',
              },
              '& .oopsie': {
                fontSize: { xs: '3.4rem', sm: '5.1rem', md: '6.2rem', lg: '7rem' },
                lineHeight: 0.86,
              },
              '& .poopsie': {
                fontSize: { xs: '2.7rem', sm: '4.1rem', md: '5rem', lg: '5.7rem' },
                lineHeight: 0.9,
              },
              '& .code': {
                fontSize: { xs: '1.9rem', sm: '2.8rem', md: '3.3rem', lg: '3.7rem' },
                lineHeight: 1,
              },
            }}
          >
            <span className="oopsie">Oopsie</span>
            <span className="poopsie">Poopsie</span>
            <span className="code">404</span>
          </Typography>

          <Typography
            sx={{
              mt: { xs: 1.5, md: 2 },
              maxWidth: 440,
              color: '#172033',
              fontSize: { xs: '1rem', sm: '1.08rem', md: '1.15rem' },
              fontWeight: 700,
              lineHeight: 1.5,
            }}
          >
            Looks like this page slipped off the onboarding path. No worries,
            let&apos;s get you back to the learning library.
          </Typography>

          <Button
            href="/library"
            variant="contained"
            startIcon={<ArrowBackRoundedIcon />}
            sx={{
              mt: { xs: 2.5, md: 3 },
              px: 2.5,
              py: 1.15,
              borderRadius: 999,
              backgroundColor: AI_DIGITAL_COLORS.yvesKleinBlue,
              color: '#fff',
              fontWeight: 900,
              textTransform: 'none',
              boxShadow: '0 16px 36px rgba(0, 9, 220, 0.35)',
              '&:hover': {
                backgroundColor: '#0007B8',
                boxShadow: '0 18px 42px rgba(0, 9, 220, 0.45)',
              },
            }}
          >
            Back to library
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
