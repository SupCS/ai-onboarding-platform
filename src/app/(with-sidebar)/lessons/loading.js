import { Box, Container, Paper, Skeleton, Stack, Typography } from '@mui/material';

export default function MyLessonsLoading() {
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
              My Lessons
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Loading your lessons...
            </Typography>
          </Stack>

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
            {[1, 2, 3, 4, 5].map((item) => (
              <Paper
                key={item}
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#fff',
                  overflow: 'hidden',
                }}
              >
                <Skeleton variant="rectangular" height={160} />
                <Box sx={{ p: 2 }}>
                  <Skeleton variant="text" width="58%" height={28} />
                  <Skeleton variant="text" width="92%" height={32} />
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="rounded" width={180} height={34} sx={{ mt: 2 }} />
                </Box>
              </Paper>
            ))}
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
