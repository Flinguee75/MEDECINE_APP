import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { Appointment } from '../../types/Appointment';
import { User, Role } from '../../types/User';
import { appointmentsService } from '../../services/appointmentsService';
import { usersService } from '../../services/usersService';
import { AppointmentAuditLog } from '../AppointmentAuditLog/AppointmentAuditLog';

interface EditAppointmentModalProps {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditAppointmentModal({
  appointment,
  open,
  onClose,
  onSuccess,
}: EditAppointmentModalProps) {
  const [date, setDate] = useState<Date | null>(null);
  const [motif, setMotif] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [reason, setReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const [doctors, setDoctors] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Réinitialiser les valeurs quand appointment change
  useEffect(() => {
    if (appointment) {
      setDate(new Date(appointment.date));
      setMotif(appointment.motif);
      setDoctorId(appointment.doctor.id);
      setReason('');
      setError(null);
    }
  }, [appointment]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const allUsers = await usersService.getAll();
        const doctorsList = allUsers.filter((user) => user.role === Role.DOCTOR);
        setDoctors(doctorsList);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            'Erreur lors de la récupération des médecins',
        );
      } finally {
        setLoadingDoctors(false);
      }
    };

    if (open) {
      fetchDoctors();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appointment) {
      setError('Aucun rendez-vous sélectionné');
      return;
    }

    if (!date) {
      setError('La date est obligatoire');
      return;
    }

    if (!motif.trim()) {
      setError('Le motif est obligatoire');
      return;
    }

    if (!reason.trim()) {
      setError('La raison de la modification est obligatoire pour la traçabilité');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await appointmentsService.updateWithAudit(appointment.id, {
        date: date.toISOString(),
        motif: motif.trim(),
        doctorId,
        reason: reason.trim(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Erreur lors de la modification du rendez-vous',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Reset form
      if (appointment) {
        setDate(new Date(appointment.date));
        setMotif(appointment.motif);
        setDoctorId(appointment.doctor.id);
      }
      setReason('');
      setError(null);
      setShowHistory(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Modifier le rendez-vous</DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <DateTimePicker
              label="Date et heure du rendez-vous"
              value={date}
              onChange={(newValue) => setDate(newValue)}
              disabled={loading}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: 'normal',
                  required: true,
                },
              }}
            />
          </LocalizationProvider>

          <TextField
            label="Motif de la consultation"
            fullWidth
            margin="normal"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            disabled={loading}
            required
            multiline
            rows={2}
          />

          <TextField
            select
            label="Médecin"
            fullWidth
            margin="normal"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            disabled={loading || loadingDoctors}
            required
          >
            {loadingDoctors ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Chargement...
              </MenuItem>
            ) : (
              doctors.map((doctor) => (
                <MenuItem key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </MenuItem>
              ))
            )}
          </TextField>

          <TextField
            label="Raison de la modification (obligatoire pour l'audit)"
            fullWidth
            margin="normal"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
            required
            multiline
            rows={3}
            placeholder="Ex: Médecin absent, Demande du patient, Changement d'horaire..."
            helperText="Cette information sera enregistrée dans l'historique des modifications"
          />

          <Box sx={{ mt: 2, mb: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setShowHistory(!showHistory)}
              disabled={loading}
            >
              {showHistory ? 'Masquer l\'historique' : 'Voir l\'historique'}
            </Button>
          </Box>

          {showHistory && appointment && (
            <>
              <Divider sx={{ my: 2 }} />
              <AppointmentAuditLog appointmentId={appointment.id} />
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || loadingDoctors}
        >
          {loading ? <CircularProgress size={24} /> : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
