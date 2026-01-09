import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Snackbar, Alert, AlertColor, Slide, SlideProps } from '@mui/material';
import { CheckCircle, Error, Warning, Info } from '@mui/icons-material';

// Types pour le système de notifications
interface NotificationState {
  open: boolean;
  message: string;
  severity: AlertColor;
  duration?: number;
}

interface NotificationContextType {
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showNotification: (message: string, severity: AlertColor, duration?: number) => void;
}

// Transition slide pour les notifications
function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

// Context pour les notifications globales
const NotificationContext = createContext<NotificationContextType | null>(null);

// Hook pour utiliser le système de notifications
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new globalThis.Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Provider du système de notifications
interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info',
    duration: 4000,
  });

  // Fonction générique pour afficher une notification
  const showNotification = (
    message: string, 
    severity: AlertColor, 
    duration: number = 4000
  ) => {
    setNotification({
      open: true,
      message,
      severity,
      duration,
    });
  };

  // Fonctions spécifiques par type (selon spécs UX)
  const showSuccess = (message: string, duration: number = 3000) => {
    showNotification(`✓ ${message}`, 'success', duration);
  };

  const showError = (message: string, duration: number = 6000) => {
    showNotification(message, 'error', duration);
  };

  const showWarning = (message: string, duration: number = 5000) => {
    showNotification(message, 'warning', duration);
  };

  const showInfo = (message: string, duration: number = 4000) => {
    showNotification(message, 'info', duration);
  };

  // Fermeture de la notification
  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Icônes personnalisées pour chaque type
  const getIcon = (severity: AlertColor) => {
    switch (severity) {
      case 'success':
        return <CheckCircle fontSize="inherit" />;
      case 'error':
        return <Error fontSize="inherit" />;
      case 'warning':
        return <Warning fontSize="inherit" />;
      case 'info':
      default:
        return <Info fontSize="inherit" />;
    }
  };

  const contextValue: NotificationContextType = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Snackbar global - Feedback instantané <200ms selon spécs UX */}
      <Snackbar
        open={notification.open}
        autoHideDuration={notification.duration}
        onClose={handleClose}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            borderRadius: 2,
            minWidth: 300,
          },
        }}
      >
        <Alert
          onClose={handleClose}
          severity={notification.severity}
          variant="filled"
          icon={getIcon(notification.severity)}
          sx={{
            width: '100%',
            fontSize: '0.875rem',
            fontWeight: 500,
            borderRadius: 2,
            boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.15)',
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
