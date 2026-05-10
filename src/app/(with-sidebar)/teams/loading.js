import { Box, Container, Paper, Skeleton, Stack, Typography } from '@mui/material';

export default function TeamsLoading() {
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
              Organization
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Teams
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Loading teams...
            </Typography>
          </Stack>

          <Stack spacing={1.5}>
            {[1, 2, 3, 4].map((item) => (
              <Paper
                key={item}
                elevation={0}
                sx={{
                  p: 2,
                  border: '1px solid #e5e7eb',
                  borderRadius: 2,
                  backgroundColor: '#fff',
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Skeleton variant="text" width="28%" height={28} />
                    <Skeleton variant="text" width="42%" />
                  </Box>
                  <Skeleton variant="rounded" width={104} height={28} />
                  <Skeleton variant="circular" width={28} height={28} />
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}
