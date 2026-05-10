import { Box, Container, Paper, Skeleton, Stack, Typography } from '@mui/material';

function UserRowSkeleton({ showButton = true }) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        alignItems: 'center',
        p: 1.25,
        border: '1px solid #eef2f7',
        borderRadius: 2,
      }}
    >
      <Skeleton variant="circular" width={40} height={40} />
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Skeleton variant="text" width="32%" height={28} />
        <Skeleton variant="text" width="52%" />
      </Box>
      <Skeleton variant="rounded" width={72} height={24} />
      {showButton && <Skeleton variant="rounded" width={120} height={36} />}
    </Stack>
  );
}

export default function AdminLoading() {
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
              Access control
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Admin
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Loading admin tools...
            </Typography>
          </Stack>

          <Paper
            elevation={0}
            sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2, backgroundColor: '#fff' }}
          >
            <Stack spacing={2}>
              <Box>
                <Skeleton variant="text" width={180} height={32} />
                <Skeleton variant="text" width="42%" />
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Skeleton variant="rounded" height={56} sx={{ flexGrow: 1 }} />
                <Skeleton variant="rounded" width={180} height={56} />
              </Stack>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2, backgroundColor: '#fff' }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" width={190} height={32} />
                  <Skeleton variant="text" width="48%" />
                </Box>
                <Skeleton variant="rounded" width={88} height={28} />
              </Stack>
              {[1, 2, 3].map((item) => (
                <UserRowSkeleton key={item} showButton={item !== 1} />
              ))}
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2, backgroundColor: '#fff' }}
          >
            <Stack spacing={1}>
              <Skeleton variant="text" width={96} height={32} />
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {[1, 2].map((item) => (
                  <Skeleton key={item} variant="rounded" width={220} height={32} />
                ))}
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Paper>
    </Container>
  );
}
