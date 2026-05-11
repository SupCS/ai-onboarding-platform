import { Button, Paper, Stack, Typography } from '@mui/material';

export default function EmptyState({ title, description, actionLabel, onAction }) {
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
      <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
        <div>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
            {title}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </div>

        {actionLabel && onAction && (
          <Button variant="outlined" onClick={onAction} sx={{ textTransform: 'none', fontWeight: 800 }}>
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
