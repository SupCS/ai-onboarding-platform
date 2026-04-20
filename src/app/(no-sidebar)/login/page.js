import { redirect } from 'next/navigation';
import { Box, Container, Paper, Typography } from '@mui/material';
import LoginForm from '../../../components/auth/LoginForm';
import { getCurrentUser } from '../../../lib/currentUser';

export const metadata = {
  title: 'Login',
};

export default async function LoginPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect('/library');
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background:
          'radial-gradient(circle at top left, rgba(25, 118, 210, 0.16), transparent 32%), linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
      }}
    >
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid #e5e7eb' }}>
          <Typography variant="overline" color="primary" sx={{ fontWeight: 800 }}>
            AI Onboarding Platform
          </Typography>

          <Typography variant="h4" sx={{ mt: 1, mb: 1, fontWeight: 900 }}>
            Welcome back
          </Typography>

          <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary' }}>
            Sign in or create an account to access the internal learning library.
          </Typography>

          <LoginForm />
        </Paper>
      </Container>
    </Box>
  );
}
