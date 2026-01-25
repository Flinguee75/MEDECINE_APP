import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Badge,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { 
  MonitorHeart, 
  Science, 
  Person,
  AccessTime,
  PlayArrow,
  CheckCircle,
  LocalHospital,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../../context/NotificationContext';
import { appointmentsService } from '../../../services/appointmentsService';
import { prescriptionsService } from '../../../services/prescriptionsService';
import { Appointment, AppointmentStatus } from '../../../types/Appointment';
import { Prescription, PrescriptionStatus } from '../../../types/Prescription';
import { WorkflowStatusChip } from '../../../components/StatusChips';

export function NurseDashboard() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [checkedInAppointments, setCheckedInAppointments] = useState<Appointment[]>([]);
  const [samplesToCollect, setSamplesToCollect] = useState<Prescription[]>([]);
  const [vitalsRequests, setVitalsRequests] = useState<Appointment[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const appointments = await appointmentsService.getAll();
      const prescriptions = await prescriptionsService.getAll();

      const checkedIn = appointments
        .filter((apt) => apt.status === AppointmentStatus.CHECKED_IN && !apt.vitals)
        .sort((a, b) => {
          const aDate = new Date(a.date);
          const bDate = new Date(b.date);
          const aMinutes = aDate.getHours() * 60 + aDate.getMinutes();
          const bMinutes = bDate.getHours() * 60 + bDate.getMinutes();
          return aMinutes - bMinutes;
        });
      setCheckedInAppointments(checkedIn);
      setVitalsRequests(
        appointments.filter(
          (apt) => apt.status === AppointmentStatus.CHECKED_IN && Boolean(apt.vitalsRequestedAt) && !apt.vitals
        )
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
      showSuccess('Échantillon collecté avec succès');
      await loadData();
    } catch (error) {
      console.error('Failed to collect sample:', error);
      showError('Erreur lors de la collecte de l\'échantillon');
    }
  };

  // Loading skeleton selon spécs UX - jamais de page blanche
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width={300} height={48} />
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header avec titre */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 500, color: 'primary.main', mb: 0.5 }}>
          Soins Infirmiers
        </Typography>
      </Box>

      {/* Alert prioritaire si échantillons urgents */}
      {samplesToCollect.length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => document.getElementById('samples-section')?.scrollIntoView()}
            >
              Voir
            </Button>
          }
        >
          {samplesToCollect.length} échantillon{samplesToCollect.length > 1 ? 's' : ''} à collecter pour le laboratoire
        </Alert>
      )}

      {vitalsRequests.length > 0 && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => document.getElementById('patients-section')?.scrollIntoView()}
            >
              Voir
            </Button>
          }
        >
          {vitalsRequests.length} demande{vitalsRequests.length > 1 ? 's' : ''} de constantes
          en attente
        </Alert>
      )}


      {/* Cards de statistiques avec badges notifications */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: '100%', 
              cursor: checkedInAppointments.length > 0 ? 'pointer' : 'default',
              border: checkedInAppointments.length > 0 ? '2px solid' : '1px solid',
              borderColor: checkedInAppointments.length > 0 ? 'success.main' : 'divider'
            }}
            onClick={() => checkedInAppointments.length > 0 && document.getElementById('patients-section')?.scrollIntoView()}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Constantes à saisir
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'success.main', fontWeight: 600 }}>
                    {checkedInAppointments.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Patients arrivés
                  </Typography>
                </Box>
                <Badge 
                  badgeContent={checkedInAppointments.length} 
                  color="success"
                  sx={{ 
                    '& .MuiBadge-badge': { 
                      fontSize: '0.75rem',
                      display: checkedInAppointments.length > 0 ? 'block' : 'none'
                    } 
                  }}
                >
                  <MonitorHeart sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: '100%', 
              cursor: samplesToCollect.length > 0 ? 'pointer' : 'default',
              border: samplesToCollect.length > 0 ? '2px solid' : '1px solid',
              borderColor: samplesToCollect.length > 0 ? 'warning.main' : 'divider'
            }}
            onClick={() => samplesToCollect.length > 0 && document.getElementById('samples-section')?.scrollIntoView()}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Échantillons à collecter
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'warning.main', fontWeight: 600 }}>
                    {samplesToCollect.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pour le laboratoire
                  </Typography>
                </Box>
                <Badge 
                  badgeContent={samplesToCollect.length} 
                  color="warning"
                  sx={{ 
                    '& .MuiBadge-badge': { 
                      fontSize: '0.75rem',
                      display: samplesToCollect.length > 0 ? 'block' : 'none'
                    } 
                  }}
                >
                  <Science sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Section principale - Saisie constantes vitales */}
      <Card id="patients-section" sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 500, color: 'success.main' }}>
              Saisie des constantes vitales
            </Typography>
            <Badge badgeContent={checkedInAppointments.length} color="success">
              <MonitorHeart />
            </Badge>
          </Box>

          {checkedInAppointments.length === 0 ? (
            <Box textAlign="center" p={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Tous les patients sont préparés
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Aucun patient en attente de constantes vitales pour le moment.
              </Typography>
              <Button variant="outlined" onClick={() => navigate('/appointments')}>
                Voir le planning
              </Button>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Heure RDV</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Médecin</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Motif</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Statut</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {checkedInAppointments.map((appointment) => (
                    <TableRow key={appointment.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Person sx={{ color: 'primary.main', mr: 1 }} />
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {appointment.patient?.firstName} {appointment.patient?.lastName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccessTime sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {new Date(appointment.date).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocalHospital sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {appointment.doctor?.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {appointment.motif}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <WorkflowStatusChip status={appointment.status} />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={<PlayArrow />}
                          onClick={() => handleEnterVitals(appointment.id)}
                          sx={{ 
                            minWidth: 140,
                            fontWeight: 600
                          }}
                        >
                          Saisir constantes
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

      {/* Section échantillons à collecter */}
      <Card id="samples-section" sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 500, color: 'warning.main' }}>
              Collecte d'échantillons
            </Typography>
            <Badge badgeContent={samplesToCollect.length} color="warning">
              <Science />
            </Badge>
          </Box>

          {samplesToCollect.length === 0 ? (
            <Box textAlign="center" p={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Aucun échantillon à collecter
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tous les échantillons ont été collectés pour le laboratoire.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Médecin prescripteur</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Prescription</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {samplesToCollect.map((prescription) => (
                    <TableRow key={prescription.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Person sx={{ color: 'primary.main', mr: 1 }} />
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {prescription.patient?.firstName} {prescription.patient?.lastName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocalHospital sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {prescription.doctor?.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {prescription.text.substring(0, 50)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(prescription.createdAt).toLocaleDateString('fr-FR')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          color="warning"
                          size="large"
                          startIcon={<CheckCircle />}
                          onClick={() => handleCollectSample(prescription.id)}
                          sx={{ 
                            minWidth: 140,
                            fontWeight: 600
                          }}
                        >
                          Collecter
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
    </Container>
  );
}
