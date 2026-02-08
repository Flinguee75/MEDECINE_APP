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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
import { resultsService } from '../../../services/resultsService';
import { patientsService } from '../../../services/patientsService';
import { Appointment, AppointmentStatus } from '../../../types/Appointment';
import { Patient } from '../../../types/Patient';
import { Result } from '../../../types/Result';
import { PrescriptionStatusChip } from '../../../components/StatusChips';

interface PatientHistoryItem {
  patientId: string;
  fullName: string;
  lastAppointmentDate: string;
  lastStatus: AppointmentStatus;
}

export function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [consultationsReady, setConsultationsReady] = useState<Appointment[]>([]);
  const [waitingResults, setWaitingResults] = useState<Appointment[]>([]);
  const [resultsToReview, setResultsToReview] = useState<Result[]>([]);
  const [registeredPatients, setRegisteredPatients] = useState<Patient[]>([]);
  const [patientHistoryItems, setPatientHistoryItems] = useState<PatientHistoryItem[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAppointment, setPendingAppointment] = useState<Appointment | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appointments, pendingResults, allDoctorAppointments, allPatients] = await Promise.all([
        appointmentsService.getAll(
          user?.id,
          undefined,
          undefined,
          [
            AppointmentStatus.CHECKED_IN,
            AppointmentStatus.IN_CONSULTATION,
            AppointmentStatus.WAITING_RESULTS,
          ],
        ),
        resultsService.getPendingReview(),
        appointmentsService.getAll(user?.id),
        patientsService.getAll(),
      ]);

      // Consultations prêtes = constantes validées ou en attente de résultats
      setConsultationsReady(
        appointments.filter(
          (apt) =>
            apt.status === AppointmentStatus.CHECKED_IN ||
            apt.status === AppointmentStatus.IN_CONSULTATION
        )
      );

      // En attente résultats = consultations terminées, prescriptions envoyées au labo
      setWaitingResults(
        appointments.filter((apt) => apt.status === AppointmentStatus.WAITING_RESULTS)
      );

      // Résultats à réviser = prescriptions avec résultats disponibles
      setResultsToReview(pendingResults);
      setRegisteredPatients(allPatients);

      // Historique patients: dernier rendez-vous par patient
      const sorted = [...allDoctorAppointments]
        .filter((apt) => apt.patient && apt.status !== AppointmentStatus.CANCELLED)
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
      const unique = new Map<string, PatientHistoryItem>();
      sorted.forEach((apt) => {
        if (!apt.patient || unique.has(apt.patientId)) return;
        unique.set(apt.patientId, {
          patientId: apt.patientId,
          fullName: `${apt.patient.firstName} ${apt.patient.lastName}`,
          lastAppointmentDate: apt.date,
          lastStatus: apt.status,
        });
      });
      setPatientHistoryItems(Array.from(unique.values()));
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

  const startConsultation = async (appointment: Appointment) => {
    try {
      if (appointment.status === AppointmentStatus.CHECKED_IN) {
        await appointmentsService.update(appointment.id, {
          status: AppointmentStatus.IN_CONSULTATION,
        });
      }
      showSuccess('Consultation démarrée');
      navigate(`/appointments/${appointment.id}/consult`);
    } catch (error) {
      showError('Erreur lors du démarrage de la consultation');
    }
  };

  const handleStartConsultation = async (appointment: Appointment) => {
    if (appointment.status === AppointmentStatus.CHECKED_IN && !appointment.vitals) {
      setPendingAppointment(appointment);
      setConfirmOpen(true);
      return;
    }

    await startConsultation(appointment);
  };

  const handleReviewResult = (prescriptionId: string) => {
    navigate(`/prescriptions/${prescriptionId}/review`);
  };

  const handleOpenWaitingConsultation = (appointmentId: string) => {
    navigate(`/appointments/${appointmentId}/consult`);
  };

  const handleViewPatient = (patientId: string) => {
    navigate(`/patients/${patientId}/medical-record`);
  };

  const handleConfirmStart = async () => {
    if (!pendingAppointment) return;
    setConfirmOpen(false);
    await startConsultation(pendingAppointment);
    setPendingAppointment(null);
  };

  const createFakeConsultations = async () => {
    try {
      setLoading(true);
      showSuccess('Création de consultations de test en cours...');
      
      // Créer 3 fausses consultations avec des données réalistes
      const fakePatients = [
        { firstName: 'Konan', lastName: 'Diallo', motif: 'Contrôle de routine' },
        { firstName: 'Aya', lastName: 'Touré', motif: 'Douleurs abdominales' },
        { firstName: 'Yao', lastName: 'Kouamé', motif: 'Suivi post-opératoire' },
      ];

      for (const patient of fakePatients) {
        // Créer le patient avec le service
        const newPatient = await patientsService.create({
          firstName: patient.firstName,
          lastName: patient.lastName,
          birthDate: new Date(1980 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString(),
          sex: Math.random() > 0.5 ? 'M' : 'F',
          phone: `+225 07 ${Math.floor(Math.random() * 90000000 + 10000000)}`,
          address: 'Abidjan, Côte d\'Ivoire',
          emergencyContact: '',
          insurance: '',
          consentMedicalData: true,
          consentContact: true,
        });

        // Créer le rendez-vous avec le service
        await appointmentsService.create({
          patientId: newPatient.id,
          doctorId: user?.id || '',
          date: new Date().toISOString(),
          motif: patient.motif,
        });
      }

      showSuccess('3 consultations de test créées avec succès !');
      await loadData();
    } catch (error: any) {
      console.error('Erreur lors de la création des consultations:', error);
      showError(error.response?.data?.message || 'Erreur lors de la création des consultations de test');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestVitals = () => {
    if (!pendingAppointment) return;
    setConfirmOpen(false);
    appointmentsService
      .requestVitals(pendingAppointment.id)
      .then(() => {
        showSuccess("Demande envoyée à l'infirmière pour la prise des constantes");
        loadData();
      })
      .catch(() => {
        showError("Erreur lors de l'envoi de la demande");
      })
      .finally(() => {
        setPendingAppointment(null);
      });
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
      {/* Header avec nom médecin, date et actions rapides */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
  
        </Box>
        
        {/* Boutons d'action rapide - Déplacés en haut */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<EventNote />}
            onClick={() => navigate('/appointments')}
          >
            Agenda
          </Button>
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => navigate('/results')}
          >
            Résultats
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={createFakeConsultations}
            disabled={loading}
          >
            Créer consultations test
          </Button>
        </Box>
      </Box>

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
                <MedicalServices sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
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
                <Assessment sx={{ 
                  fontSize: 40, 
                  color: resultsToReview.length > 0 ? 'error.main' : 'text.secondary', 
                  opacity: 0.7 
                }} />
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
                          {!appointment.vitals ? (
                            <Chip
                              icon={<AccessTime />}
                              label="En attente des constantes"
                              color="warning"
                              size="small"
                              variant="outlined"
                            />
                          ) : appointment.status === AppointmentStatus.WAITING_RESULTS ? (
                            <Chip
                              icon={<Schedule />}
                              label="En attente des résultats"
                              color="info"
                              size="small"
                              variant="outlined"
                            />
                          ) : (
                            <Chip
                              icon={<CheckCircle />}
                              label="Constantes validées"
                              color="success"
                              size="small"
                              variant="outlined"
                            />
                          )}
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
                          {appointment.status === AppointmentStatus.WAITING_RESULTS ? 'Continuer' : 'Démarrer'}
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

      {/* Section accès dossiers médicaux des patients enregistrés */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 500 }}>
              Dossiers médicaux des patients enregistrés
            </Typography>
            <Chip
              label={`${registeredPatients.length} patient${registeredPatients.length > 1 ? 's' : ''}`}
              color="primary"
              variant="outlined"
            />
          </Box>

          {registeredPatients.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Aucun patient enregistré.
            </Typography>
          ) : (
            <List disablePadding>
              {registeredPatients.slice(0, 8).map((patient, index) => (
                <Box key={patient.id}>
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemText
                      primary={`${patient.firstName} ${patient.lastName}`}
                      secondary={patient.phone || 'Téléphone non renseigné'}
                    />
                    <ListItemSecondaryAction>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleViewPatient(patient.id)}
                      >
                        Ouvrir dossier
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < Math.min(registeredPatients.length, 8) - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Section consultations en attente de résultats */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 500 }}>
              Consultations en attente de résultats
            </Typography>
            <Chip
              label={`${waitingResults.length} dossier${waitingResults.length > 1 ? 's' : ''}`}
              color="warning"
              variant="outlined"
            />
          </Box>

          {waitingResults.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Aucune consultation en attente de résultats.
            </Typography>
          ) : (
            <List disablePadding>
              {waitingResults.map((appointment, index) => (
                <Box key={appointment.id}>
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemText
                      primary={`${appointment.patient?.firstName} ${appointment.patient?.lastName}`}
                      secondary={`Motif: ${appointment.motif}`}
                    />
                    <ListItemSecondaryAction>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenWaitingConsultation(appointment.id)}
                      >
                        Ouvrir
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < waitingResults.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Section historique patients */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 500 }}>
              Historique patients
            </Typography>
            <Chip
              label={`${patientHistoryItems.length} patient${patientHistoryItems.length > 1 ? 's' : ''}`}
              color="info"
              variant="outlined"
            />
          </Box>

          {patientHistoryItems.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Aucun historique patient disponible.
            </Typography>
          ) : (
            <List disablePadding>
              {patientHistoryItems.slice(0, 8).map((item, index) => (
                <Box key={item.patientId}>
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemText
                      primary={item.fullName}
                      secondary={`Dernier RDV: ${new Date(item.lastAppointmentDate).toLocaleDateString('fr-FR')} - ${item.lastStatus}`}
                    />
                    <ListItemSecondaryAction>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleViewPatient(item.patientId)}
                      >
                        Voir dossier
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < Math.min(patientHistoryItems.length, 8) - 1 && <Divider />}
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
              {resultsToReview.slice(0, 3).map((result, index) => (
                <Box key={result.id}>
                  <ListItem sx={{ px: 0, py: 2 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 500 }}>
                            {result.prescription?.patient?.firstName} {result.prescription?.patient?.lastName}
                          </Typography>
                          {result.prescription?.status && (
                            <PrescriptionStatusChip status={result.prescription.status} />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          <Assignment sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                          {(result.text || '').substring(0, 80)}...
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleReviewResult(result.prescriptionId)}
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

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Constantes non validées</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Les constantes vitales ne sont pas encore validées. Voulez-vous démarrer
            la consultation quand même ou envoyer une demande à l'infirmière ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Annuler</Button>
          <Button variant="outlined" onClick={handleRequestVitals}>
            Demander les constantes
          </Button>
          <Button variant="contained" color="warning" onClick={handleConfirmStart}>
            Démarrer quand même
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
