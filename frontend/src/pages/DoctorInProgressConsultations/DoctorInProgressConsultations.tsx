import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack, PlayArrow } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { appointmentsService } from '../../services/appointmentsService';
import { Appointment, AppointmentStatus } from '../../types/Appointment';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const DoctorInProgressConsultations = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_CONSULTATION' | 'WAITING_RESULTS'>('ALL');

  const fetchInProgressConsultations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await appointmentsService.getInProgressConsultations();
      setAppointments(data);
      setFilteredAppointments(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des consultations en cours');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInProgressConsultations();

    // Rafraîchir toutes les 60 secondes
    const interval = setInterval(() => {
      fetchInProgressConsultations();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFilteredAppointments(appointments);
    } else {
      setFilteredAppointments(
        appointments.filter((apt) => apt.status === statusFilter)
      );
    }
  }, [statusFilter, appointments]);

  const getStatusLabel = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.IN_CONSULTATION:
        return 'En consultation';
      case AppointmentStatus.WAITING_RESULTS:
        return 'En attente de résultats';
      default:
        return status;
    }
  };

  const getStatusColor = (status: AppointmentStatus): 'primary' | 'warning' | 'default' => {
    switch (status) {
      case AppointmentStatus.IN_CONSULTATION:
        return 'primary';
      case AppointmentStatus.WAITING_RESULTS:
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatLastSave = (appointment: Appointment) => {
    if (!appointment.lastAutoSaveAt) {
      return 'Jamais';
    }
    return format(new Date(appointment.lastAutoSaveAt), 'dd/MM/yyyy HH:mm', { locale: fr });
  };

  const handleResume = (appointmentId: string) => {
    navigate(`/appointments/${appointmentId}/consult`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard')}
          >
            Retour
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Consultations en cours
          </Typography>
        </Box>
        <Button variant="outlined" onClick={fetchInProgressConsultations} disabled={loading}>
          {loading ? 'Chargement...' : 'Actualiser'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            select
            label="Filtrer par statut"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            sx={{ minWidth: 250 }}
          >
            <MenuItem value="ALL">Tous</MenuItem>
            <MenuItem value="IN_CONSULTATION">En consultation</MenuItem>
            <MenuItem value="WAITING_RESULTS">En attente de résultats</MenuItem>
          </TextField>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {loading ? (
            <Typography variant="body2" color="text.secondary">
              Chargement...
            </Typography>
          ) : filteredAppointments.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Aucune consultation en cours
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date RDV</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Statut</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Dernière sauvegarde</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {appointment.patient?.firstName} {appointment.patient?.lastName}
                          </Typography>
                          {appointment.isDraftConsultation && (
                            <Badge badgeContent="Brouillon" color="info" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {format(new Date(appointment.date), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(appointment.status)}
                          color={getStatusColor(appointment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={appointment.lastAutoSaveAt ? 'text.primary' : 'text.secondary'}
                        >
                          {formatLastSave(appointment)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<PlayArrow />}
                          onClick={() => handleResume(appointment.id)}
                        >
                          Reprendre
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Cette liste se rafraîchit automatiquement toutes les 60 secondes.
        </Typography>
      </Box>
    </Container>
  );
};
