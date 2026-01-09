import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types/User';
import { resultsService } from '../../services/resultsService';
import { prescriptionsService } from '../../services/prescriptionsService';
import { Result, CreateResultDto } from '../../types/Result';
import { Prescription, PrescriptionStatus } from '../../types/Prescription';

export function ResultsList() {
  const { user } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [formData, setFormData] = useState<CreateResultDto>({
    data: {
      hematology: {},
      biochemistry: {},
      lipidProfile: {},
    },
    text: '',
    prescriptionId: '',
  });

  const canCreate = user?.role === Role.BIOLOGIST || user?.role === Role.ADMIN;
  const canEdit = user?.role === Role.BIOLOGIST || user?.role === Role.ADMIN;

  useEffect(() => {
    loadResults();
    if (canCreate) loadPrescriptions();
  }, []);

  const loadResults = async () => {
    try {
      const data = await resultsService.getAll();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPrescriptions = async () => {
    try {
      const data = await prescriptionsService.getAll({ status: PrescriptionStatus.IN_PROGRESS });
      setPrescriptions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    try {
      await resultsService.create(formData);
      setOpenDialog(false);
      setFormData({
        data: { hematology: {}, biochemistry: {}, lipidProfile: {} },
        text: '',
        prescriptionId: '',
      });
      loadResults();
      if (canCreate) loadPrescriptions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleEdit = async () => {
    if (!selectedResult) return;
    try {
      await resultsService.update(selectedResult.id, {
        data: selectedResult.data,
        text: selectedResult.text,
      });
      setOpenEditDialog(false);
      setSelectedResult(null);
      loadResults();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const updateFormField = (section: 'hematology' | 'biochemistry' | 'lipidProfile', field: string, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    setFormData({
      ...formData,
      data: {
        ...formData.data,
        [section]: {
          ...formData.data?.[section],
          [field]: numValue,
        },
      },
    });
  };

  const updateSelectedField = (section: 'hematology' | 'biochemistry' | 'lipidProfile', field: string, value: string) => {
    if (!selectedResult) return;
    const numValue = value === '' ? undefined : parseFloat(value);
    setSelectedResult({
      ...selectedResult,
      data: {
        ...selectedResult.data,
        [section]: {
          ...selectedResult.data?.[section],
          [field]: numValue,
        },
      },
    });
  };

  if (loading) return <Typography>Chargement...</Typography>;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Résultats d'Analyses</Typography>
        {canCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
            Nouveau Résultat
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Médecin</TableCell>
              <TableCell>Prescription</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((result) => (
              <TableRow key={result.id}>
                <TableCell>
                  {result.prescription?.patient?.firstName} {result.prescription?.patient?.lastName}
                </TableCell>
                <TableCell>{result.prescription?.doctor?.name}</TableCell>
                <TableCell>{result.prescription?.text.substring(0, 30)}...</TableCell>
                <TableCell>{new Date(result.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setSelectedResult(result);
                      setOpenEditDialog(true);
                    }}
                  >
                    {canEdit ? 'Modifier' : 'Voir'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Création */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nouveau Résultat d'Analyse</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Prescription (en cours)</InputLabel>
            <Select
              value={formData.prescriptionId}
              label="Prescription (en cours)"
              onChange={(e) => setFormData({ ...formData, prescriptionId: e.target.value })}
            >
              {prescriptions.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.patient?.firstName} {p.patient?.lastName} - {p.text.substring(0, 40)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider sx={{ my: 3 }}>Hématologie</Divider>
          <Grid container spacing={2}>
            <Grid xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Globules rouges (M/µL)"
                value={formData.data?.hematology?.rbc || ''}
                onChange={(e) => updateFormField('hematology', 'rbc', e.target.value)}
                inputProps={{ step: '0.1' }}
              />
            </Grid>
            <Grid xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Globules blancs (K/µL)"
                value={formData.data?.hematology?.wbc || ''}
                onChange={(e) => updateFormField('hematology', 'wbc', e.target.value)}
                inputProps={{ step: '0.1' }}
              />
            </Grid>
            <Grid xs={4}>
              <TextField
                fullWidth
                type="number"
                label="Plaquettes (K/µL)"
                value={formData.data?.hematology?.platelets || ''}
                onChange={(e) => updateFormField('hematology', 'platelets', e.target.value)}
              />
            </Grid>
            <Grid xs={4}>
              <TextField
                fullWidth
                type="number"
                label="Hémoglobine (g/dL)"
                value={formData.data?.hematology?.hemoglobin || ''}
                onChange={(e) => updateFormField('hematology', 'hemoglobin', e.target.value)}
                inputProps={{ step: '0.1' }}
              />
            </Grid>
            <Grid xs={4}>
              <TextField
                fullWidth
                type="number"
                label="Hématocrite (%)"
                value={formData.data?.hematology?.hematocrit || ''}
                onChange={(e) => updateFormField('hematology', 'hematocrit', e.target.value)}
                inputProps={{ step: '0.1' }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }}>Biochimie</Divider>
          <Grid container spacing={2}>
            <Grid xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Glycémie (g/L)"
                value={formData.data?.biochemistry?.glucose || ''}
                onChange={(e) => updateFormField('biochemistry', 'glucose', e.target.value)}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            <Grid xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Créatinine (mg/L)"
                value={formData.data?.biochemistry?.creatinine || ''}
                onChange={(e) => updateFormField('biochemistry', 'creatinine', e.target.value)}
                inputProps={{ step: '0.1' }}
              />
            </Grid>
            <Grid xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Urée (g/L)"
                value={formData.data?.biochemistry?.urea || ''}
                onChange={(e) => updateFormField('biochemistry', 'urea', e.target.value)}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            <Grid xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Acide urique (mg/L)"
                value={formData.data?.biochemistry?.uricAcid || ''}
                onChange={(e) => updateFormField('biochemistry', 'uricAcid', e.target.value)}
                inputProps={{ step: '0.1' }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }}>Bilan Lipidique</Divider>
          <Grid container spacing={2}>
            <Grid xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Cholestérol total (g/L)"
                value={formData.data?.lipidProfile?.totalCholesterol || ''}
                onChange={(e) => updateFormField('lipidProfile', 'totalCholesterol', e.target.value)}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            <Grid xs={6}>
              <TextField
                fullWidth
                type="number"
                label="HDL (g/L)"
                value={formData.data?.lipidProfile?.hdl || ''}
                onChange={(e) => updateFormField('lipidProfile', 'hdl', e.target.value)}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            <Grid xs={6}>
              <TextField
                fullWidth
                type="number"
                label="LDL (g/L)"
                value={formData.data?.lipidProfile?.ldl || ''}
                onChange={(e) => updateFormField('lipidProfile', 'ldl', e.target.value)}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            <Grid xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Triglycérides (g/L)"
                value={formData.data?.lipidProfile?.triglycerides || ''}
                onChange={(e) => updateFormField('lipidProfile', 'triglycerides', e.target.value)}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }}>Conclusion</Divider>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Commentaires et conclusion"
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button onClick={handleCreate} variant="contained">
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Édition/Visualisation */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{canEdit ? 'Modifier le Résultat' : 'Détails du Résultat'}</DialogTitle>
        <DialogContent>
          <Divider sx={{ my: 2 }}>Hématologie</Divider>
          <Grid container spacing={2}>
            <Grid xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Globules rouges (M/µL)"
                value={selectedResult?.data?.hematology?.rbc || ''}
                onChange={(e) => updateSelectedField('hematology', 'rbc', e.target.value)}
                disabled={!canEdit}
                inputProps={{ step: '0.1' }}
              />
            </Grid>
            <Grid xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Globules blancs (K/µL)"
                value={selectedResult?.data?.hematology?.wbc || ''}
                onChange={(e) => updateSelectedField('hematology', 'wbc', e.target.value)}
                disabled={!canEdit}
                inputProps={{ step: '0.1' }}
              />
            </Grid>
            <Grid xs={4}>
              <TextField
                fullWidth
                type="number"
                label="Plaquettes (K/µL)"
                value={selectedResult?.data?.hematology?.platelets || ''}
                onChange={(e) => updateSelectedField('hematology', 'platelets', e.target.value)}
                disabled={!canEdit}
              />
            </Grid>
            <Grid xs={4}>
              <TextField
                fullWidth
                type="number"
                label="Hémoglobine (g/dL)"
                value={selectedResult?.data?.hematology?.hemoglobin || ''}
                onChange={(e) => updateSelectedField('hematology', 'hemoglobin', e.target.value)}
                disabled={!canEdit}
                inputProps={{ step: '0.1' }}
              />
            </Grid>
            <Grid xs={4}>
              <TextField
                fullWidth
                type="number"
                label="Hématocrite (%)"
                value={selectedResult?.data?.hematology?.hematocrit || ''}
                onChange={(e) => updateSelectedField('hematology', 'hematocrit', e.target.value)}
                disabled={!canEdit}
                inputProps={{ step: '0.1' }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }}>Biochimie</Divider>
          <Grid container spacing={2}>
            <Grid xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Glycémie (g/L)"
                value={selectedResult?.data?.biochemistry?.glucose || ''}
                onChange={(e) => updateSelectedField('biochemistry', 'glucose', e.target.value)}
                disabled={!canEdit}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            <Grid xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Créatinine (mg/L)"
                value={selectedResult?.data?.biochemistry?.creatinine || ''}
                onChange={(e) => updateSelectedField('biochemistry', 'creatinine', e.target.value)}
                disabled={!canEdit}
                inputProps={{ step: '0.1' }}
              />
            </Grid>
            <Grid xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Urée (g/L)"
                value={selectedResult?.data?.biochemistry?.urea || ''}
                onChange={(e) => updateSelectedField('biochemistry', 'urea', e.target.value)}
                disabled={!canEdit}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            <Grid xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Acide urique (mg/L)"
                value={selectedResult?.data?.biochemistry?.uricAcid || ''}
                onChange={(e) => updateSelectedField('biochemistry', 'uricAcid', e.target.value)}
                disabled={!canEdit}
                inputProps={{ step: '0.1' }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }}>Bilan Lipidique</Divider>
          <Grid container spacing={2}>
            <Grid xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Cholestérol total (g/L)"
                value={selectedResult?.data?.lipidProfile?.totalCholesterol || ''}
                onChange={(e) => updateSelectedField('lipidProfile', 'totalCholesterol', e.target.value)}
                disabled={!canEdit}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            <Grid xs={6}>
              <TextField
                fullWidth
                type="number"
                label="HDL (g/L)"
                value={selectedResult?.data?.lipidProfile?.hdl || ''}
                onChange={(e) => updateSelectedField('lipidProfile', 'hdl', e.target.value)}
                disabled={!canEdit}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            <Grid xs={6}>
              <TextField
                fullWidth
                type="number"
                label="LDL (g/L)"
                value={selectedResult?.data?.lipidProfile?.ldl || ''}
                onChange={(e) => updateSelectedField('lipidProfile', 'ldl', e.target.value)}
                disabled={!canEdit}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            <Grid xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Triglycérides (g/L)"
                value={selectedResult?.data?.lipidProfile?.triglycerides || ''}
                onChange={(e) => updateSelectedField('lipidProfile', 'triglycerides', e.target.value)}
                disabled={!canEdit}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }}>Conclusion</Divider>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Commentaires et conclusion"
            value={selectedResult?.text || ''}
            onChange={(e) => setSelectedResult(selectedResult ? { ...selectedResult, text: e.target.value } : null)}
            disabled={!canEdit}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Fermer</Button>
          {canEdit && (
            <Button onClick={handleEdit} variant="contained">
              Enregistrer
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}
