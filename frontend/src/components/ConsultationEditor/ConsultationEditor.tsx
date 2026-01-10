import { useState, useCallback, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { Save, Check } from '@mui/icons-material';
import { appointmentsService } from '../../services/appointmentsService';
import { useAutoSave } from '../../hooks/useAutoSave';
import { format } from 'date-fns';

interface ConsultationEditorProps {
  appointmentId: string;
  initialNotes?: string;
  onSaveSuccess?: () => void;
}

export const ConsultationEditor = ({
  appointmentId,
  initialNotes = '',
  onSaveSuccess,
}: ConsultationEditorProps) => {
  const [notes, setNotes] = useState(initialNotes);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [manualSaving, setManualSaving] = useState(false);
  const [error, setError] = useState('');
  const [openFinalizeDialog, setOpenFinalizeDialog] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  // Auto-save callback
  const handleAutoSave = useCallback(
    async (content: string) => {
      try {
        await appointmentsService.autoSaveNotes(appointmentId, content);
        setError('');
      } catch (err: any) {
        console.error('Auto-save failed:', err);
        setError(err.response?.data?.message || 'Échec de la sauvegarde automatique');
        throw err;
      }
    },
    [appointmentId]
  );

  // Hook d'auto-save (toutes les 30 secondes)
  const { isSaving: autoSaving, lastSavedAt, error: autoSaveError } = useAutoSave({
    value: notes,
    onSave: handleAutoSave,
    delay: 30000, // 30 secondes
  });

  // Mettre à jour lastSaveTime quand lastSavedAt change
  useEffect(() => {
    if (lastSavedAt) {
      setLastSaveTime(lastSavedAt);
    }
  }, [lastSavedAt]);

  // Synchroniser initialNotes avec notes
  useEffect(() => {
    if (initialNotes && !notes) {
      setNotes(initialNotes);
    }
  }, [initialNotes, notes]);

  const handleManualSave = async () => {
    if (!notes.trim()) {
      setError('Les notes ne peuvent pas être vides');
      return;
    }

    try {
      setManualSaving(true);
      setError('');
      await appointmentsService.autoSaveNotes(appointmentId, notes);
      setLastSaveTime(new Date());
      onSaveSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setManualSaving(false);
    }
  };

  const handleFinalizeConsultation = async () => {
    if (!notes.trim()) {
      setError('Veuillez saisir des notes de consultation avant de finaliser');
      return;
    }

    try {
      setFinalizing(true);
      setError('');
      await appointmentsService.completeConsultation(appointmentId, notes);
      setOpenFinalizeDialog(false);
      onSaveSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la finalisation de la consultation');
    } finally {
      setFinalizing(false);
    }
  };

  const formatLastSaveTime = () => {
    if (!lastSaveTime) return null;
    return format(lastSaveTime, 'HH:mm:ss');
  };

  const getSaveStatus = () => {
    if (autoSaving || manualSaving) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">
            Sauvegarde en cours...
          </Typography>
        </Box>
      );
    }

    if (lastSaveTime) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Check sx={{ color: 'success.main', fontSize: 16 }} />
          <Typography variant="body2" color="success.main">
            Sauvegardé à {formatLastSaveTime()}
          </Typography>
        </Box>
      );
    }

    return (
      <Typography variant="body2" color="text.secondary">
        Modifications non sauvegardées
      </Typography>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {autoSaveError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Échec de la sauvegarde automatique. Veuillez sauvegarder manuellement.
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {getSaveStatus()}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Save />}
              onClick={handleManualSave}
              disabled={manualSaving || !notes.trim()}
            >
              Sauvegarder maintenant
            </Button>
            <Button
              variant="contained"
              size="small"
              color="success"
              onClick={() => setOpenFinalizeDialog(true)}
              disabled={!notes.trim()}
            >
              Finaliser consultation
            </Button>
          </Box>
        </Box>
      </Paper>

      <TextField
        fullWidth
        multiline
        minRows={10}
        label="Notes de consultation"
        placeholder="Saisissez vos observations, diagnostic, prescriptions..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        variant="outlined"
        sx={{
          mt: 2,
          '& .MuiInputBase-root': {
            fontFamily: 'monospace',
            fontSize: '0.95rem',
            lineHeight: 1.6,
          },
        }}
      />

      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Les notes sont automatiquement sauvegardées toutes les 30 secondes.
        </Typography>
      </Box>

      {/* Dialog de confirmation de finalisation */}
      <Dialog open={openFinalizeDialog} onClose={() => setOpenFinalizeDialog(false)}>
        <DialogTitle>Finaliser la consultation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir finaliser cette consultation ? Le statut du rendez-vous sera
            changé à "CONSULTATION_COMPLETED" et cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFinalizeDialog(false)} disabled={finalizing}>
            Annuler
          </Button>
          <Button
            onClick={handleFinalizeConsultation}
            variant="contained"
            color="success"
            disabled={finalizing}
          >
            {finalizing ? 'Finalisation...' : 'Confirmer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
