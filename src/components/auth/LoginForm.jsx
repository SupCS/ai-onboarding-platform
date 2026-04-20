'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegistering = mode === 'register';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      router.replace('/library');
      router.refresh();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
      <ToggleButtonGroup
        value={mode}
        exclusive
        fullWidth
        onChange={(_, nextMode) => {
          if (nextMode) {
            setMode(nextMode);
            setError('');
          }
        }}
        aria-label="Authentication mode"
      >
        <ToggleButton value="login">Sign in</ToggleButton>
        <ToggleButton value="register">Create account</ToggleButton>
      </ToggleButtonGroup>

      {error && <Alert severity="error">{error}</Alert>}

      {isRegistering && (
        <TextField
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          fullWidth
          required
          autoComplete="name"
        />
      )}

      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        fullWidth
        required
        autoComplete="email"
      />

      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        fullWidth
        required
        autoComplete={isRegistering ? 'new-password' : 'current-password'}
        helperText={isRegistering ? 'At least 8 characters.' : ''}
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? isRegistering
            ? 'Creating account...'
            : 'Signing in...'
          : isRegistering
            ? 'Create account'
            : 'Sign in'}
      </Button>

      <Box>
        <Typography variant="caption" color="text.secondary">
          Auth uses a secure httpOnly session cookie. Passwords are stored only as
          salted hashes.
        </Typography>
      </Box>
    </Stack>
  );
}
