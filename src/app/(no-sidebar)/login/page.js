import { Box, Button, Container, Paper, TextField, Typography } from '@mui/material';

export const metadata = {
  title: 'Login',
};

export default function LoginPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 10 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
          Login
        </Typography>

        <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary' }}>
          Sign in to access your learning library.
        </Typography>

        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Email" type="email" fullWidth />
          <TextField label="Password" type="password" fullWidth />

          <Button variant="contained" size="large">
            Sign In
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}