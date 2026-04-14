'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#7c4dff',
    },
    background: {
      default: '#f7f8fc',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'Arial, sans-serif',
  },
});

export default function AppProviders({ children }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}