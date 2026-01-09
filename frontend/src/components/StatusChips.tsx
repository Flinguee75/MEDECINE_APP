import { Chip, ChipProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AppointmentStatus } from '../types/Appointment';
import { PrescriptionStatus } from '../types/Prescription';

// Props pour WorkflowStatusChip
interface WorkflowStatusChipProps extends Omit<ChipProps, 'color'> {
  status: AppointmentStatus;
}

// Props pour PrescriptionStatusChip
interface PrescriptionStatusChipProps extends Omit<ChipProps, 'color'> {
  status: PrescriptionStatus;
}

// Composant Chip pour statuts d'appointment selon spécs UX
export const WorkflowStatusChip: React.FC<WorkflowStatusChipProps> = ({ 
  status, 
  ...props 
}) => {
  const theme = useTheme();

  // Mapping statuts → couleurs selon spécifications UX
  const getStatusConfig = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return {
          label: 'Planifié',
          color: theme.palette.workflow.scheduled,
          textColor: '#FFFFFF',
        };
      case AppointmentStatus.CHECKED_IN:
        return {
          label: 'Arrivé',
          color: theme.palette.workflow.checkedIn,
          textColor: '#FFFFFF',
        };
      case AppointmentStatus.IN_CONSULTATION:
        return {
          label: 'En consultation',
          color: theme.palette.workflow.inConsultation,
          textColor: '#FFFFFF',
        };
      case AppointmentStatus.WAITING_RESULTS:
        return {
          label: 'Attente résultats',
          color: theme.palette.workflow.waitingResults,
          textColor: '#FFFFFF',
        };
      case AppointmentStatus.CONSULTATION_COMPLETED:
        return {
          label: 'Consultation terminée',
          color: theme.palette.workflow.completed,
          textColor: '#FFFFFF',
        };
      case AppointmentStatus.COMPLETED:
        return {
          label: 'Terminé',
          color: theme.palette.workflow.completed,
          textColor: '#FFFFFF',
        };
      case AppointmentStatus.CANCELLED:
        return {
          label: 'Annulé',
          color: theme.palette.workflow.cancelled,
          textColor: '#FFFFFF',
        };
      default:
        return {
          label: 'Inconnu',
          color: theme.palette.grey[400],
          textColor: '#FFFFFF',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        backgroundColor: config.color,
        color: config.textColor,
        fontWeight: 500,
        fontSize: '0.8125rem',
        minWidth: 120,
        '& .MuiChip-label': {
          px: 2,
        },
      }}
      {...props}
    />
  );
};

// Composant Chip pour statuts de prescription selon spécs UX
export const PrescriptionStatusChip: React.FC<PrescriptionStatusChipProps> = ({ 
  status, 
  ...props 
}) => {
  const theme = useTheme();

  // Mapping statuts prescription → couleurs selon spécifications UX
  const getStatusConfig = (status: PrescriptionStatus) => {
    switch (status) {
      case PrescriptionStatus.CREATED:
        return {
          label: 'Créée',
          color: theme.palette.status.pending,
          textColor: '#FFFFFF',
        };
      case PrescriptionStatus.SENT_TO_LAB:
        return {
          label: 'Envoyé au labo',
          color: theme.palette.status.inProgress,
          textColor: '#FFFFFF',
        };
      case PrescriptionStatus.SAMPLE_COLLECTED:
        return {
          label: 'Échantillon collecté',
          color: theme.palette.status.inProgress,
          textColor: '#FFFFFF',
        };
      case PrescriptionStatus.IN_PROGRESS:
        return {
          label: 'En cours d\'analyse',
          color: theme.palette.status.inProgress,
          textColor: '#FFFFFF',
        };
      case PrescriptionStatus.RESULTS_AVAILABLE:
        return {
          label: 'Résultats disponibles',
          color: theme.palette.status.warning,
          textColor: '#FFFFFF',
        };
      case PrescriptionStatus.COMPLETED:
        return {
          label: 'Terminé',
          color: theme.palette.status.completed,
          textColor: '#FFFFFF',
        };
      default:
        return {
          label: 'Inconnu',
          color: theme.palette.grey[400],
          textColor: '#FFFFFF',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        backgroundColor: config.color,
        color: config.textColor,
        fontWeight: 500,
        fontSize: '0.8125rem',
        minWidth: 140,
        '& .MuiChip-label': {
          px: 2,
        },
      }}
      {...props}
    />
  );
};

// Composant helper pour couleurs de statut (utilisation dans d'autres composants)
export const getWorkflowStatusColor = (status: AppointmentStatus) => {
  const theme = useTheme();
  
  switch (status) {
    case AppointmentStatus.SCHEDULED:
      return theme.palette.workflow.scheduled;
    case AppointmentStatus.CHECKED_IN:
      return theme.palette.workflow.checkedIn;
    case AppointmentStatus.IN_CONSULTATION:
      return theme.palette.workflow.inConsultation;
    case AppointmentStatus.WAITING_RESULTS:
      return theme.palette.workflow.waitingResults;
    case AppointmentStatus.CONSULTATION_COMPLETED:
    case AppointmentStatus.COMPLETED:
      return theme.palette.workflow.completed;
    case AppointmentStatus.CANCELLED:
      return theme.palette.workflow.cancelled;
    default:
      return theme.palette.grey[400];
  }
};

export const getPrescriptionStatusColor = (status: PrescriptionStatus) => {
  const theme = useTheme();
  
  switch (status) {
    case PrescriptionStatus.CREATED:
      return theme.palette.status.pending;
    case PrescriptionStatus.SENT_TO_LAB:
    case PrescriptionStatus.SAMPLE_COLLECTED:
    case PrescriptionStatus.IN_PROGRESS:
      return theme.palette.status.inProgress;
    case PrescriptionStatus.RESULTS_AVAILABLE:
      return theme.palette.status.warning;
    case PrescriptionStatus.COMPLETED:
      return theme.palette.status.completed;
    default:
      return theme.palette.grey[400];
  }
};
