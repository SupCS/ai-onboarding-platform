'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AI_DIGITAL_COLORS } from '../../lib/brandColors';
import { TaskTrayProvider } from './TaskTrayProvider';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: AI_DIGITAL_COLORS.yvesKleinBlue,
    },
    secondary: {
      main: AI_DIGITAL_COLORS.pink,
    },
    background: {
      default: AI_DIGITAL_COLORS.silverHaze,
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
        <TaskTrayProvider>{children}</TaskTrayProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
