import { Box, Container, Paper, Skeleton, Stack, Typography } from '@mui/material';

export default function MyRoadmapsLoading() {
  return (
    <Container maxWidth={false} disableGutters>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          border: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc',
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={0.75}>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 800 }}>
              Personal learning
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              My Roadmaps
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Loading your roadmaps...
            </Typography>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
              },
              gap: 2,
            }}
          >
            {[1, 2, 3].map((item) => (
              <Paper
                key={item}
                elevation={0}
                sx={{
                  p: { xs: 2.25, md: 3 },
                  borderRadius: 4,
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#fff',
                }}
              >
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    sx={{ alignItems: { xs: 'stretch', md: 'flex-start' }, justifyContent: 'space-between' }}
                  >
                    <Stack direction="row" spacing={2} sx={{ flexGrow: 1 }}>
                      <Skeleton variant="rounded" width={52} height={52} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                          <Skeleton variant="rounded" width={92} height={24} />
                          <Skeleton variant="rounded" width={130} height={24} />
                        </Stack>
                        <Skeleton variant="text" width="58%" height={42} />
                        <Skeleton variant="text" width="92%" />
                        <Skeleton variant="text" width="72%" />
                      </Box>
                    </Stack>

                    <Box sx={{ minWidth: 150 }}>
                      <Skeleton variant="text" width={72} height={34} />
                      <Skeleton variant="text" width={120} />
                      <Skeleton variant="rounded" width={130} height={24} />
                    </Box>
                  </Stack>

                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1.5 }}>
                    {[1, 2, 3, 4, 5].map((step) => (
                      <Stack key={step} spacing={1} sx={{ alignItems: 'center' }}>
                        <Skeleton variant="circular" width={44} height={44} />
                        <Skeleton variant="text" width="80%" />
                      </Stack>
                    ))}
                  </Box>

                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
                  >
                    <Skeleton variant="text" width={120} />
                    <Skeleton variant="rounded" width={120} height={34} />
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
