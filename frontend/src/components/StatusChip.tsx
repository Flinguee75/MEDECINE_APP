import { Chip } from '@mui/material';
import { AppointmentStatus } from '../types/Appointment';
import { PrescriptionStatus } from '../types/Prescription';

type Status = AppointmentStatus | PrescriptionStatus | string;

interface StatusChipProps {
  status: Status;
}

const getStatusConfig = (status: Status) => {
  const configs: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
    // Appointment statuses
    SCHEDULED: { label: 'Planifié', color: 'default' },
    CHECKED_IN: { label: 'Enregistré', color: 'info' },
    IN_CONSULTATION: { label: 'En consultation', color: 'primary' },
    WAITING_RESULTS: { label: 'En attente de résultats', color: 'warning' },
    CONSULTATION_COMPLETED: { label: 'Consultation terminée', color: 'success' },
    COMPLETED: { label: 'Terminé', color: 'success' },
    CANCELLED: { label: 'Annulé', color: 'error' },

    // Prescription statuses
    CREATED: { label: 'Créée', color: 'default' },
    SENT_TO_LAB: { label: 'Envoyée au labo', color: 'info' },
    SAMPLE_COLLECTED: { label: 'Échantillon collecté', color: 'primary' },
    IN_PROGRESS: { label: 'En cours', color: 'primary' },
    RESULTS_AVAILABLE: { label: 'Résultats disponibles', color: 'warning' },

    // Billing statuses
    PENDING: { label: 'En attente', color: 'warning' },
    PAID: { label: 'Payé', color: 'success' },
    PARTIALLY_PAID: { label: 'Partiellement payé', color: 'info' },
  };

  return configs[status] || { label: status, color: 'default' as const };
};

export function StatusChip({ status }: StatusChipProps) {
  const { label, color } = getStatusConfig(status);
  return <Chip label={label} color={color} size="small" />;
}
