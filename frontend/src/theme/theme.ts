import { createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';

const baseThemeOptions: ThemeOptions = {
  typography: {
    fontFamily: '"Inter", "Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.025em' },
    h2: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.021em' },
    h3: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.018em' },
    h4: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.015em' },
    h5: { fontSize: '1rem', fontWeight: 600 },
    h6: { fontSize: '0.875rem', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
  },
  shape: {
    borderRadius: 8,
  },
};

export const lightTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    mode: 'light',
    primary: {
      main: '#0f172a', // slate 900
      light: '#334155',
      dark: '#020617',
    },
    secondary: {
      main: '#2563eb', // blue 600
    },
    background: {
      default: '#f8fafc', // slate 50
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
    divider: '#e2e8f0',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: 'none',
          border: '1px solid #e2e8f0',
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: '#f8fafc', // slate 50
      light: '#ffffff',
      dark: '#cbd5e1',
    },
    secondary: {
      main: '#3b82f6', // blue 500
    },
    background: {
      default: '#030712', // gray 950
      paper: '#0b0f19',  // gray 900 custom tint
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
    divider: '#1e293b', // slate 800
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: 'none',
          border: '1px solid #1e293b',
          backgroundImage: 'none',
        },
      },
    },
  },
});
