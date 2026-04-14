import { Paper, Typography } from '@mui/material';

export default function EmptyState({ title, description }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 4,
        border: '1px solid #e5e7eb',
        backgroundColor: '#fff',
      }}
    >
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
        {title}
      </Typography>

      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Paper>
  );
}