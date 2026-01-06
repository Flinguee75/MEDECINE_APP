import { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Chip, Box, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { Add as AddIcon, ArrowBack } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types/User';
import { prescriptionsService } from '../../services/prescriptionsService';
import { patientsService } from '../../services/patientsService';
import { Prescription, PrescriptionStatus, CreatePrescriptionDto } from '../../types/Prescription';
import { Patient } from '../../types/Patient';
import { useNavigate } from 'react-router-dom';

export function PrescriptionsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<CreatePrescriptionDto>({ text: '', patientId: '' });
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [statusFilter, setStatusFilter] = useState<PrescriptionStatus | ''>('');

  const canCreate = user?.role === Role.DOCTOR || user?.role === Role.ADMIN;
  const canUpdateStatus = user?.role === Role.BIOLOGIST || user?.role === Role.DOCTOR || user?.role === Role.ADMIN;

  useEffect(() => {
    loadPrescriptions();
    if (canCreate) loadPatients();
  }, [statusFilter]);

  const loadPrescriptions = async () => {
    try {
      const data = await prescriptionsService.getAll(statusFilter ? { status: statusFilter } : undefined);
      setPrescriptions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const data = await patientsService.getAll();
      setPatients(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    try {
      await prescriptionsService.create(formData);
      setOpenDialog(false);
      setFormData({ text: '', patientId: '' });
      loadPrescriptions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: PrescriptionStatus) => {
    try {
      await prescriptionsService.update(id, { status: newStatus });
      loadPrescriptions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const getStatusColor = (status: PrescriptionStatus) => {
    const colors = {
      [PrescriptionStatus.CREATED]: 'default',
      [PrescriptionStatus.SENT_TO_LAB]: 'info',
      [PrescriptionStatus.IN_PROGRESS]: 'warning',
      [PrescriptionStatus.COMPLETED]: 'success',
    };
    return colors[status] as any;
  };

  const getNextStatus = (current: PrescriptionStatus, prescription: Prescription): PrescriptionStatus | null => {
    if (user?.role === Role.DOCTOR && prescription.doctorId === user.id) {
      if (current === PrescriptionStatus.CREATED) return PrescriptionStatus.SENT_TO_LAB;
    }
    if (user?.role === Role.BIOLOGIST) {
      if (current === PrescriptionStatus.SENT_TO_LAB) return PrescriptionStatus.IN_PROGRESS;
      if (current === PrescriptionStatus.IN_PROGRESS) return PrescriptionStatus.COMPLETED;
    }
    if (user?.role === Role.ADMIN) {
      const transitions: Record<PrescriptionStatus, PrescriptionStatus | null> = {
        [PrescriptionStatus.CREATED]: PrescriptionStatus.SENT_TO_LAB,
        [PrescriptionStatus.SENT_TO_LAB]: PrescriptionStatus.IN_PROGRESS,
        [PrescriptionStatus.IN_PROGRESS]: PrescriptionStatus.COMPLETED,
        [PrescriptionStatus.COMPLETED]: null,
      };
      return transitions[current];
    }
    return null;
  };

  if (loading) return <Typography>Chargement...</Typography>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')}>
            Retour
          </Button>
          <Typography variant="h4">Prescriptions</Typography>
        </Box>
        <Box display="flex" gap={2}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filtrer par statut</InputLabel>
            <Select
              value={statusFilter}
              label="Filtrer par statut"
              onChange={(e) => setStatusFilter(e.target.value as PrescriptionStatus | '')}
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value={PrescriptionStatus.CREATED}>Créé</MenuItem>
              <MenuItem value={PrescriptionStatus.SENT_TO_LAB}>Envoyé au labo</MenuItem>
              <MenuItem value={PrescriptionStatus.IN_PROGRESS}>En cours</MenuItem>
              <MenuItem value={PrescriptionStatus.COMPLETED}>Complété</MenuItem>
            </Select>
          </FormControl>
          {canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
              Nouvelle Prescription
            </Button>
          )}
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Médecin</TableCell>
              <TableCell>Prescription</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prescriptions.map((prescription) => {
              const nextStatus = getNextStatus(prescription.status, prescription);
              return (
                <TableRow key={prescription.id}>
                  <TableCell>
                    {prescription.patient?.firstName} {prescription.patient?.lastName}
                  </TableCell>
                  <TableCell>{prescription.doctor?.name}</TableCell>
                  <TableCell>{prescription.text.substring(0, 50)}...</TableCell>
                  <TableCell>
                    <Chip label={prescription.status} color={getStatusColor(prescription.status)} size="small" />
                  </TableCell>
                  <TableCell>{new Date(prescription.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {nextStatus && canUpdateStatus && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleUpdateStatus(prescription.id, nextStatus)}
                      >
                        → {nextStatus}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouvelle Prescription</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Patient</InputLabel>
            <Select
              value={formData.patientId}
              label="Patient"
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
            >
              {patients.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Prescription"
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button onClick={handleCreate} variant="contained">
            Créer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
