import { Paper, Skeleton, Stack } from '@mui/material';

export default function MaterialsLoadingState() {
  return (
    <Stack spacing={2}>
      {[1, 2, 3].map((item) => (
        <Paper
          key={item}
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            border: '1px solid #e5e7eb',
            backgroundColor: '#fff',
          }}
        >
          <Skeleton variant="text" width="30%" height={34} />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="25%" />
        </Paper>
      ))}
    </Stack>
  );
}