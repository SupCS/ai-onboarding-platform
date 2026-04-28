import { Box, Button, Chip, Container, Paper, Skeleton, Stack } from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';

export default function LessonReadLoadingState() {
  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 48px)',
        mx: -3,
        my: -3,
        px: { xs: 2, md: 5 },
        py: { xs: 2, md: 4 },
        background:
          'radial-gradient(circle at 12% 0%, rgba(20, 184, 166, 0.18), transparent 32%), radial-gradient(circle at 90% 12%, rgba(245, 158, 11, 0.14), transparent 28%), linear-gradient(180deg, #f8fafc 0%, #eef6f4 100%)',
      }}
    >
      <Container maxWidth="lg" disableGutters>
        <Stack spacing={3}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{
              alignItems: { xs: 'stretch', sm: 'center' },
              justifyContent: 'space-between',
            }}
          >
            <Button
              startIcon={<ArrowBackOutlinedIcon />}
              variant="outlined"
              color="inherit"
              disabled
              sx={{
                alignSelf: { xs: 'flex-start', sm: 'center' },
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.72)',
              }}
            >
              Back to My Lessons
            </Button>

            <Chip
              label="Loading lesson"
              sx={{
                alignSelf: { xs: 'flex-start', sm: 'center' },
                fontWeight: 800,
                backgroundColor: 'rgba(0, 9, 220, 0.1)',
                color: '#0009DC',
              }}
            />
          </Stack>

          <Paper
            elevation={0}
            sx={{
              px: { xs: 2.5, md: 7, lg: 10 },
              py: { xs: 4, md: 7 },
              borderRadius: { xs: 4, md: 6 },
              border: '1px solid rgba(15, 23, 42, 0.08)',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              boxShadow: '0 28px 80px rgba(15, 23, 42, 0.12)',
            }}
          >
            <Stack spacing={1.5} sx={{ mb: 5 }}>
              <Skeleton variant="text" width={72} height={24} />
              <Stack spacing={0.75}>
                <Skeleton variant="text" width="82%" height={72} />
                <Skeleton variant="text" width="58%" height={72} />
              </Stack>
              <Skeleton variant="text" width="68%" height={28} />
            </Stack>

            <Stack spacing={2}>
              {Array.from({ length: 7 }, (_, index) => (
                <Skeleton
                  key={index}
                  variant="text"
                  width={index % 3 === 0 ? '92%' : index % 3 === 1 ? '100%' : '74%'}
                  height={30}
                />
              ))}
            </Stack>

            <Box
              sx={{
                mt: { xs: 5, md: 7 },
                p: { xs: 2.5, md: 3 },
                borderRadius: 4,
                border: '1px solid rgba(0, 9, 220, 0.14)',
                background:
                  'linear-gradient(135deg, rgba(239,246,255,0.96) 0%, rgba(245,243,255,0.96) 100%)',
              }}
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{
                  alignItems: { xs: 'stretch', md: 'center' },
                  justifyContent: 'space-between',
                }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1}>
                    <Skeleton variant="rounded" width={132} height={32} />
                    <Skeleton variant="rounded" width={104} height={32} />
                  </Stack>
                  <Skeleton variant="text" width={280} height={36} />
                  <Skeleton variant="text" width={360} height={24} sx={{ maxWidth: '100%' }} />
                </Stack>

                <Skeleton variant="rounded" width={172} height={54} />
              </Stack>
            </Box>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
