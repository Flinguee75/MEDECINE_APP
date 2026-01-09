import { createTheme, Theme } from '@mui/material/styles';

// Extension des interfaces MUI pour nos couleurs custom
declare module '@mui/material/styles' {
  interface Palette {
    workflow: {
      scheduled: string;
      checkedIn: string;
      inConsultation: string;
      waitingResults: string;
      completed: string;
      cancelled: string;
    };
    status: {
      pending: string;
      inProgress: string;
      completed: string;
      error: string;
      warning: string;
    };
  }

  interface PaletteOptions {
    workflow?: {
      scheduled?: string;
      checkedIn?: string;
      inConsultation?: string;
      waitingResults?: string;
      completed?: string;
      cancelled?: string;
    };
    status?: {
      pending?: string;
      inProgress?: string;
      completed?: string;
      error?: string;
      warning?: string;
    };
  }
}

// Couleurs selon spécifications UX - Medical Theme
const medicalColors = {
  // Couleur primaire - Bleu médical professionnel
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#1976D2', // Main - Bleu médical principal
    600: '#1565C0',
    700: '#0D47A1',
    800: '#0D47A1',
    900: '#0A2E5C',
  },

  // Couleurs workflow - Statuts patient/appointment
  workflow: {
    scheduled: '#FFA726',    // Orange - RDV planifié
    checkedIn: '#66BB6A',    // Vert clair - Patient arrivé
    inConsultation: '#1976D2', // Bleu primary - En consultation
    waitingResults: '#FF9800', // Orange foncé - Attente résultats
    completed: '#4CAF50',    // Vert - Terminé
    cancelled: '#F44336',    // Rouge - Annulé
  },

  // Couleurs statuts - États prescription/résultats
  status: {
    pending: '#9E9E9E',      // Gris - En attente
    inProgress: '#2196F3',   // Bleu - En cours
    completed: '#4CAF50',    // Vert - Terminé
    error: '#F44336',        // Rouge - Erreur
    warning: '#FF9800',      // Orange - Attention
  },

  // Couleurs surface - Backgrounds et conteneurs
  surface: {
    background: '#FAFAFA',   // Background principal très clair
    paper: '#FFFFFF',        // Cards et dialogs
    disabled: '#F5F5F5',     // États désactivés
  },

  // Couleurs texte
  text: {
    primary: '#212121',      // Texte principal
    secondary: '#757575',    // Texte secondaire
    disabled: '#BDBDBD',     // Texte désactivé
    hint: '#9E9E9E',        // Hints et placeholders
  },
};

// Thème Material-UI Medical complet
export const medicalTheme: Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: medicalColors.primary[500],
      light: medicalColors.primary[300],
      dark: medicalColors.primary[700],
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#424242',
      light: '#6d6d6d',
      dark: '#1b1b1b',
      contrastText: '#ffffff',
    },
    error: {
      main: medicalColors.status.error,
      light: '#FFCDD2',
      dark: '#C62828',
    },
    warning: {
      main: medicalColors.status.warning,
      light: '#FFE0B2',
      dark: '#F57C00',
    },
    info: {
      main: medicalColors.status.inProgress,
      light: '#BBDEFB',
      dark: '#0D47A1',
    },
    success: {
      main: medicalColors.status.completed,
      light: '#C8E6C9',
      dark: '#2E7D32',
    },
    background: {
      default: medicalColors.surface.background,
      paper: medicalColors.surface.paper,
    },
    text: {
      primary: medicalColors.text.primary,
      secondary: medicalColors.text.secondary,
      disabled: medicalColors.text.disabled,
    },
    divider: '#E0E0E0',
    // Extension custom pour workflow
    workflow: medicalColors.workflow,
    status: medicalColors.status,
  },

  // Typography système - Roboto optimisée pour médical
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.125rem',
      fontWeight: 300,
      lineHeight: 1.235,
      letterSpacing: '-0.00735em',
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 400,
      lineHeight: 1.334,
      letterSpacing: '0em',
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.6,
      letterSpacing: '0.0075em',
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0em',
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
      letterSpacing: '0.0075em',
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.43,
      letterSpacing: '0.01071em',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.75,
      letterSpacing: '0.02857em',
      textTransform: 'none', // Pas de UPPERCASE agressif
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.66,
      letterSpacing: '0.03333em',
    },
  },

  // Spacing système - Unité 8px
  spacing: 8, // 1 unit = 8px

  // Shape - Coins arrondis doux pour professionnel
  shape: {
    borderRadius: 8,
  },

  // Composants - Customisation des composants MUI
  components: {
    // Buttons - Hiérarchie claire selon spécs UX
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px 0 rgba(25, 118, 210, 0.12)',
          },
        },
        sizeLarge: {
          padding: '12px 32px',
          fontSize: '1rem',
          minHeight: 48, // Boutons "géants" pour actions principales
        },
        sizeMedium: {
          padding: '8px 24px',
          fontSize: '0.875rem',
          minHeight: 40,
        },
        sizeSmall: {
          padding: '6px 16px',
          fontSize: '0.8125rem',
          minHeight: 32,
        },
        contained: {
          '&:hover': {
            boxShadow: '0 2px 8px 0 rgba(25, 118, 210, 0.24)',
          },
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': {
            borderWidth: 1.5,
          },
        },
      },
    },

    // Cards - Espacement cohérent
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24, // theme.spacing(3)
          '&:last-child': {
            paddingBottom: 24,
          },
        },
      },
    },

    // Dialog - Espacement médical
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },

    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: 24,
        },
      },
    },

    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px 24px',
          gap: 12,
        },
      },
    },

    // Stepper - Workflow stepper optimisé
    MuiStepper: {
      styleOverrides: {
        root: {
          padding: '24px 0',
        },
      },
    },

    MuiStepLabel: {
      styleOverrides: {
        label: {
          fontSize: '0.875rem',
          fontWeight: 500,
          '&.Mui-active': {
            fontWeight: 600,
            color: medicalColors.primary[600],
          },
          '&.Mui-completed': {
            fontWeight: 500,
          },
        },
      },
    },

    // Table - Listes de données optimisées
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: medicalColors.surface.disabled,
          '& .MuiTableCell-head': {
            fontWeight: 600,
            fontSize: '0.875rem',
            color: medicalColors.text.primary,
          },
        },
      },
    },

    // Snackbar - Notifications système
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiAlert-root': {
            borderRadius: 8,
          },
        },
      },
    },

    // Chip - Statuts visuels
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: '0.8125rem',
        },
      },
    },

    // TextField - Formulaires optimisés
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },

    // Skeleton - Loading states
    MuiSkeleton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default medicalTheme;
