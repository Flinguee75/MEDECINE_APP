import { useState, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  Person, LocalHospital, Assignment, Description, Add as AddIcon, MonitorHeart, Science
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types/User';
import { patientsService } from '../../services/patientsService';
import { documentsService } from '../../services/documentsService';
import { appointmentsService } from '../../services/appointmentsService';
import { Patient, MedicalHistory } from '../../types/Patient';
import { CreateDocumentDto } from '../../types/Document';
import { Vitals, Appointment, AppointmentStatus } from '../../types/Appointment';
import { PrescriptionStatus } from '../../types/Prescription';
import { VitalsDialog } from '../Appointments/VitalsDialog';
import { WorkflowStepper } from '../../components/WorkflowStepper/WorkflowStepper';
import { PatientTabsNavigation } from '../../components/PatientTabsNavigation/PatientTabsNavigation';
import { WorkflowStatusChip } from '../../components/StatusChips';

export function PatientMedicalRecord() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDocDialog, setOpenDocDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [openVitalsDialog, setOpenVitalsDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [docFormData, setDocFormData] = useState<CreateDocumentDto>({
    name: '',
    type: '',
    url: '',
    patientId: id || '',
  });
  const [historyFormData, setHistoryFormData] = useState<MedicalHistory>({
    allergies: [],
    chronicDiseases: [],
    familyHistory: [],
    currentTreatments: [],
    notes: '',
  });

  const canEdit = user?.role === Role.DOCTOR || user?.role === Role.ADMIN;
  const canAddDoc = user?.role === Role.SECRETARY || user?.role === Role.DOCTOR || user?.role === Role.ADMIN;
  const canEditVitals = user?.role === Role.DOCTOR || user?.role === Role.BIOLOGIST;

  // Calcul des badges pour les onglets selon spécs UX
  const tabsBadges = {
    pendingVitals: patient?.appointments?.filter(apt => 
      apt.status !== AppointmentStatus.CANCELLED && !apt.vitals
    ).length || 0,
    activePrescriptions: patient?.prescriptions?.filter(presc => 
      presc.status === PrescriptionStatus.CREATED || 
      presc.status === PrescriptionStatus.SENT_TO_LAB ||
      presc.status === PrescriptionStatus.IN_PROGRESS
    ).length || 0,
    newResults: patient?.prescriptions?.filter(presc => 
      presc.status === PrescriptionStatus.RESULTS_AVAILABLE
    ).length || 0,
    unreadNotes: 0 // À implémenter selon vos besoins
  };

  useEffect(() => {
    if (id) {
      loadPatient();
    }
  }, [id]);

  const loadPatient = async () => {
    try {
      const data = await patientsService.getOne(id!);
      setPatient(data);
      if (data.medicalHistory) {
        setHistoryFormData(data.medicalHistory);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHistory = async () => {
    if (!id) return;
    try {
      await patientsService.update(id, { medicalHistory: historyFormData });
      setOpenHistoryDialog(false);
      loadPatient();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleAddDocument = async () => {
    try {
      await documentsService.create(docFormData);
      setOpenDocDialog(false);
      setDocFormData({ name: '', type: '', url: '', patientId: id || '' });
      loadPatient();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de l\'ajout');
    }
  };

  const handleOpenVitals = (appointment: any) => {
    setSelectedAppointment(appointment);
    setOpenVitalsDialog(true);
  };

  const handleSaveVitals = async (vitals: Vitals) => {
    if (!selectedAppointment) return;
    try {
      await appointmentsService.update(selectedAppointment.id, { vitals });
      setOpenVitalsDialog(false);
      loadPatient();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la sauvegarde des constantes');
    }
  };

  if (loading) return <Typography>Chargement...</Typography>;
  if (!patient) return <Typography>Patient non trouvé</Typography>;
  if (user?.role === Role.SECRETARY) {
    return <Navigate to="/patients" replace />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">
            <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
            Dossier Médical - {patient.firstName} {patient.lastName}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Né(e) le {new Date(patient.birthDate).toLocaleDateString()}
          </Typography>
        </Box>
      </Box>

      {/* Workflow Progress Stepper - Toujours visible selon spécs UX */}
      <Box sx={{ mb: 4 }}>
        <WorkflowStepper
          appointments={patient.appointments}
          prescriptions={patient.prescriptions}
        />
      </Box>

      {/* Navigation par onglets avec badges selon spécs UX */}
      <PatientTabsNavigation 
        userRole={user!.role}
        badges={tabsBadges}
        children={{
          informations: (
            <Grid container spacing={3}>
              {/* Antécédents Médicaux */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        <LocalHospital sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Antécédents Médicaux
                      </Typography>
                      {canEdit && (
                        <Button size="small" onClick={() => setOpenHistoryDialog(true)}>
                          Modifier
                        </Button>
                      )}
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="text.secondary">Allergies</Typography>
                        {patient.medicalHistory?.allergies && patient.medicalHistory.allergies.length > 0 ? (
                          <Box mt={1}>
                            {patient.medicalHistory.allergies.map((a, i) => (
                              <Chip key={i} label={a} size="small" color="error" sx={{ mr: 0.5, mb: 0.5 }} />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2">Aucune</Typography>
                        )}
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="text.secondary">Maladies Chroniques</Typography>
                        {patient.medicalHistory?.chronicDiseases && patient.medicalHistory.chronicDiseases.length > 0 ? (
                          <Box mt={1}>
                            {patient.medicalHistory.chronicDiseases.map((c, i) => (
                              <Chip key={i} label={c} size="small" color="warning" sx={{ mr: 0.5, mb: 0.5 }} />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2">Aucune</Typography>
                        )}
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="text.secondary">Antécédents Familiaux</Typography>
                        {patient.medicalHistory?.familyHistory && patient.medicalHistory.familyHistory.length > 0 ? (
                          <List dense>
                            {patient.medicalHistory.familyHistory.map((f, i) => (
                              <ListItem key={i}><ListItemText primary={f} /></ListItem>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="body2">Aucun</Typography>
                        )}
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="text.secondary">Traitements en Cours</Typography>
                        {patient.medicalHistory?.currentTreatments && patient.medicalHistory.currentTreatments.length > 0 ? (
                          <List dense>
                            {patient.medicalHistory.currentTreatments.map((t, i) => (
                              <ListItem key={i}><ListItemText primary={t} /></ListItem>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="body2">Aucun</Typography>
                        )}
                      </Grid>

                      {patient.medicalHistory?.notes && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                          <Typography variant="body2">{patient.medicalHistory.notes}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Documents */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Documents Partagés
                      </Typography>
                      {canAddDoc && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => setOpenDocDialog(true)}
                        >
                          Ajouter
                        </Button>
                      )}
                    </Box>
                    <List>
                      {patient.documents && patient.documents.length > 0 ? (
                        patient.documents.map((doc: any) => (
                          <ListItem key={doc.id} divider>
                            <ListItemText
                              primary={doc.name}
                              secondary={`${doc.type} - ${new Date(doc.createdAt).toLocaleDateString()}`}
                            />
                            <Button size="small" href={doc.url} target="_blank">Voir</Button>
                          </ListItem>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">Aucun document</Typography>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ),
          constantes: (
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    <MonitorHeart sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Constantes Vitales
                  </Typography>
                  {tabsBadges.pendingVitals > 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      {tabsBadges.pendingVitals} constante{tabsBadges.pendingVitals > 1 ? 's' : ''} en attente de saisie
                    </Alert>
                  )}
                </Box>

                {patient.appointments && patient.appointments.length > 0 ? (
                  <List>
                    {patient.appointments
                      .filter(apt => apt.status !== AppointmentStatus.CANCELLED)
                      .map((apt) => (
                        <ListItem key={apt.id}>
                          <ListItemText
                            primary={`${new Date(apt.date).toLocaleDateString()} - ${apt.motif}`}
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <WorkflowStatusChip status={apt.status} />
                                {apt.vitals && (
                                  <Box sx={{ mt: 1, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <Typography variant="caption">Poids: {apt.vitals.weight}kg</Typography>
                                    <Typography variant="caption">Taille: {apt.vitals.height}cm</Typography>
                                    <Typography variant="caption">Tension: {apt.vitals.bloodPressure}</Typography>
                                    <Typography variant="caption">Pouls: {apt.vitals.heartRate}bpm</Typography>
                                    <Typography variant="caption">Temp: {apt.vitals.temperature}°C</Typography>
                                  </Box>
                                )}
                              </Box>
                            }
                          />
                          {canEditVitals && (
                            <Button
                              size="small"
                              variant={apt.vitals ? "outlined" : "contained"}
                              onClick={() => handleOpenVitals(apt)}
                            >
                              {apt.vitals ? 'Modifier' : 'Saisir'}
                            </Button>
                          )}
                        </ListItem>
                      ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">Aucune consultation</Typography>
                )}
              </CardContent>
            </Card>
          ),
          prescriptions: (
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    <Science sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Prescriptions
                  </Typography>
                  {tabsBadges.activePrescriptions > 0 && (
                    <Chip 
                      label={`${tabsBadges.activePrescriptions} active${tabsBadges.activePrescriptions > 1 ? 's' : ''}`}
                      color="warning"
                      size="small"
                    />
                  )}
                </Box>

                {patient.prescriptions && patient.prescriptions.length > 0 ? (
                  <List>
                    {patient.prescriptions.map((prescription) => (
                      <ListItem key={prescription.id}>
                        <ListItemText
                          primary={prescription.text.substring(0, 100) + (prescription.text.length > 100 ? '...' : '')}
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption">
                                Dr. {prescription.doctor?.name} - {new Date(prescription.createdAt).toLocaleDateString()}
                              </Typography>
                              <Box sx={{ mt: 0.5 }}>
                                <WorkflowStatusChip status={prescription.status as any} />
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">Aucune prescription</Typography>
                )}
              </CardContent>
            </Card>
          ),
          resultats: (
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Résultats d'Analyses
                  </Typography>
                  {tabsBadges.newResults > 0 && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {tabsBadges.newResults} nouveau{tabsBadges.newResults > 1 ? 'x' : ''} résultat{tabsBadges.newResults > 1 ? 's' : ''} disponible{tabsBadges.newResults > 1 ? 's' : ''}
                    </Alert>
                  )}
                </Box>

                {patient.prescriptions?.filter(p => p.status === PrescriptionStatus.RESULTS_AVAILABLE) && 
                 patient.prescriptions.filter(p => p.status === PrescriptionStatus.RESULTS_AVAILABLE).length > 0 ? (
                  <List>
                    {patient.prescriptions
                      .filter(p => p.status === PrescriptionStatus.RESULTS_AVAILABLE)
                      .map((prescription) => (
                        <ListItem key={prescription.id}>
                          <ListItemText
                            primary={`Analyse - ${prescription.text.substring(0, 50)}...`}
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2">
                                  <strong>Résultats disponibles</strong>
                                </Typography>
                                <Typography variant="caption">
                                  Prescription du {new Date(prescription.createdAt).toLocaleDateString()}
                                </Typography>
                                <Box sx={{ mt: 0.5 }}>
                                  <WorkflowStatusChip status={prescription.status as any} />
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">Aucun résultat disponible</Typography>
                )}
              </CardContent>
            </Card>
          ),
          notes: (
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Notes Médicales
                  </Typography>
                  {canEdit && (
                    <Button size="small" startIcon={<AddIcon />}>
                      Ajouter Note
                    </Button>
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Cette section contiendra les notes médicales des consultations.
                  Fonctionnalité à implémenter selon vos besoins spécifiques.
                </Typography>
              </CardContent>
            </Card>
          ),
        }}
      />

      {/* Dialog Antécédents */}
      <Dialog open={openHistoryDialog} onClose={() => setOpenHistoryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Modifier les Antécédents Médicaux</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Allergies (séparées par des virgules)"
            value={historyFormData.allergies?.join(', ') || ''}
            onChange={(e) =>
              setHistoryFormData({
                ...historyFormData,
                allergies: e.target.value.split(',').map((s) => s.trim()).filter((s) => s),
              })
            }
          />
          <TextField
            fullWidth
            margin="normal"
            label="Maladies chroniques (séparées par des virgules)"
            value={historyFormData.chronicDiseases?.join(', ') || ''}
            onChange={(e) =>
              setHistoryFormData({
                ...historyFormData,
                chronicDiseases: e.target.value.split(',').map((s) => s.trim()).filter((s) => s),
              })
            }
          />
          <TextField
            fullWidth
            margin="normal"
            label="Antécédents familiaux (séparés par des virgules)"
            value={historyFormData.familyHistory?.join(', ') || ''}
            onChange={(e) =>
              setHistoryFormData({
                ...historyFormData,
                familyHistory: e.target.value.split(',').map((s) => s.trim()).filter((s) => s),
              })
            }
          />
          <TextField
            fullWidth
            margin="normal"
            label="Traitements en cours (séparés par des virgules)"
            value={historyFormData.currentTreatments?.join(', ') || ''}
            onChange={(e) =>
              setHistoryFormData({
                ...historyFormData,
                currentTreatments: e.target.value.split(',').map((s) => s.trim()).filter((s) => s),
              })
            }
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            margin="normal"
            label="Notes complémentaires"
            value={historyFormData.notes || ''}
            onChange={(e) => setHistoryFormData({ ...historyFormData, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistoryDialog(false)}>Annuler</Button>
          <Button onClick={handleSaveHistory} variant="contained">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Documents */}
      <Dialog open={openDocDialog} onClose={() => setOpenDocDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter un Document</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Nom du document"
            value={docFormData.name}
            onChange={(e) => setDocFormData({ ...docFormData, name: e.target.value })}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Type (ordonnance, radio, analyse...)"
            value={docFormData.type}
            onChange={(e) => setDocFormData({ ...docFormData, type: e.target.value })}
          />
          <TextField
            fullWidth
            margin="normal"
            label="URL du document"
            value={docFormData.url}
            onChange={(e) => setDocFormData({ ...docFormData, url: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDocDialog(false)}>Annuler</Button>
          <Button onClick={handleAddDocument} variant="contained">
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Constantes Vitales */}
      <VitalsDialog
        open={openVitalsDialog}
        onClose={() => setOpenVitalsDialog(false)}
        onSave={handleSaveVitals}
        initialVitals={selectedAppointment?.vitals}
        readOnly={!canEditVitals}
      />
    </Container>
  );
}
