import { Box, Paper, Skeleton } from '@mui/material';

export default function MaterialsLoadingState() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(3, minmax(0, 1fr))',
          xl: 'repeat(4, minmax(0, 1fr))',
        },
        gap: 2,
      }}
    >
      {[1, 2, 3, 4, 5, 6].map((item) => (
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
            <Skeleton variant="text" width="70%" height={32} />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="85%" />
            <Skeleton variant="text" width="45%" />
          </Box>
        </Paper>
      ))}
    </Box>
  );
}