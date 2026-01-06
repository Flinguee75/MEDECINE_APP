import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Grid, Divider, Typography
} from '@mui/material';
import { Vitals } from '../../types/Appointment';

interface VitalsDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (vitals: Vitals) => void;
  initialVitals?: Vitals;
  readOnly?: boolean;
}

export function VitalsDialog({ open, onClose, onSave, initialVitals, readOnly = false }: VitalsDialogProps) {
  const [vitals, setVitals] = useState<Vitals>({
    weight: undefined,
    height: undefined,
    bloodPressure: {
      systolic: undefined,
      diastolic: undefined,
    },
    temperature: undefined,
    heartRate: undefined,
    notes: '',
  });

  useEffect(() => {
    if (initialVitals) {
      setVitals(initialVitals);
    }
  }, [initialVitals]);

  const handleSave = () => {
    onSave(vitals);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{readOnly ? 'Constantes Vitales' : 'Saisir les Constantes Vitales'}</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
          Mesures prises lors du rendez-vous
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }}>Mesures Physiques</Divider>
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Poids (kg)"
              value={vitals.weight || ''}
              onChange={(e) => setVitals({ ...vitals, weight: e.target.value ? parseFloat(e.target.value) : undefined })}
              disabled={readOnly}
              inputProps={{ step: '0.1', min: '0' }}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Taille (cm)"
              value={vitals.height || ''}
              onChange={(e) => setVitals({ ...vitals, height: e.target.value ? parseFloat(e.target.value) : undefined })}
              disabled={readOnly}
              inputProps={{ step: '1', min: '0' }}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }}>Tension Artérielle</Divider>
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Systolique (mmHg)"
              value={vitals.bloodPressure?.systolic || ''}
              onChange={(e) =>
                setVitals({
                  ...vitals,
                  bloodPressure: {
                    ...vitals.bloodPressure,
                    systolic: e.target.value ? parseFloat(e.target.value) : undefined,
                  },
                })
              }
              disabled={readOnly}
              inputProps={{ min: '0' }}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Diastolique (mmHg)"
              value={vitals.bloodPressure?.diastolic || ''}
              onChange={(e) =>
                setVitals({
                  ...vitals,
                  bloodPressure: {
                    ...vitals.bloodPressure,
                    diastolic: e.target.value ? parseFloat(e.target.value) : undefined,
                  },
                })
              }
              disabled={readOnly}
              inputProps={{ min: '0' }}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }}>Autres Constantes</Divider>
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Température (°C)"
              value={vitals.temperature || ''}
              onChange={(e) => setVitals({ ...vitals, temperature: e.target.value ? parseFloat(e.target.value) : undefined })}
              disabled={readOnly}
              inputProps={{ step: '0.1', min: '0' }}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Fréquence cardiaque (bpm)"
              value={vitals.heartRate || ''}
              onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value ? parseFloat(e.target.value) : undefined })}
              disabled={readOnly}
              inputProps={{ min: '0' }}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }}>Observations</Divider>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes complémentaires"
              value={vitals.notes || ''}
              onChange={(e) => setVitals({ ...vitals, notes: e.target.value })}
              disabled={readOnly}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
        {!readOnly && (
          <Button onClick={handleSave} variant="contained">
            Enregistrer
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
