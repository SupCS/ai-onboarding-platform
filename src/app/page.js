import { Box, Button, Container, Paper, Typography } from '@mui/material';

export default function HomePage() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h3" sx={{ mb: 2, fontWeight: 700 }}>
          AI Onboarding Platform
        </Typography>

        <Typography variant="body1" sx={{ mb: 3 }}>
          Your Next.js + MUI setup is working!
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained">Get Started</Button>
          <Button variant="outlined">Learn More</Button>
        </Box>
      </Paper>
    </Container>
  );
}