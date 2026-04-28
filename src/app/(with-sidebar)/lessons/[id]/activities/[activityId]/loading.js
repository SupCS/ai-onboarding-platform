import { Box, Button, Container, LinearProgress, Paper, Skeleton, Stack } from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';

export default function LessonActivityLoading() {
  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 48px)',
        mx: -3,
        my: -3,
        px: { xs: 2, md: 5 },
        py: { xs: 2, md: 4 },
        background:
          'radial-gradient(circle at 12% 0%, rgba(0, 9, 220, 0.14), transparent 30%), radial-gradient(circle at 88% 10%, rgba(174, 243, 62, 0.2), transparent 28%), linear-gradient(180deg, #f8fafc 0%, #edf7ff 100%)',
      }}
    >
      <Container maxWidth="lg" disableGutters>
        <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 4,
              border: '1px solid rgba(15, 23, 42, 0.08)',
              background: 'rgba(255,255,255,0.94)',
            }}
          >
            <Stack spacing={2}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1.5}
                sx={{
                  alignItems: { xs: 'stretch', md: 'center' },
                  justifyContent: 'space-between',
                }}
              >
                <Stack spacing={1.25}>
                  <Stack direction="row" spacing={1}>
                    <Skeleton variant="rounded" width={112} height={32} />
                    <Skeleton variant="rounded" width={132} height={32} />
                  </Stack>
                  <Skeleton variant="text" width={360} height={56} sx={{ maxWidth: '100%' }} />
                  <Skeleton variant="text" width={260} height={24} sx={{ maxWidth: '80%' }} />
                </Stack>

                <Button
                  startIcon={<ArrowBackOutlinedIcon />}
                  variant="outlined"
                  color="inherit"
                  disabled
                  sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                >
                  Back to lesson
                </Button>
              </Stack>

              <Box>
                <LinearProgress
                  variant="determinate"
                  value={28}
                  sx={{
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: '#e5e7eb',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 999,
                      background: 'linear-gradient(90deg, #0009DC 0%, #8EE7F1 100%)',
                    },
                  }}
                />
                <Skeleton variant="text" width={96} height={22} sx={{ mt: 0.75 }} />
              </Box>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              minHeight: { xs: 360, md: 420 },
              p: { xs: 3, md: 5 },
              borderRadius: 5,
              border: '1px solid rgba(15, 23, 42, 0.1)',
              background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
              boxShadow: '0 28px 80px rgba(15, 23, 42, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Stack spacing={2.5}>
              <Skeleton variant="rounded" width={96} height={32} />
              <Stack spacing={1.25}>
                <Skeleton variant="text" width="86%" height={58} />
                <Skeleton variant="text" width="72%" height={58} />
                <Skeleton variant="text" width="48%" height={58} />
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton variant="text" width={190} height={28} />
            </Stack>
          </Paper>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="text" width={96} height={28} />
              <Skeleton variant="circular" width={40} height={40} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <Skeleton variant="rounded" width={116} height={42} />
              <Skeleton variant="rounded" width={230} height={42} />
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
