import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { CameraAlt, Biotech, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { prescriptionsService } from '../../../services/prescriptionsService';
import { Prescription, PrescriptionStatus } from '../../../types/Prescription';
import { AppointmentStatus } from '../../../types/Appointment';
import { StatCard } from '../../../components/StatCard';
import { QuickActionCard } from '../../../components/QuickActionCard';
import { EmptyState } from '../../../components/EmptyState';

export function RadiologistDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<Prescription[]>([]);
  const [inProgress, setInProgress] = useState<Prescription[]>([]);
  const [completedToday, setCompletedToday] = useState<Prescription[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const prescriptions = await prescriptionsService.getAll();
      
      // Filtrer uniquement les prescriptions d'imagerie
      const imagingPrescriptions = prescriptions.filter(
        (p) => p.category === 'IMAGERIE' && p.appointment?.status !== AppointmentStatus.CANCELLED
      );

      // Demandes en attente (envoyées au service)
      setPendingRequests(
        imagingPrescriptions.filter(
          (p) => p.status === PrescriptionStatus.SENT_TO_LAB
        )
      );

      // Examens en cours
      setInProgress(
        imagingPrescriptions.filter((p) => p.status === PrescriptionStatus.IN_PROGRESS)
      );

      // Examens terminés aujourd'hui
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setCompletedToday(
        imagingPrescriptions.filter(
          (p) => 
            (p.status === PrescriptionStatus.RESULTS_AVAILABLE || 
             p.status === PrescriptionStatus.COMPLETED) &&
            new Date(p.updatedAt) >= today
        )
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

  const handleStartExam = (prescriptionId: string) => {
    navigate(`/radiology/${prescriptionId}`);
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
        Tableau de bord Radiologue
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Demandes reçues"
            value={pendingRequests.length}
            icon={<CameraAlt />}
            color="#9c27b0"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Examens en cours"
            value={inProgress.length}
            icon={<Biotech />}
            color="#f57c00"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Terminés aujourd'hui"
            value={completedToday.length}
            icon={<CheckCircle />}
            color="#388e3c"
          />
        </Grid>
      </Grid>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#9c27b0', fontWeight: 600 }}>
          Demandes en attente
        </Typography>
        {pendingRequests.length === 0 ? (
          <EmptyState message="Aucune demande d'imagerie en attente" />
        ) : (
          pendingRequests.map((prescription) => (
            <QuickActionCard
              key={prescription.id}
              title={`${prescription.patient?.firstName} ${prescription.patient?.lastName}`}
              subtitle={prescription.text.split('\n')[1] || prescription.text.substring(0, 100)}
              status="En attente"
              statusColor="secondary"
              actionLabel="Démarrer l'examen"
              onAction={() => handleStartExam(prescription.id)}
            />
          ))
        )}
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#f57c00', fontWeight: 600 }}>
          Examens en cours
        </Typography>
        {inProgress.length === 0 ? (
          <EmptyState message="Aucun examen en cours" />
        ) : (
          inProgress.map((prescription) => (
            <QuickActionCard
              key={prescription.id}
              title={`${prescription.patient?.firstName} ${prescription.patient?.lastName}`}
              subtitle={prescription.text.split('\n')[1] || prescription.text.substring(0, 100)}
              status="En cours"
              statusColor="primary"
              actionLabel="Saisir les résultats"
              onAction={() => handleEnterResults(prescription.id)}
            />
          ))
        )}
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom sx={{ color: '#388e3c', fontWeight: 600 }}>
          Examens terminés aujourd'hui
        </Typography>
        {completedToday.length === 0 ? (
          <EmptyState message="Aucun examen terminé aujourd'hui" />
        ) : (
          completedToday.map((prescription) => (
            <QuickActionCard
              key={prescription.id}
              title={`${prescription.patient?.firstName} ${prescription.patient?.lastName}`}
              subtitle={prescription.text.split('\n')[1] || prescription.text.substring(0, 100)}
              status="Terminé"
              statusColor="success"
              actionLabel="Voir les résultats"
              onAction={() => handleEnterResults(prescription.id)}
            />
          ))
        )}
      </Box>
    </Container>
  );
}
