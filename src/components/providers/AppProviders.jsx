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
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        },
        sizeMedium: {
          minHeight: 42,
          padding: '10px 18px',
        },
        sizeSmall: {
          minHeight: 32,
          padding: '7px 14px',
          fontSize: 11,
        },
        containedPrimary: {
          backgroundColor: AI_DIGITAL_COLORS.yvesKleinBlue,
          color: '#fff',
          '&:hover': {
            backgroundColor: AI_DIGITAL_COLORS.yvesKleinBlue,
          },
        },
        outlinedPrimary: {
          borderColor: 'rgba(0, 9, 220, 0.24)',
          color: AI_DIGITAL_COLORS.yvesKleinBlue,
          '&:hover': {
            borderColor: AI_DIGITAL_COLORS.yvesKleinBlue,
            backgroundColor: 'rgba(0, 9, 220, 0.04)',
          },
        },
        textPrimary: {
          color: AI_DIGITAL_COLORS.yvesKleinBlue,
          '&:hover': {
            backgroundColor: 'rgba(0, 9, 220, 0.04)',
          },
        },
      },
    },
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
