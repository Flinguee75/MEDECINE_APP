import { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { ExpandMore, Save, Check, AutoAwesome } from '@mui/icons-material';
import { Vitals } from '../../types/Appointment';
import { vitalHistoryService, VitalHistory } from '../../services/vitalHistoryService';
import { appointmentsService } from '../../services/appointmentsService';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface VitalsEntryFormProps {
  appointmentId: string;
  patientId: string;
  onVitalsSubmitted?: () => void;
}

const emptyVitals: Vitals = {
  weight: undefined,
  height: undefined,
  bloodPressure: {
    systolic: undefined,
    diastolic: undefined,
  },
  temperature: undefined,
  heartRate: undefined,
  respiratoryRate: undefined,
  oxygenSaturation: undefined,
  painScore: undefined,
  bloodPressurePosition: '',
  bloodPressureArm: '',
};

export const VitalsEntryForm = ({
  appointmentId,
  patientId,
  onVitalsSubmitted,
}: VitalsEntryFormProps) => {
  const { user } = useAuth();
  const [vitals, setVitals] = useState<Vitals>(emptyVitals);
  const [medicalHistoryNotes, setMedicalHistoryNotes] = useState('');
  const [history, setHistory] = useState<VitalHistory[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Charger le brouillon existant et l'historique au montage
  useEffect(() => {
    loadDraft();
    loadHistory();
  }, [appointmentId, patientId]);

  const loadDraft = async () => {
    try {
      setLoading(true);
      const draft = await vitalHistoryService.getDraft(appointmentId);
      if (draft) {
        setVitals(draft.vitals);
        setMedicalHistoryNotes(draft.medicalHistoryNotes || '');
        setDraftId(draft.id);
      }
    } catch (err) {
      console.error('Erreur chargement brouillon:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await vitalHistoryService.getPatientHistory(patientId);
      setHistory(data);
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const isFormValid = useMemo(() => {
    return Boolean(
      vitals.weight ||
        vitals.height ||
        vitals.temperature ||
        vitals.heartRate ||
        vitals.bloodPressure?.systolic ||
        vitals.bloodPressure?.diastolic ||
        vitals.respiratoryRate ||
        vitals.oxygenSaturation ||
        vitals.painScore
    );
  }, [vitals]);

  const alerts = useMemo(() => {
    const items: string[] = [];
    const systolic = vitals.bloodPressure?.systolic;
    if (systolic !== undefined && (systolic > 180 || systolic < 90)) {
      items.push('TA hors norme (systolique)');
    }
    if (vitals.heartRate !== undefined && vitals.heartRate > 120) {
      items.push('Fréquence cardiaque élevée');
    }
    if (vitals.temperature !== undefined && vitals.temperature > 38.5) {
      items.push('Fièvre élevée');
    }
    if (vitals.oxygenSaturation !== undefined && vitals.oxygenSaturation < 92) {
      items.push('Saturation O2 basse');
    }
    return items;
  }, [vitals]);

  const handleSaveDraft = async () => {
    if (!isFormValid) {
      setError('Veuillez renseigner au moins une constante');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const systolic = vitals.bloodPressure?.systolic;
      const diastolic = vitals.bloodPressure?.diastolic;
      const bloodPressure =
        systolic !== undefined || diastolic !== undefined
          ? { systolic, diastolic }
          : undefined;

      const saved = await vitalHistoryService.autoSave({
        appointmentId,
        patientId,
        vitals: {
          weight: vitals.weight,
          height: vitals.height,
          temperature: vitals.temperature,
          heartRate: vitals.heartRate,
          bloodPressure,
          respiratoryRate: vitals.respiratoryRate,
          oxygenSaturation: vitals.oxygenSaturation,
          painScore: vitals.painScore,
          bloodPressurePosition: vitals.bloodPressurePosition || undefined,
          bloodPressureArm: vitals.bloodPressureArm || undefined,
        },
        medicalHistoryNotes: medicalHistoryNotes || undefined,
      });

      setDraftId(saved.id);
      setSuccess('Brouillon sauvegardé avec succès');
      loadHistory();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde du brouillon');
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    if (!isFormValid) {
      setError('Veuillez renseigner au moins une constante');
      return;
    }

    if (!draftId) {
      setError('Veuillez d\'abord sauvegarder un brouillon');
      return;
    }

    try {
      setFinalizing(true);
      setError('');
      setSuccess('');

      // Finaliser le brouillon
      await vitalHistoryService.finalize(draftId);

      // Mettre à jour l'appointment avec les vitals
      const systolic = vitals.bloodPressure?.systolic;
      const diastolic = vitals.bloodPressure?.diastolic;
      const bloodPressure =
        systolic !== undefined || diastolic !== undefined
          ? { systolic, diastolic }
          : undefined;

      await appointmentsService.enterVitals(appointmentId, {
        vitals: {
          weight: vitals.weight,
          height: vitals.height,
          temperature: vitals.temperature,
          heartRate: vitals.heartRate,
          bloodPressure,
          respiratoryRate: vitals.respiratoryRate,
          oxygenSaturation: vitals.oxygenSaturation,
          painScore: vitals.painScore,
          bloodPressurePosition: vitals.bloodPressurePosition || undefined,
          bloodPressureArm: vitals.bloodPressureArm || undefined,
        },
        medicalHistoryNotes: medicalHistoryNotes || undefined,
      });

      setSuccess('Constantes validées avec succès');
      setDraftId(null);
      loadHistory();
      onVitalsSubmitted?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la validation des constantes');
    } finally {
      setFinalizing(false);
    }
  };

  const handleLoadFromHistory = (historyItem: VitalHistory) => {
    setVitals(historyItem.vitals);
    setMedicalHistoryNotes(historyItem.medicalHistoryNotes || '');
    setSuccess('Constantes chargées depuis l\'historique');
  };

  const handleFillDefaults = () => {
    setVitals({
      weight: 70,
      height: 170,
      bloodPressure: {
        systolic: 120,
        diastolic: 80,
      },
      temperature: 37.0,
      heartRate: 75,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      painScore: 0,
      bloodPressurePosition: 'ASSIS',
      bloodPressureArm: '',
    });
    setMedicalHistoryNotes('Patient en bon état général. Aucune plainte particulière. Constantes dans les normes.');
    setSuccess('Valeurs par défaut chargées');
  };

  const formatVitals = (v: Vitals) => {
    const parts: string[] = [];
    if (v.bloodPressure?.systolic && v.bloodPressure?.diastolic) {
      parts.push(`TA: ${v.bloodPressure.systolic}/${v.bloodPressure.diastolic} mmHg`);
    }
    if (v.heartRate) parts.push(`FC: ${v.heartRate} bpm`);
    if (v.temperature) parts.push(`T°: ${v.temperature}°C`);
    if (v.oxygenSaturation) parts.push(`SpO2: ${v.oxygenSaturation}%`);
    if (v.weight) parts.push(`Poids: ${v.weight} kg`);
    return parts.join(' • ');
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Chargement du brouillon...
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Saisie des constantes vitales
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<AutoAwesome />}
              onClick={handleFillDefaults}
            >
              Valeurs par défaut
            </Button>
            <Button
              variant="outlined"
              startIcon={<Save />}
              onClick={handleSaveDraft}
              disabled={!isFormValid || saving}
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder brouillon'}
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<Check />}
              onClick={handleValidate}
              disabled={!isFormValid || !draftId || finalizing}
            >
              {finalizing ? 'Validation...' : 'Valider définitivement'}
            </Button>
          </Box>
        </Box>

        {alerts.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {alerts.join(' • ')}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Poids (kg)"
              type="number"
              inputProps={{ min: 1, step: 0.1 }}
              value={vitals.weight ?? ''}
              onChange={(e) =>
                setVitals({ ...vitals, weight: e.target.value ? parseFloat(e.target.value) : undefined })
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Taille (cm)"
              type="number"
              inputProps={{ min: 1, step: 1 }}
              value={vitals.height ?? ''}
              onChange={(e) =>
                setVitals({ ...vitals, height: e.target.value ? parseFloat(e.target.value) : undefined })
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Température (°C)"
              type="number"
              inputProps={{ min: 30, max: 45, step: 0.1 }}
              value={vitals.temperature ?? ''}
              onChange={(e) =>
                setVitals({ ...vitals, temperature: e.target.value ? parseFloat(e.target.value) : undefined })
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Fréquence cardiaque (bpm)"
              type="number"
              inputProps={{ min: 30, max: 220, step: 1 }}
              value={vitals.heartRate ?? ''}
              onChange={(e) =>
                setVitals({ ...vitals, heartRate: e.target.value ? parseFloat(e.target.value) : undefined })
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tension systolique (mmHg)"
              type="number"
              inputProps={{ min: 50, max: 250, step: 1 }}
              value={vitals.bloodPressure?.systolic ?? ''}
              onChange={(e) =>
                setVitals({
                  ...vitals,
                  bloodPressure: {
                    systolic: e.target.value ? parseFloat(e.target.value) : undefined,
                    diastolic: vitals.bloodPressure?.diastolic,
                  },
                })
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tension diastolique (mmHg)"
              type="number"
              inputProps={{ min: 30, max: 150, step: 1 }}
              value={vitals.bloodPressure?.diastolic ?? ''}
              onChange={(e) =>
                setVitals({
                  ...vitals,
                  bloodPressure: {
                    systolic: vitals.bloodPressure?.systolic,
                    diastolic: e.target.value ? parseFloat(e.target.value) : undefined,
                  },
                })
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="SpO2 (%)"
              type="number"
              inputProps={{ min: 70, max: 100, step: 1 }}
              value={vitals.oxygenSaturation ?? ''}
              onChange={(e) =>
                setVitals({ ...vitals, oxygenSaturation: e.target.value ? parseFloat(e.target.value) : undefined })
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Fréquence respiratoire (/min)"
              type="number"
              inputProps={{ min: 5, max: 60, step: 1 }}
              value={vitals.respiratoryRate ?? ''}
              onChange={(e) =>
                setVitals({ ...vitals, respiratoryRate: e.target.value ? parseFloat(e.target.value) : undefined })
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Douleur (EVA 0-10)"
              type="number"
              inputProps={{ min: 0, max: 10, step: 1 }}
              value={vitals.painScore ?? ''}
              onChange={(e) =>
                setVitals({ ...vitals, painScore: e.target.value ? parseFloat(e.target.value) : undefined })
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Position pour la TA"
              value={vitals.bloodPressurePosition ?? ''}
              onChange={(e) => setVitals({ ...vitals, bloodPressurePosition: e.target.value })}
            >
              <MenuItem value="">Non précisé</MenuItem>
              <MenuItem value="ASSIS">Assis</MenuItem>
              <MenuItem value="DEBOUT">Debout</MenuItem>
              <MenuItem value="COUCHE">Couché</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes médicales contextuelles"
              multiline
              minRows={3}
              value={medicalHistoryNotes}
              onChange={(e) => setMedicalHistoryNotes(e.target.value)}
              placeholder="Contexte médical, symptômes, observations..."
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Historique */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Historique des constantes ({history.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {loadingHistory ? (
            <Typography variant="body2" color="text.secondary">
              Chargement de l'historique...
            </Typography>
          ) : history.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Aucun historique disponible
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Constantes</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Saisi par</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Statut</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        {format(new Date(item.enteredAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatVitals(item.vitals)}</Typography>
                      </TableCell>
                      <TableCell>{user?.name || item.enteredBy}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.isDraft ? 'Brouillon' : 'Finalisé'}
                          color={item.isDraft ? 'warning' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="small" onClick={() => handleLoadFromHistory(item)}>
                          Charger
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
