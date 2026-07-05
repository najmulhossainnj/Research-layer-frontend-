import { createTheme } from '@mui/material/styles';

export const quantTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#050505',
      paper: '#0a0a0a'
    },
    primary: {
      main: '#c5a059', // Blackwood Capital Gold
      light: '#d6b778',
      dark: '#9e7e40'
    },
    secondary: {
      main: '#4F8EF7' // Interactive Blue
    },
    success: {
      main: '#52a447'
    },
    error: {
      main: '#e54b4b'
    },
    warning: {
      main: '#E8A838'
    },
    text: {
      primary: '#d4d4d4',
      secondary: '#888888',
      disabled: '#444444'
    },
    divider: '#1a1a1a'
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h1: { fontSize: '1.875rem', fontWeight: 300, tracking: '-0.025em', color: '#ffffff' },
    h2: { fontSize: '1.5rem', fontWeight: 600, color: '#ffffff' },
    h3: { fontSize: '1.125rem', fontWeight: 700, letterSpacing: '0.05em' },
    h4: { fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' },
    body1: { fontSize: '0.875rem', lineHeight: 1.6 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    button: { textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.75rem' }
  },
  shape: {
    borderRadius: 4
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        :root {
          --bg-base: #050505;
          --bg-surface: #0a0a0a;
          --bg-elevated: #141414;
          --bg-border: #1a1a1a;
          --accent-primary: #c5a059;
          --accent-blue: #4F8EF7;
          --accent-success: #52a447;
          --accent-danger: #e54b4b;
          --accent-warn: #E8A838;
          --accent-neutral: #888888;
          --text-primary: #d4d4d4;
          --text-secondary: #888888;
          --text-muted: #444444;
          --text-mono: #C5E0B4;
        }
        body {
          background-color: #050505;
          color: #d4d4d4;
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        * {
          box-sizing: border-box;
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #050505;
        }
        ::-webkit-scrollbar-thumb {
          background: #222222;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #c5a059;
        }
      `
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#0a0a0a',
          border: '1px solid #1a1a1a',
          boxShadow: 'none',
          borderRadius: 6
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#0a0a0a',
          border: '1px solid #1a1a1a'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          padding: '6px 16px',
          fontFamily: '"Inter", sans-serif',
          border: '1px solid #333333',
          color: '#d4d4d4',
          '&:hover': {
            backgroundColor: '#ffffff',
            color: '#000000',
            borderColor: '#ffffff'
          }
        },
        contained: {
          backgroundColor: '#c5a059',
          color: '#000000',
          borderColor: '#c5a059',
          '&:hover': {
            backgroundColor: '#d6b778',
            color: '#000000'
          }
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #1a1a1a',
          padding: '8px 12px',
          fontSize: '0.8125rem',
          color: '#d4d4d4'
        },
        head: {
          backgroundColor: '#070707',
          color: '#888888',
          fontWeight: 700,
          textTransform: 'uppercase',
          fontSize: '0.6875rem',
          letterSpacing: '0.08em'
        }
      }
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#c5a059',
          height: 2
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: '#888888',
          '&.Mui-selected': {
            color: '#ffffff'
          }
        }
      }
    }
  }
});
