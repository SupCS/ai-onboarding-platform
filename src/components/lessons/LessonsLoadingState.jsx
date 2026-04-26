import { Box, Paper, Skeleton, Stack } from '@mui/material';

export default function LessonsLoadingState({
  count = 6,
  showAction = true,
  showProgressStatus = false,
}) {
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
      {Array.from({ length: count }, (_, index) => (
        <Paper
          key={index}
          elevation={0}
          sx={{
            borderRadius: 4,
            border: '1px solid #e5e7eb',
            backgroundColor: '#fff',
            overflow: 'hidden',
            minHeight: 340,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              height: 160,
              borderBottom: '1px solid #eef2f7',
              background:
                'linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(16, 185, 129, 0.16)), #f8fafc',
              p: 2,
              display: 'flex',
              alignItems: 'flex-end',
            }}
          >
            <Stack spacing={1.25} sx={{ width: '100%' }}>
              <Skeleton
                variant="circular"
                width={36}
                height={36}
                sx={{ bgcolor: 'rgba(255,255,255,0.6)' }}
              />
              <Skeleton
                variant="rounded"
                width={148}
                height={22}
                sx={{ bgcolor: 'rgba(255,255,255,0.58)' }}
              />
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
            <Stack direction="row" spacing={1} sx={{ mb: 1.25, flexWrap: 'wrap' }}>
              <Skeleton variant="rounded" width={84} height={24} />
              {showProgressStatus && <Skeleton variant="rounded" width={112} height={24} />}
            </Stack>

            <Stack spacing={0.8} sx={{ mb: 2 }}>
              <Skeleton variant="text" width="88%" height={34} />
              <Skeleton variant="text" width="72%" height={34} />
            </Stack>

            <Stack spacing={0.75} sx={{ mb: 2.5 }}>
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="96%" />
              <Skeleton variant="text" width="74%" />
            </Stack>

            <Stack spacing={1} sx={{ mt: 'auto' }}>
              <Skeleton variant="text" width="68%" />
              <Skeleton variant="text" width="48%" />
              {showAction && (
                <Skeleton
                  variant="rounded"
                  width={176}
                  height={36}
                  sx={{ mt: 1 }}
                />
              )}
            </Stack>
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
