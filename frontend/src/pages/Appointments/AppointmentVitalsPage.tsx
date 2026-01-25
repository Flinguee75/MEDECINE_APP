import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Typography,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { appointmentsService } from '../../services/appointmentsService';
import { Appointment, AppointmentStatus } from '../../types/Appointment';
import { useAuth } from '../../context/AuthContext';
import { VitalsEntryForm } from '../../components/VitalsEntryForm/VitalsEntryForm';

export const AppointmentVitalsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        const data = await appointmentsService.getOne(id);
        setAppointment(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors du chargement du rendez-vous');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id]);

  const isReadyForVitals = appointment?.status === AppointmentStatus.CHECKED_IN;

  const handleVitalsSubmitted = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Chargement...
        </Typography>
      </Container>
    );
  }

  if (!appointment) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Rendez-vous introuvable</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Bouton retour en haut à gauche */}
      <Box sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={() => navigate(-1)} startIcon={<ArrowBack />}>
          Retour
        </Button>
      </Box>

      {/* Header avec titre */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Saisie des constantes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Renseignez les constantes vitales de base
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!isReadyForVitals && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Le rendez-vous doit être au statut "CHECKED_IN" pour saisir les constantes.
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
            Patient
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            {appointment.patient?.firstName} {appointment.patient?.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {appointment.patient?.sex && `${appointment.patient.sex === 'M' ? 'Homme' : 'Femme'}`}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>Motif:</strong> {appointment.motif || 'Non spécifié'}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {user?.name && <Chip label={`Infirmier/ère: ${user.name}`} size="small" color="primary" variant="outlined" />}
            {appointment.updatedAt && (
              <Chip 
                label={`Dernière maj: ${new Date(appointment.updatedAt).toLocaleString('fr-FR', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}`} 
                size="small" 
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {id && appointment?.patient?.id && (
        <VitalsEntryForm
          appointmentId={id}
          patientId={appointment.patient.id}
          onVitalsSubmitted={handleVitalsSubmitted}
        />
      )}
    </Container>
  );
};
