import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { Science, Biotech } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { prescriptionsService } from '../../../services/prescriptionsService';
import { Prescription, PrescriptionStatus } from '../../../types/Prescription';
import { AppointmentStatus } from '../../../types/Appointment';
import { StatCard } from '../../../components/StatCard';
import { QuickActionCard } from '../../../components/QuickActionCard';
import { EmptyState } from '../../../components/EmptyState';

export function BiologistDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<Prescription[]>([]);
  const [samplesReceived, setSamplesReceived] = useState<Prescription[]>([]);
  const [inProgress, setInProgress] = useState<Prescription[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const prescriptions = await prescriptionsService.getAll();
      const activePrescriptions = prescriptions.filter(
        (p) => p.appointment?.status !== AppointmentStatus.CANCELLED
      );

      setPendingRequests(
        activePrescriptions.filter(
          (p) => p.status === PrescriptionStatus.SENT_TO_LAB && !p.sampleCollectedAt
        )
      );

      setSamplesReceived(
        activePrescriptions.filter(
          (p) => p.status === PrescriptionStatus.SENT_TO_LAB && p.sampleCollectedAt
        )
      );

      setInProgress(
        activePrescriptions.filter((p) => p.status === PrescriptionStatus.IN_PROGRESS)
      );
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartAnalysis = async (prescriptionId: string) => {
    try {
      await prescriptionsService.startAnalysis(prescriptionId);
      await loadData();
    } catch (error) {
      console.error('Failed to start analysis:', error);
    }
  };

  const handleEnterResults = (prescriptionId: string) => {
    navigate(`/prescriptions/${prescriptionId}/results`);
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
      <Typography variant="h4" gutterBottom>
        Tableau de bord Biologiste
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Demandes reçues"
            value={pendingRequests.length}
            icon={<Science />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Échantillons reçus"
            value={samplesReceived.length}
            icon={<Science />}
            color="#388e3c"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Analyses en cours"
            value={inProgress.length}
            icon={<Biotech />}
            color="#f57c00"
          />
        </Grid>
      </Grid>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Demandes reçues
        </Typography>
        {pendingRequests.length === 0 ? (
          <EmptyState message="Aucune demande reçue" />
        ) : (
          pendingRequests.map((prescription) => (
            <QuickActionCard
              key={prescription.id}
              title={`${prescription.patient?.firstName} ${prescription.patient?.lastName}`}
              subtitle={`Prescription de Dr. ${prescription.doctor?.name}`}
              status="En attente d'échantillon"
              statusColor="warning"
              actionLabel="Voir demande"
              onAction={() => navigate('/prescriptions')}
            />
          ))
        )}
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Échantillons reçus
        </Typography>
        {samplesReceived.length === 0 ? (
          <EmptyState message="Aucun échantillon reçu" />
        ) : (
          samplesReceived.map((prescription) => (
            <QuickActionCard
              key={prescription.id}
              title={`${prescription.patient?.firstName} ${prescription.patient?.lastName}`}
              subtitle={`Prescription de Dr. ${prescription.doctor?.name}`}
              status="Échantillon collecté"
              statusColor="primary"
              actionLabel="Démarrer analyse"
              onAction={() => handleStartAnalysis(prescription.id)}
            />
          ))
        )}
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Analyses en cours
        </Typography>
        {inProgress.length === 0 ? (
          <EmptyState message="Aucune analyse en cours" />
        ) : (
          inProgress.map((prescription) => (
            <QuickActionCard
              key={prescription.id}
              title={`${prescription.patient?.firstName} ${prescription.patient?.lastName}`}
              subtitle={prescription.text.substring(0, 100)}
              status="En cours"
              statusColor="primary"
              actionLabel="Saisir résultats"
              onAction={() => handleEnterResults(prescription.id)}
            />
          ))
        )}
      </Box>
    </Container>
  );
}
