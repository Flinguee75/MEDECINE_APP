import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { MedicalServices, Assessment, EventNote } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { appointmentsService } from '../../../services/appointmentsService';
import { prescriptionsService } from '../../../services/prescriptionsService';
import { Appointment, AppointmentStatus } from '../../../types/Appointment';
import { Prescription, PrescriptionStatus } from '../../../types/Prescription';
import { StatCard } from '../../../components/StatCard';
import { QuickActionCard } from '../../../components/QuickActionCard';
import { EmptyState } from '../../../components/EmptyState';

export function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [consultationsReady, setConsultationsReady] = useState<Appointment[]>([]);
  const [waitingResults, setWaitingResults] = useState<Appointment[]>([]);
  const [resultsToReview, setResultsToReview] = useState<Prescription[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const appointments = await appointmentsService.getAll(user?.id);
      const prescriptions = await prescriptionsService.getAll({ doctorId: user?.id });

      setConsultationsReady(
        appointments.filter((apt) => apt.status === AppointmentStatus.IN_CONSULTATION)
      );

      setWaitingResults(
        appointments.filter((apt) => apt.status === AppointmentStatus.WAITING_RESULTS)
      );

      setResultsToReview(
        prescriptions.filter((p) => p.status === PrescriptionStatus.RESULTS_AVAILABLE)
      );
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handleConsultation = (appointmentId: string) => {
    navigate(`/appointments/${appointmentId}/consult`);
  };

  const handleReviewResult = (prescriptionId: string) => {
    navigate(`/prescriptions/${prescriptionId}/review`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Tableau de bord Médecin
        </Typography>
        <Button
          variant="contained"
          startIcon={<EventNote />}
          onClick={() => navigate('/consultations/in-progress')}
        >
          Consultations en cours
        </Button>
      </Box>

      {resultsToReview.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {resultsToReview.length} résultat{resultsToReview.length > 1 ? 's' : ''} disponible
          {resultsToReview.length > 1 ? 's' : ''} à réviser.
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Consultations en attente"
            value={consultationsReady.length}
            icon={<MedicalServices />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="En attente de résultats"
            value={waitingResults.length}
            icon={<MedicalServices />}
            color="#f9a825"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Résultats à réviser"
            value={resultsToReview.length}
            icon={<Assessment />}
            color="#d32f2f"
          />
        </Grid>
      </Grid>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Consultations en attente
        </Typography>
        {consultationsReady.length === 0 ? (
          <EmptyState message="Aucune consultation en attente" />
        ) : (
          consultationsReady.map((apt) => (
            <QuickActionCard
              key={apt.id}
              title={`${apt.patient?.firstName} ${apt.patient?.lastName}`}
              subtitle={`${apt.motif}`}
              status="En consultation"
              statusColor="primary"
              actionLabel="Consulter"
              onAction={() => handleConsultation(apt.id)}
            />
          ))
        )}
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Consultations en attente de résultats
        </Typography>
        {waitingResults.length === 0 ? (
          <EmptyState message="Aucune consultation en attente de résultats" />
        ) : (
          waitingResults.map((apt) => (
            <QuickActionCard
              key={apt.id}
              title={`${apt.patient?.firstName} ${apt.patient?.lastName}`}
              subtitle={`${apt.motif}`}
              status="En attente de résultats"
              statusColor="warning"
              actionLabel="Ouvrir"
              onAction={() => handleConsultation(apt.id)}
            />
          ))
        )}
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Résultats à réviser
        </Typography>
        {resultsToReview.length === 0 ? (
          <EmptyState message="Aucun résultat à réviser" />
        ) : (
          resultsToReview.map((prescription) => (
            <QuickActionCard
              key={prescription.id}
              title={`${prescription.patient?.firstName} ${prescription.patient?.lastName}`}
              subtitle={prescription.text.substring(0, 100)}
              status="Résultats disponibles"
              statusColor="warning"
              actionLabel="Réviser"
              onAction={() => handleReviewResult(prescription.id)}
            />
          ))
        )}
      </Box>
    </Container>
  );
}
