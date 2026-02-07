import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack, Assignment, MedicalServices } from '@mui/icons-material';
import { useNotification } from '../../context/NotificationContext';
import { generateImagingPrescriptionPDF } from '../../utils/pdfGenerator';
import Grid from '@mui/material/GridLegacy';
import { useNavigate, useParams } from 'react-router-dom';
import { appointmentsService } from '../../services/appointmentsService';
import { prescriptionsService } from '../../services/prescriptionsService';
import { Appointment, AppointmentStatus } from '../../types/Appointment';
import { Prescription, PrescriptionStatus } from '../../types/Prescription';
import { differenceInYears, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';

const buildSection = (title: string, content?: string) => {
  if (!content?.trim()) return '';
  return `## ${title}\n${content.trim()}\n`;
};

const buildConsultationNotes = (parts: {
  examenClinique: string;
  diagnosticPrincipal: string;
  diagnosticsAssocies: string;
  diagnosticStatus: string;
  prescriptions: string;
  examens: string;
  soins: string;
  arretTravail: string;
  conclusion: string;
  consignes: string;
  suivi: string;
  traceabilite: string;
}) => {
  return [
    buildSection('Examen clinique', parts.examenClinique),
    buildSection('Diagnostic principal', parts.diagnosticPrincipal),
    buildSection('Diagnostics associes', parts.diagnosticsAssocies),
    buildSection('Statut du diagnostic', parts.diagnosticStatus),
    buildSection('Prescriptions - Medicaments', parts.prescriptions),
    buildSection('Prescriptions - Examens', parts.examens),
    buildSection('Prescriptions - Soins', parts.soins),
    buildSection('Arret de travail', parts.arretTravail),
    buildSection('Conclusion', parts.conclusion),
    buildSection('Consignes patient', parts.consignes),
    buildSection('Suivi', parts.suivi),
    buildSection('Traceabilite', parts.traceabilite),
  ]
    .filter(Boolean)
    .join('\n');
};

const TabPanel = ({ value, index, children }: { value: number; index: number; children: ReactNode }) => {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
};

export const AppointmentConsultationPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [holding, setHolding] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);

  const [examenClinique, setExamenClinique] = useState('');
  const [diagnosticPrincipal, setDiagnosticPrincipal] = useState('');
  const [diagnosticsAssocies, setDiagnosticsAssocies] = useState('');
  const [diagnosticStatus, setDiagnosticStatus] = useState('Provisoire');
  const [prescriptions, setPrescriptions] = useState('');
  const [examens, setExamens] = useState('');
  const [soins, setSoins] = useState('');
  const [arretTravail, setArretTravail] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [consignes, setConsignes] = useState('');
  const [suivi, setSuivi] = useState('');
  const [modificationNote, setModificationNote] = useState('');

  const [labType, setLabType] = useState('');
  const [labUrgency, setLabUrgency] = useState<'STANDARD' | 'URGENT'>('STANDARD');
  const [labComment, setLabComment] = useState('');
  const [sendToLab, setSendToLab] = useState(true);
  const [labRequests, setLabRequests] = useState<Prescription[]>([]);
  const [labLoading, setLabLoading] = useState(false);
  const [labError, setLabError] = useState('');
  const [labSuccess, setLabSuccess] = useState('');
  const labDraftKey = useMemo(() => (id ? `lab-request-draft:${id}` : ''), [id]);

  // États pour imagerie (réutilise les mêmes variables que lab)
  const [imagingRequests, setImagingRequests] = useState<Prescription[]>([]);
  const [imagingLoading, setImagingLoading] = useState(false);
  const [imagingError, setImagingError] = useState('');
  const [imagingSuccess, setImagingSuccess] = useState('');
  const [imagingWithContrast, setImagingWithContrast] = useState(false);
  const [imagingAllergies, setImagingAllergies] = useState('');
  const [imagingPreviousExams, setImagingPreviousExams] = useState('');
  const { showSuccess } = useNotification();

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

  useEffect(() => {
    if (!id) return;
    const fetchLabRequests = async () => {
      try {
        setLabLoading(true);
        const data = await prescriptionsService.getAll({ appointmentId: id });
        // Filtrer par catégorie
        const bioRequests = data.filter((p) => !p.category || p.category === 'BIOLOGIE');
        const imgRequests = data.filter((p) => p.category === 'IMAGERIE');
        setLabRequests(bioRequests);
        setImagingRequests(imgRequests);
      } catch (err: any) {
        setLabError(err.response?.data?.message || 'Erreur lors du chargement des demandes biologiques');
      } finally {
        setLabLoading(false);
      }
    };

    fetchLabRequests();
  }, [id]);

  useEffect(() => {
    if (!labDraftKey) return;
    const raw = window.localStorage.getItem(labDraftKey);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as {
        labType?: string;
        labUrgency?: 'STANDARD' | 'URGENT';
        labComment?: string;
        sendToLab?: boolean;
      };
      if (draft.labType !== undefined) setLabType(draft.labType);
      if (draft.labUrgency !== undefined) setLabUrgency(draft.labUrgency);
      if (draft.labComment !== undefined) setLabComment(draft.labComment);
      if (draft.sendToLab !== undefined) setSendToLab(draft.sendToLab);
    } catch {
      window.localStorage.removeItem(labDraftKey);
    }
  }, [labDraftKey]);

  useEffect(() => {
    if (!labDraftKey) return;
    const payload = JSON.stringify({
      labType,
      labUrgency,
      labComment,
      sendToLab,
    });
    window.localStorage.setItem(labDraftKey, payload);
  }, [labDraftKey, labType, labUrgency, labComment, sendToLab]);

  const isConsultable =
    appointment?.status === AppointmentStatus.IN_CONSULTATION ||
    appointment?.status === AppointmentStatus.WAITING_RESULTS;

  const patientAge = useMemo(() => {
    if (!appointment?.patient?.birthDate) return null;
    return differenceInYears(new Date(), new Date(appointment.patient.birthDate));
  }, [appointment?.patient?.birthDate]);

  const vitalsAlerts = useMemo(() => {
    const items: string[] = [];
    const vitals = appointment?.vitals;
    const systolic = vitals?.bloodPressure?.systolic;
    if (systolic !== undefined && (systolic > 180 || systolic < 90)) {
      items.push('TA systolique hors norme');
    }
    if (vitals?.heartRate !== undefined && vitals.heartRate > 120) {
      items.push('FC elevee');
    }
    if (vitals?.temperature !== undefined && vitals.temperature > 38.5) {
      items.push('Fievre elevee');
    }
    if (vitals?.oxygenSaturation !== undefined && vitals.oxygenSaturation < 92) {
      items.push('SpO2 basse');
    }
    return items;
  }, [appointment?.vitals]);

  const resultsReceived = useMemo(() => {
    return labRequests.filter(
      (req) => req.status === PrescriptionStatus.RESULTS_AVAILABLE || req.status === PrescriptionStatus.COMPLETED
    );
  }, [labRequests]);

  const formatLabStatus = (status: PrescriptionStatus) => {
    switch (status) {
      case PrescriptionStatus.CREATED:
        return 'Créée';
      case PrescriptionStatus.RESULTS_AVAILABLE:
        return 'Résultat reçu';
      case PrescriptionStatus.COMPLETED:
        return 'Validée';
      case PrescriptionStatus.SENT_TO_LAB:
      case PrescriptionStatus.SAMPLE_COLLECTED:
      case PrescriptionStatus.IN_PROGRESS:
        return 'En cours';
      default:
        return status;
    }
  };

  const handleCompleteConsultation = async () => {
    if (!id) return;
    const traceabilite = [
      `Date: ${new Date().toLocaleString('fr-FR')}`,
      user?.name ? `Medecin: ${user.name}` : '',
      modificationNote.trim() ? `Modification apres resultats: ${modificationNote.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const notes = buildConsultationNotes({
      examenClinique,
      diagnosticPrincipal,
      diagnosticsAssocies,
      diagnosticStatus,
      prescriptions,
      examens,
      soins,
      arretTravail,
      conclusion,
      consignes,
      suivi,
      traceabilite,
    });
    if (!notes.trim()) {
      setError('Veuillez saisir au moins un element de consultation');
      return;
    }
    try {
      setSaving(true);
      await appointmentsService.completeConsultation(id, notes);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde de la consultation');
    } finally {
      setSaving(false);
    }
  };

  const handleHoldForResults = async () => {
    if (!appointment) return;
    if (appointment.status !== AppointmentStatus.IN_CONSULTATION) {
      setError('Le dossier doit être en consultation pour être mis en attente');
      return;
    }
    try {
      setHolding(true);
      setError('');
      await appointmentsService.update(appointment.id, {
        status: AppointmentStatus.WAITING_RESULTS,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Erreur lors de la mise en attente des résultats'
      );
    } finally {
      setHolding(false);
    }
  };

  const handleCreateLabRequest = async () => {
    if (!appointment) return;
    if (!labType.trim()) {
      setLabError('Veuillez renseigner le type d\'analyse');
      return;
    }
    try {
      setLabLoading(true);
      setLabError('');
      setLabSuccess('');
      const text = [
        `Demande d'examen biologique`,
        `Type: ${labType.trim()}`,
        `Urgence: ${labUrgency === 'URGENT' ? 'Urgente' : 'Standard'}`,
        labComment.trim() ? `Commentaire clinique: ${labComment.trim()}` : '',
        `Consultation: ${appointment.id}`,
      ]
        .filter(Boolean)
        .join('\n');

      const created = await prescriptionsService.create({
        text,
        category: 'BIOLOGIE',
        patientId: appointment.patientId,
        appointmentId: appointment.id,
      });

      if (sendToLab) {
        await prescriptionsService.sendToLab(created.id);
      }

      const updated = await prescriptionsService.getAll({ appointmentId: appointment.id });
      const bioRequests = updated.filter((p) => !p.category || p.category === 'BIOLOGIE');
      setLabRequests(bioRequests);
      setLabType('');
      setLabComment('');
      setLabUrgency('STANDARD');
      setSendToLab(true);
      if (labDraftKey) {
        window.localStorage.removeItem(labDraftKey);
      }
      setLabSuccess('Demande biologique créée');
    } catch (err: any) {
      setLabError(err.response?.data?.message || 'Erreur lors de la création de la demande');
    } finally {
      setLabLoading(false);
    }
  };

  const handleCreateImagingRequest = async () => {
    if (!appointment) return;
    
    // Validation
    if (!labType.trim()) {
      setImagingError('Veuillez sélectionner le type d\'examen');
      return;
    }
    if (!labComment.trim()) {
      setImagingError('Veuillez préciser la région anatomique');
      return;
    }
    if (!soins.trim()) {
      setImagingError('Veuillez renseigner l\'indication clinique');
      return;
    }
    
    try {
      setImagingLoading(true);
      setImagingError('');
      setImagingSuccess('');
      
      // Construction du texte de la prescription avec tous les détails
      const textParts = [
        `═══════════════════════════════════════════════════`,
        `DEMANDE D'EXAMEN D'IMAGERIE MÉDICALE`,
        `═══════════════════════════════════════════════════`,
        ``,
        `📋 TYPE D'EXAMEN: ${labType.trim()}`,
        `📍 RÉGION ANATOMIQUE: ${labComment.trim()}`,
        `⚡ URGENCE: ${labUrgency === 'URGENT' ? '🔴 URGENTE' : '🟢 Standard'}`,
        imagingWithContrast ? `💉 AVEC INJECTION DE PRODUIT DE CONTRASTE` : '',
        ``,
        `🩺 INDICATION CLINIQUE / RENSEIGNEMENTS CLINIQUES:`,
        soins.trim(),
        ``,
        arretTravail.trim() ? `❓ QUESTION DIAGNOSTIQUE:\n${arretTravail.trim()}\n` : '',
        imagingAllergies.trim() ? `⚠️  ALLERGIES CONNUES:\n${imagingAllergies.trim()}\n` : '',
        imagingPreviousExams.trim() ? `📅 EXAMENS ANTÉRIEURS:\n${imagingPreviousExams.trim()}\n` : '',
        ``,
        `───────────────────────────────────────────────────`,
        `👤 Patient: ${appointment.patient?.firstName} ${appointment.patient?.lastName}`,
        `📅 Date de naissance: ${appointment.patient?.birthDate ? format(new Date(appointment.patient.birthDate), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}`,
        `🆔 Consultation: ${appointment.id}`,
        `👨‍⚕️ Médecin prescripteur: Dr. ${user?.name}`,
        `📅 Date de prescription: ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`,
        `═══════════════════════════════════════════════════`,
      ];
      
      const text = textParts.filter(Boolean).join('\n');

      const created = await prescriptionsService.create({
        text,
        category: 'IMAGERIE',
        patientId: appointment.patientId,
        appointmentId: appointment.id,
      });

      if (sendToLab) {
        await prescriptionsService.sendToLab(created.id);
      }

      const updated = await prescriptionsService.getAll({ appointmentId: appointment.id });
      const imgRequests = updated.filter((p) => p.category === 'IMAGERIE');
      setImagingRequests(imgRequests);
      
      // Réinitialiser les champs
      setLabType('');
      setLabComment('');
      setSoins('');
      setArretTravail('');
      setLabUrgency('STANDARD');
      setImagingWithContrast(false);
      setImagingAllergies('');
      setImagingPreviousExams('');
      setSendToLab(true);
      
      setImagingSuccess('Examen d\'imagerie prescrit avec succès');
    } catch (err: any) {
      setImagingError(err.response?.data?.message || 'Erreur lors de la création de la demande');
    } finally {
      setImagingLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Chargement...
        </Typography>
      </Container>
    );
  }

  if (!appointment) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
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

      {/* Header avec titre et action */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Consultation Medecin
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={handleHoldForResults}
            disabled={appointment.status !== AppointmentStatus.IN_CONSULTATION || holding}
          >
            {holding ? 'Mise en attente...' : 'Mettre en attente de résultats'}
          </Button>
          <Button
            variant="contained"
            onClick={handleCompleteConsultation}
            disabled={!isConsultable || saving}
          >
            {saving ? 'Enregistrement...' : 'Terminer la consultation'}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!isConsultable && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Le rendez-vous doit etre au statut "IN_CONSULTATION" ou "WAITING_RESULTS" pour etre finalise.
        </Alert>
      )}

      <Card sx={{ mb: 3, border: '1px solid rgba(25, 118, 210, 0.15)', bgcolor: 'rgba(25, 118, 210, 0.04)' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                Patient
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                {appointment.patient?.firstName} {appointment.patient?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {patientAge !== null ? `${patientAge} ans` : ''} {appointment.patient?.sex ? `• ${appointment.patient.sex}` : ''}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Motif:</strong> {appointment.motif}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                {format(new Date(appointment.date), "EEEE d MMMM yyyy 'a' HH:mm", { locale: fr })}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {user?.name && <Chip label={`Infirmier/ère: ${user.name}`} size="small" color="primary" variant="outlined" />}
                {appointment.updatedAt && (
                  <Chip label={`Dernière maj: ${format(new Date(appointment.updatedAt), 'dd/MM/yyyy HH:mm')}`} size="small" />
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Constantes recentes
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5, mt: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">TA</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {appointment.vitals?.bloodPressure?.systolic && appointment.vitals?.bloodPressure?.diastolic
                      ? `${appointment.vitals.bloodPressure.systolic}/${appointment.vitals.bloodPressure.diastolic} mmHg`
                      : '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">FC</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {appointment.vitals?.heartRate ? `${appointment.vitals.heartRate} bpm` : '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Temperature</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {appointment.vitals?.temperature ? `${appointment.vitals.temperature} °C` : '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">SpO2</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {appointment.vitals?.oxygenSaturation ? `${appointment.vitals.oxygenSaturation}%` : '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">FR</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {appointment.vitals?.respiratoryRate ? `${appointment.vitals.respiratoryRate}/min` : '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Poids</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {appointment.vitals?.weight ? `${appointment.vitals.weight} kg` : '—'}
                  </Typography>
                </Box>
              </Box>
              {vitalsAlerts.length > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {vitalsAlerts.join(' • ')}
                </Alert>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Tabs
            value={tab}
            onChange={(_, next) => setTab(next)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Infos patient" />
            <Tab label="Antecedents" />
            <Tab label="Examen & diagnostic" />
            <Tab label="Examens Biologiques" />
            <Tab label="Examens Imagerie" />
            <Tab label="Conclusion & suivi" />
          </Tabs>
          <Divider sx={{ mt: 1 }} />

          <TabPanel value={tab} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nom complet"
                  value={`${appointment.patient?.firstName || ''} ${appointment.patient?.lastName || ''}`.trim()}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Age"
                  value={patientAge !== null ? `${patientAge} ans` : ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Sexe"
                  value={appointment.patient?.sex || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Motif"
                  value={appointment.motif}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes infirmier (contexte)"
                  value={appointment.medicalHistoryNotes || ''}
                  multiline
                  minRows={3}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Allergies"
                  value={appointment.patient?.medicalHistory?.allergies?.join(', ') || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Maladies chroniques"
                  value={appointment.patient?.medicalHistory?.chronicDiseases?.join(', ') || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Traitements en cours"
                  value={appointment.patient?.medicalHistory?.currentTreatments?.join(', ') || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Antecedents familiaux"
                  value={appointment.patient?.medicalHistory?.familyHistory || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={appointment.patient?.medicalHistory?.notes || ''}
                  InputProps={{ readOnly: true }}
                  multiline
                  minRows={3}
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <TextField
              fullWidth
              label="Examen clinique"
              value={examenClinique}
              onChange={(e) => setExamenClinique(e.target.value)}
              multiline
              minRows={5}
            />
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Diagnostic principal"
                value={diagnosticPrincipal}
                onChange={(e) => setDiagnosticPrincipal(e.target.value)}
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Diagnostics associes"
                value={diagnosticsAssocies}
                onChange={(e) => setDiagnosticsAssocies(e.target.value)}
                multiline
                minRows={3}
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                select
                label="Statut du diagnostic"
                value={diagnosticStatus}
                onChange={(e) => setDiagnosticStatus(e.target.value)}
              >
                <MenuItem value="Provisoire">Provisoire</MenuItem>
                <MenuItem value="Confirme">Confirme</MenuItem>
              </TextField>
            </Box>
          </TabPanel>

          <TabPanel value={tab} index={3}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Demande d'examen biologique
            </Typography>
            {labError && <Alert severity="error" sx={{ mb: 2 }}>{labError}</Alert>}
            {labSuccess && <Alert severity="success" sx={{ mb: 2 }}>{labSuccess}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Type d'analyse"
                  placeholder="Ex: NFS, CRP, Glycemie..."
                  value={labType}
                  onChange={(e) => setLabType(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Urgence"
                  value={labUrgency}
                  onChange={(e) => setLabUrgency(e.target.value as 'STANDARD' | 'URGENT')}
                >
                  <MenuItem value="STANDARD">Standard</MenuItem>
                  <MenuItem value="URGENT">Urgente</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Commentaire clinique"
                  value={labComment}
                  onChange={(e) => setLabComment(e.target.value)}
                  multiline
                  minRows={3}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Envoyer au labo"
                  value={sendToLab ? 'YES' : 'NO'}
                  onChange={(e) => setSendToLab(e.target.value === 'YES')}
                >
                  <MenuItem value="YES">Oui</MenuItem>
                  <MenuItem value="NO">Non</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button variant="contained" onClick={handleCreateLabRequest} disabled={labLoading}>
                {labLoading ? 'Creation...' : 'Creer la demande'}
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Demandes biologiques liees
            </Typography>
            {labLoading ? (
              <Typography variant="body2" color="text.secondary">
                Chargement...
              </Typography>
            ) : labRequests.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Aucune demande biologique
              </Typography>
            ) : (
              labRequests.map((req) => (
                <Box key={req.id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Statut: {formatLabStatus(req.status)}
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                    {req.text}
                  </Typography>
                </Box>
              ))
            )}

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Resultats biologiques (lecture seule)
            </Typography>
            {resultsReceived.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Aucun resultat disponible
              </Typography>
            ) : (
              resultsReceived.map((req) => (
                <Box key={req.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {formatLabStatus(req.status)}
                    {req.result?.reviewedAt ? ` • ${format(new Date(req.result.reviewedAt), 'dd/MM/yyyy HH:mm')}` : ''}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>
                    Demande
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {req.text}
                  </Typography>
                  {req.result?.text && (
                    <>
                      <Typography variant="subtitle2" sx={{ mt: 2 }}>
                        Resultats
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {req.result.text}
                      </Typography>
                    </>
                  )}
                  {req.result?.interpretation && (
                    <>
                      <Typography variant="subtitle2" sx={{ mt: 2 }}>
                        Interpretation
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {req.result.interpretation}
                      </Typography>
                    </>
                  )}
                </Box>
              ))
            )}

            <TextField
              fullWidth
              label="Ordonnances medicaments"
              value={prescriptions}
              onChange={(e) => setPrescriptions(e.target.value)}
              multiline
              minRows={4}
            />
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Examens (bio, imagerie)"
                value={examens}
                onChange={(e) => setExamens(e.target.value)}
                multiline
                minRows={3}
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Soins infirmiers"
                value={soins}
                onChange={(e) => setSoins(e.target.value)}
                multiline
                minRows={3}
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Arret de travail"
                value={arretTravail}
                onChange={(e) => setArretTravail(e.target.value)}
                multiline
                minRows={2}
              />
            </Box>
          </TabPanel>

          <TabPanel value={tab} index={4}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Demande d'examen d'imagerie
            </Typography>
            {imagingError && <Alert severity="error" sx={{ mb: 2 }}>{imagingError}</Alert>}
            {imagingSuccess && <Alert severity="success" sx={{ mb: 2 }}>{imagingSuccess}</Alert>}
            
            <Card sx={{ mb: 3, bgcolor: '#f8f9fa' }}>
              <CardContent>
                <Grid container spacing={2}>
                  {/* Type d'examen */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      select
                      label="Type d'examen *"
                      value={labType}
                      onChange={(e) => setLabType(e.target.value)}
                      helperText="Sélectionnez le type d'examen radiologique"
                    >
                      <MenuItem value="">-- Sélectionner --</MenuItem>
                      <MenuItem value="Radiographie standard">Radiographie standard</MenuItem>
                      <MenuItem value="Échographie">Échographie</MenuItem>
                      <MenuItem value="Scanner (TDM)">Scanner (TDM)</MenuItem>
                      <MenuItem value="IRM">IRM</MenuItem>
                      <MenuItem value="Mammographie">Mammographie</MenuItem>
                      <MenuItem value="Doppler">Doppler</MenuItem>
                      <MenuItem value="Autre">Autre</MenuItem>
                    </TextField>
                  </Grid>

                  {/* Région anatomique */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Région anatomique *"
                      placeholder="Ex: Thorax, Abdomen, Membre inférieur..."
                      value={labComment}
                      onChange={(e) => setLabComment(e.target.value)}
                      helperText="Précisez la zone à examiner"
                    />
                  </Grid>

                  {/* Urgence */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      select
                      label="Urgence *"
                      value={labUrgency}
                      onChange={(e) => setLabUrgency(e.target.value as 'STANDARD' | 'URGENT')}
                    >
                      <MenuItem value="STANDARD">Standard</MenuItem>
                      <MenuItem value="URGENT">Urgente</MenuItem>
                    </TextField>
                  </Grid>

                  {/* Avec injection */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      select
                      label="Avec injection de produit de contraste"
                      value={imagingWithContrast ? 'YES' : 'NO'}
                      onChange={(e) => setImagingWithContrast(e.target.value === 'YES')}
                    >
                      <MenuItem value="NO">Non</MenuItem>
                      <MenuItem value="YES">Oui</MenuItem>
                    </TextField>
                  </Grid>

                  {/* Envoyer au service */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      select
                      label="Envoyer au radiologue"
                      value={sendToLab ? 'YES' : 'NO'}
                      onChange={(e) => setSendToLab(e.target.value === 'YES')}
                    >
                      <MenuItem value="YES">Oui</MenuItem>
                      <MenuItem value="NO">Non (brouillon)</MenuItem>
                    </TextField>
                  </Grid>

                  {/* Indication clinique */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Indication clinique / Renseignements cliniques *"
                      placeholder="Motif de l'examen, symptômes, antécédents pertinents..."
                      value={soins}
                      onChange={(e) => setSoins(e.target.value)}
                      multiline
                      minRows={3}
                      helperText="Informations nécessaires pour orienter l'examen radiologique"
                    />
                  </Grid>

                  {/* Question diagnostique */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Question diagnostique"
                      placeholder="Ex: Recherche de pneumopathie, éliminer une fracture..."
                      value={arretTravail}
                      onChange={(e) => setArretTravail(e.target.value)}
                      multiline
                      minRows={2}
                      helperText="Question précise à laquelle l'examen doit répondre"
                    />
                  </Grid>

                  {/* Antécédents / Allergies */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Allergies connues"
                      placeholder="Ex: Allergie à l'iode, aux produits de contraste..."
                      value={imagingAllergies}
                      onChange={(e) => setImagingAllergies(e.target.value)}
                      multiline
                      minRows={2}
                    />
                  </Grid>

                  {/* Examens antérieurs */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Examens antérieurs"
                      placeholder="Examens similaires déjà réalisés (dates)"
                      value={imagingPreviousExams}
                      onChange={(e) => setImagingPreviousExams(e.target.value)}
                      multiline
                      minRows={2}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                  <Button 
                    variant="outlined" 
                    color="secondary"
                    startIcon={<Assignment />}
                    onClick={() => {
                      if (!appointment) return;
                      
                      // Validation avant génération
                      if (!labType.trim() || !labComment.trim() || !soins.trim()) {
                        setImagingError('Veuillez remplir tous les champs obligatoires avant de générer le PDF');
                        return;
                      }
                      
                      try {
                        generateImagingPrescriptionPDF({
                          patientName: `${appointment.patient?.firstName} ${appointment.patient?.lastName}`,
                          patientDOB: appointment.patient?.birthDate 
                            ? format(new Date(appointment.patient.birthDate), 'dd/MM/yyyy', { locale: fr })
                            : 'N/A',
                          doctorName: user?.name || 'N/A',
                          examType: labType,
                          anatomicalRegion: labComment,
                          urgency: labUrgency,
                          withContrast: imagingWithContrast,
                          clinicalIndication: soins,
                          diagnosticQuestion: arretTravail || undefined,
                          allergies: imagingAllergies || undefined,
                          previousExams: imagingPreviousExams || undefined,
                          prescriptionDate: new Date(),
                          consultationId: appointment.id,
                        });
                        showSuccess('Prescription PDF générée avec succès');
                      } catch (error) {
                        setImagingError('Erreur lors de la génération du PDF');
                      }
                    }}
                    disabled={!labType || !labComment || !soins}
                  >
                    Générer prescription PDF
                  </Button>
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    onClick={handleCreateImagingRequest} 
                    disabled={imagingLoading}
                    startIcon={<MedicalServices />}
                  >
                    {imagingLoading ? 'Création...' : 'Prescrire examen'}
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Examens d'imagerie prescrits
            </Typography>
            {imagingLoading ? (
              <Typography variant="body2" color="text.secondary">
                Chargement...
              </Typography>
            ) : imagingRequests.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Aucun examen d'imagerie prescrit
              </Typography>
            ) : (
              imagingRequests.map((req) => (
                <Box key={req.id} sx={{ mb: 2, p: 2, border: '1px solid #e3d5ff', borderRadius: 2, bgcolor: '#faf8ff' }}>
                  <Chip 
                    label={formatLabStatus(req.status)} 
                    size="small" 
                    color="secondary"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                    {req.text}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Prescrit le {format(new Date(req.createdAt), 'dd/MM/yyyy à HH:mm')}
                  </Typography>
                </Box>
              ))
            )}
          </TabPanel>

          <TabPanel value={tab} index={5}>
            <TextField
              fullWidth
              label="Conclusion"
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              multiline
              minRows={4}
            />
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Consignes patient"
                value={consignes}
                onChange={(e) => setConsignes(e.target.value)}
                multiline
                minRows={3}
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Suivi / prochain rendez-vous"
                value={suivi}
                onChange={(e) => setSuivi(e.target.value)}
                multiline
                minRows={3}
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Modification apres resultats (traceabilite)"
                value={modificationNote}
                onChange={(e) => setModificationNote(e.target.value)}
                multiline
                minRows={3}
              />
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Container>
  );
};
