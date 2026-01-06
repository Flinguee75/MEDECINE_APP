import { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Chip,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Close,
  Person,
  MedicalServices,
  Event,
  AccessTime,
  Description,
  CheckCircle,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { Appointment, AppointmentStatus } from '../../types/Appointment';
import { Role } from '../../types/User';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AppointmentDetailDrawerProps {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
  userRole: Role;
  onUpdateStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
}

export const AppointmentDetailDrawer = ({
  appointment,
  open,
  onClose,
  userRole,
  onUpdateStatus,
  onCancel,
}: AppointmentDetailDrawerProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'complete' | 'cancel' | null>(null);

  if (!appointment) return null;

  const canModify =
    userRole === Role.ADMIN ||
    userRole === Role.SECRETARY ||
    userRole === Role.DOCTOR;

  const canComplete =
    userRole === Role.DOCTOR && appointment.status === AppointmentStatus.SCHEDULED;

  const canCancel =
    (userRole === Role.ADMIN || userRole === Role.SECRETARY) &&
    appointment.status === AppointmentStatus.SCHEDULED;

  const getStatusConfig = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return {
          label: 'Programmé',
          color: '#1a73e8',
          bgColor: '#e8f0fe',
          icon: <Event sx={{ fontSize: 18 }} />,
        };
      case AppointmentStatus.WAITING_RESULTS:
        return {
          label: 'En attente de résultats',
          color: '#f9a825',
          bgColor: '#fff8e1',
          icon: <MedicalServices sx={{ fontSize: 18 }} />,
        };
      case AppointmentStatus.COMPLETED:
        return {
          label: 'Terminé',
          color: '#2e7d32',
          bgColor: '#e8f5e9',
          icon: <CheckCircle sx={{ fontSize: 18 }} />,
        };
      case AppointmentStatus.CANCELLED:
        return {
          label: 'Annulé',
          color: '#c62828',
          bgColor: '#ffebee',
          icon: <CancelIcon sx={{ fontSize: 18 }} />,
        };
    }
  };

  const statusConfig = getStatusConfig(appointment.status);

  const handleAction = async () => {
    if (!actionType) return;

    setLoading(true);
    setError('');

    try {
      if (actionType === 'complete') {
        await onUpdateStatus(appointment.id, AppointmentStatus.COMPLETED);
      } else if (actionType === 'cancel') {
        await onCancel(appointment.id);
      }
      setConfirmDialogOpen(false);
      setActionType(null);
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          `Erreur lors de l'${actionType === 'complete' ? 'achèvement' : 'annulation'} du rendez-vous`
      );
    } finally {
      setLoading(false);
    }
  };

  const openConfirmDialog = (type: 'complete' | 'cancel') => {
    setActionType(type);
    setConfirmDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr });
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 500 },
            p: 0,
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box
            sx={{
              p: 3,
              bgcolor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Détails du rendez-vous
            </Typography>
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* Status Badge */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
              <Chip
                icon={statusConfig.icon}
                label={statusConfig.label}
                sx={{
                  bgcolor: statusConfig.bgColor,
                  color: statusConfig.color,
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  px: 2,
                  py: 2.5,
                  height: 'auto',
                  '& .MuiChip-icon': {
                    color: statusConfig.color,
                  },
                }}
              />
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Patient Information */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Person sx={{ color: 'primary.main' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Patient
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                {appointment.patient
                  ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                  : 'Information non disponible'}
              </Typography>
              {appointment.patient && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Téléphone: {appointment.patient.phone || '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Date de naissance:{' '}
                    {format(new Date(appointment.patient.birthDate), 'dd/MM/yyyy')}
                  </Typography>
                </Box>
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Doctor Information */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MedicalServices sx={{ color: 'primary.main' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Médecin
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {appointment.doctor?.name || 'Dr. Non assigné'}
              </Typography>
              {appointment.doctor && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {appointment.doctor.email}
                </Typography>
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Date and Time */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AccessTime sx={{ color: 'primary.main' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Date et heure
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formatDate(appointment.date)}
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Motif */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Description sx={{ color: 'primary.main' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Motif de consultation
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                {appointment.motif}
              </Typography>
            </Box>
          </Box>

          {/* Actions */}
          {canModify && appointment.status === AppointmentStatus.SCHEDULED && (
            <Box
              sx={{
                p: 3,
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.default',
              }}
            >
              <Box sx={{ display: 'flex', gap: 2 }}>
                {canComplete && (
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    startIcon={<CheckCircle />}
                    onClick={() => openConfirmDialog('complete')}
                    disabled={loading}
                  >
                    Marquer comme terminé
                  </Button>
                )}
                {canCancel && (
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    startIcon={<CancelIcon />}
                    onClick={() => openConfirmDialog('cancel')}
                    disabled={loading}
                  >
                    Annuler le RDV
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>
          {actionType === 'complete' ? 'Terminer le rendez-vous' : 'Annuler le rendez-vous'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {actionType === 'complete'
              ? 'Êtes-vous sûr de vouloir marquer ce rendez-vous comme terminé ?'
              : 'Êtes-vous sûr de vouloir annuler ce rendez-vous ? Cette action est irréversible.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleAction}
            variant="contained"
            color={actionType === 'complete' ? 'success' : 'error'}
            disabled={loading}
          >
            {loading ? 'Traitement...' : 'Confirmer'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
