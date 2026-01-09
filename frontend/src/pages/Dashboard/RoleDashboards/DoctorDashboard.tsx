import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Alert,
  Card,
  CardContent,
  CardActions,
  Badge,
  Divider,
  Skeleton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { 
  MedicalServices, 
  Assessment, 
  EventNote,
  PlayArrow,
  Visibility,
  CheckCircle,
  Schedule,
  Person,
  AccessTime,
  Assignment,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { appointmentsService } from '../../../services/appointmentsService';
import { prescriptionsService } from '../../../services/prescriptionsService';
import { Appointment, AppointmentStatus } from '../../../types/Appointment';
import { Prescription, PrescriptionStatus } from '../../../types/Prescription';
import { WorkflowStatusChip, PrescriptionStatusChip } from '../../../components/StatusChips';

export function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [consultationsReady, setConsultationsReady] = useState<Appointment[]>([]);
  const [waitingResults, setWaitingResults] = useState<Appointment[]>([]);
  const [resultsToReview, setResultsToReview] = useState<Prescription[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const appointments = await appointmentsService.getAll(user?.id);
      const prescriptions = await prescriptionsService.getAll({ doctorId: user?.id });

      // Consultations prêtes = RDV avec constantes validées mais pas encore en consultation
      setConsultationsReady(
        appointments.filter((apt) => apt.status === AppointmentStatus.CHECKED_IN)
      );

      // En attente résultats = consultations terminées, prescriptions envoyées au labo
      setWaitingResults(
        appointments.filter((apt) => apt.status === AppointmentStatus.WAITING_RESULTS)
      );

      // Résultats à réviser = prescriptions avec résultats disponibles
      setResultsToReview(
        prescriptions.filter((p) => p.status === PrescriptionStatus.RESULTS_AVAILABLE)
      );
    } catch (error) {
      console.error('Failed to load data:', error);
      showError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handleStartConsultation = async (appointment: Appointment) => {
    try {
      showSuccess('Consultation démarrée');
      navigate(`/appointments/${appointment.id}/consult`);
    } catch (error) {
      showError('Erreur lors du démarrage de la consultation');
    }
  };

  const handleReviewResult = (prescriptionId: string) => {
    navigate(`/prescriptions/${prescriptionId}/review`);
  };

  const handleViewPatient = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  // Loading skeleton selon spécs UX - jamais de page blanche
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width={300} height={48} />
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header - Point d'entrée direct "Consultations du jour" selon spécs UX */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 500, color: 'primary.main' }}>
          Consultations du jour
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {new Date().toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Typography>
        
        {/* Alert prioritaire - Résultats à réviser selon spécs UX */}
        {resultsToReview.length > 0 && (
          <Alert 
            severity="warning" 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small"
                onClick={() => navigate('/results')}
              >
                Voir tout
              </Button>
            }
          >
            <strong>{resultsToReview.length} résultat{resultsToReview.length > 1 ? 's' : ''}</strong> 
            {' '}disponible{resultsToReview.length > 1 ? 's' : ''} à réviser
          </Alert>
        )}
      </Box>

      {/* Cards statistiques avec badges - Opportunity #2: Contextual CTAs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ height: '100%', cursor: 'pointer' }}
            onClick={() => {}} // Scroll vers section consultations
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Prêtes à consulter
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 600 }}>
                    {consultationsReady.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Constantes validées
                  </Typography>
                </Box>
                <Badge 
                  badgeContent={consultationsReady.length} 
                  color="primary"
                  sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem' } }}
                >
                  <MedicalServices sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    En attente résultats
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'warning.main', fontWeight: 600 }}>
                    {waitingResults.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Analyses en cours
                  </Typography>
                </Box>
                <Schedule sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%', 
              cursor: resultsToReview.length > 0 ? 'pointer' : 'default',
              border: resultsToReview.length > 0 ? '2px solid' : '1px solid',
              borderColor: resultsToReview.length > 0 ? 'warning.main' : 'divider'
            }}
            onClick={() => resultsToReview.length > 0 && navigate('/results')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Résultats disponibles
                  </Typography>
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      color: resultsToReview.length > 0 ? 'error.main' : 'text.secondary', 
                      fontWeight: 600 
                    }}
                  >
                    {resultsToReview.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    À réviser et interpréter
                  </Typography>
                </Box>
                <Badge 
                  badgeContent={resultsToReview.length} 
                  color="error"
                  sx={{ 
                    '& .MuiBadge-badge': { 
                      fontSize: '0.75rem',
                      display: resultsToReview.length > 0 ? 'block' : 'none'
                    } 
                  }}
                >
                  <Assessment sx={{ 
                    fontSize: 40, 
                    color: resultsToReview.length > 0 ? 'error.main' : 'text.secondary', 
                    opacity: 0.7 
                  }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Section principale - Consultations prêtes selon Challenge #2: Actions contextuelles évidentes */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 500 }}>
              Consultations prêtes
            </Typography>
            <Chip 
              label={`${consultationsReady.length} patient${consultationsReady.length > 1 ? 's' : ''}`}
              color="primary"
              variant="outlined"
            />
          </Box>
          
          {consultationsReady.length === 0 ? (
            // État vide selon spécs UX - toujours un message + action
            <Box textAlign="center" py={4}>
              <MedicalServices sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Aucune consultation prête
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Tous vos patients sont soit déjà en consultation, soit en attente des constantes vitales.
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<EventNote />}
                onClick={() => navigate('/appointments')}
              >
                Voir tous les rendez-vous
              </Button>
            </Box>
          ) : (
            <List disablePadding>
              {consultationsReady.map((appointment, index) => (
                <Box key={appointment.id}>
                  <ListItem sx={{ px: 0, py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                      <Person sx={{ color: 'primary.main', mr: 1 }} />
                    </Box>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 500 }}>
                            {appointment.patient?.firstName} {appointment.patient?.lastName}
                          </Typography>
                          <WorkflowStatusChip status={appointment.status} />
                          <Chip 
                            icon={<CheckCircle />}
                            label="Constantes validées" 
                            color="success" 
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Motif:</strong> {appointment.motif}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <AccessTime sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            {new Date(appointment.date).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          onClick={() => handleViewPatient(appointment.patient?.id || '')}
                          sx={{ mr: 1 }}
                        >
                          <Visibility />
                        </IconButton>
                        {/* Bouton primaire GÉANT selon spécs UX */}
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={<PlayArrow />}
                          onClick={() => handleStartConsultation(appointment)}
                          sx={{ 
                            minWidth: 140,
                            fontWeight: 600,
                            fontSize: '1rem'
                          }}
                        >
                          Démarrer
                        </Button>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < consultationsReady.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Section résultats à réviser - Priorité haute selon spécs */}
      {resultsToReview.length > 0 && (
        <Card sx={{ mb: 4, border: '2px solid', borderColor: 'warning.main' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 500, color: 'error.main' }}>
                Résultats à réviser
              </Typography>
              <Badge badgeContent={resultsToReview.length} color="error">
                <Assessment />
              </Badge>
            </Box>
            
            <List disablePadding>
              {resultsToReview.slice(0, 3).map((prescription, index) => (
                <Box key={prescription.id}>
                  <ListItem sx={{ px: 0, py: 2 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 500 }}>
                            {prescription.patient?.firstName} {prescription.patient?.lastName}
                          </Typography>
                          <PrescriptionStatusChip status={prescription.status} />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          <Assignment sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                          {prescription.text.substring(0, 80)}...
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleReviewResult(prescription.id)}
                        sx={{ minWidth: 120 }}
                      >
                        Réviser
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < Math.min(resultsToReview.length, 3) - 1 && <Divider />}
                </Box>
              ))}
            </List>
            
            {resultsToReview.length > 3 && (
              <CardActions sx={{ pt: 2, px: 0 }}>
                <Button 
                  variant="outlined" 
                  color="error" 
                  fullWidth
                  onClick={() => navigate('/results')}
                >
                  Voir tous les résultats ({resultsToReview.length})
                </Button>
              </CardActions>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions rapides */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Button
            variant="outlined"
            fullWidth
            size="large"
            startIcon={<EventNote />}
            onClick={() => navigate('/appointments')}
            sx={{ py: 2 }}
          >
            Voir tout le planning
          </Button>
        </Grid>
        <Grid item xs={12} md={6}>
          <Button
            variant="outlined"
            fullWidth
            size="large"
            startIcon={<Assignment />}
            onClick={() => navigate('/prescriptions')}
            sx={{ py: 2 }}
          >
            Mes prescriptions
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
}
