import { useEffect, useState } from 'react';
import {  Box,
  Container,
  Grid,
  Typography,
  CircularProgress,
} from '@mui/material';
import { MonitorHeart, Science } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { appointmentsService } from '../../../services/appointmentsService';
import { prescriptionsService } from '../../../services/prescriptionsService';
import { Appointment, AppointmentStatus } from '../../../types/Appointment';
import { Prescription, PrescriptionStatus } from '../../../types/Prescription';
import { StatCard } from '../../../components/StatCard';
import { QuickActionCard } from '../../../components/QuickActionCard';
import { EmptyState } from '../../../components/EmptyState';

export function NurseDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [checkedInAppointments, setCheckedInAppointments] = useState<Appointment[]>([]);
  const [samplesToCollect, setSamplesToCollect] = useState<Prescription[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const appointments = await appointmentsService.getAll();
      const prescriptions = await prescriptionsService.getAll();

      setCheckedInAppointments(
        appointments.filter((apt) => apt.status === AppointmentStatus.CHECKED_IN)
      );

      setSamplesToCollect(
        prescriptions.filter(
          (p) => p.status === PrescriptionStatus.SENT_TO_LAB && !p.sampleCollectedAt
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

  const handleEnterVitals = (appointmentId: string) => {
    navigate(`/appointments/${appointmentId}/vitals`);
  };

  const handleCollectSample = async (prescriptionId: string) => {
    try {
      await prescriptionsService.collectSample(prescriptionId);
      await loadData();
    } catch (error) {
      console.error('Failed to collect sample:', error);
    }
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
        Tableau de bord Infirmier
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <StatCard
            title="Patients à préparer"
            value={checkedInAppointments.length}
            icon={<MonitorHeart />}
            color="#00897b"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <StatCard
            title="Échantillons à collecter"
            value={samplesToCollect.length}
            icon={<Science />}
            color="#f57c00"
          />
        </Grid>
      </Grid>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Patients à préparer
        </Typography>
        {checkedInAppointments.length === 0 ? (
          <EmptyState message="Aucun patient en attente" />
        ) : (
          checkedInAppointments.map((apt) => (
            <QuickActionCard
              key={apt.id}
              title={`${apt.patient?.firstName} ${apt.patient?.lastName}`}
              subtitle={`Dr. ${apt.doctor?.name} - ${apt.motif}`}
              status="Enregistré"
              statusColor="info"
              actionLabel="Saisir constantes"
              onAction={() => handleEnterVitals(apt.id)}
            />
          ))
        )}
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Échantillons à collecter
        </Typography>
        {samplesToCollect.length === 0 ? (
          <EmptyState message="Aucun échantillon à collecter" />
        ) : (
          samplesToCollect.map((prescription) => (
            <QuickActionCard
              key={prescription.id}
              title={`${prescription.patient?.firstName} ${prescription.patient?.lastName}`}
              subtitle={`Prescription de Dr. ${prescription.doctor?.name}`}
              status="Envoyé au labo"
              statusColor="info"
              actionLabel="Collecter échantillon"
              onAction={() => handleCollectSample(prescription.id)}
            />
          ))
        )}
      </Box>
    </Container>
  );
}
