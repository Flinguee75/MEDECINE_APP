import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Checkbox,
  Divider,
} from '@mui/material';
import { Add, ArrowBack, Delete, Edit, Visibility, FolderOpen } from '@mui/icons-material';
import { patientsService } from '../../services/patientsService';
import { Patient, CreatePatientData } from '../../types/Patient';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types/User';
import { useNavigate } from 'react-router-dom';

export const PatientsList = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<CreatePatientData>({
    firstName: '',
    lastName: '',
    birthDate: '',
    sex: '',
    phone: '',
    address: '',
    emergencyContact: '',
    insurance: '',
    idNumber: '',
    consentMedicalData: false,
    consentContact: false,
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  const canManagePatient = user?.role === Role.SECRETARY || user?.role === Role.ADMIN;
  const canViewMedicalRecord = user?.role !== Role.SECRETARY;

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await patientsService.getAll(search);
      setPatients(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des patients');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPatient(null);
    setFormData({
      firstName: '',
      lastName: '',
      birthDate: '',
      sex: '',
      phone: '',
      address: '',
      emergencyContact: '',
      insurance: '',
      idNumber: '',
      consentMedicalData: false,
      consentContact: false,
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      firstName: patient.firstName,
      lastName: patient.lastName,
      birthDate: patient.birthDate.slice(0, 10),
      sex: patient.sex || '',
      phone: patient.phone || '',
      address: patient.address || '',
      emergencyContact: patient.emergencyContact || '',
      insurance: patient.insurance || '',
      idNumber: patient.idNumber || '',
      consentMedicalData: patient.consentMedicalData ?? false,
      consentContact: patient.consentContact ?? false,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPatient(null);
    setFormData({
      firstName: '',
      lastName: '',
      birthDate: '',
      sex: '',
      phone: '',
      address: '',
      emergencyContact: '',
      insurance: '',
      idNumber: '',
      consentMedicalData: false,
      consentContact: false,
    });
  };

  const handleOpenDelete = (patient: Patient) => {
    setSelectedPatient(patient);
    setOpenDeleteDialog(true);
  };

  const handleCloseDelete = () => {
    setOpenDeleteDialog(false);
    setSelectedPatient(null);
  };

  const handleOpenView = (patient: Patient) => {
    setSelectedPatient(patient);
    setOpenViewDialog(true);
  };

  const handleCloseView = () => {
    setOpenViewDialog(false);
    setSelectedPatient(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingPatient) {
        await patientsService.update(editingPatient.id, formData);
      } else {
        await patientsService.create(formData);
      }
      handleCloseDialog();
      fetchPatients();
    } catch (err: any) {
      const fallbackMessage = editingPatient
        ? 'Erreur lors de la modification du patient'
        : 'Erreur lors de la création du patient';
      setError(err.response?.data?.message || fallbackMessage);
    }
  };

  const handleDelete = async () => {
    if (!selectedPatient) {
      return;
    }
    try {
      await patientsService.delete(selectedPatient.id);
      handleCloseDelete();
      fetchPatients();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression du patient');
    }
  };

  const generateRandomPatient = (): CreatePatientData => {
    const firstNames = ['Kouassi', 'Aya', 'Koffi', 'Adjoua', 'Yao', 'Akissi', 'N\'Guessan', 'Amenan', 'Kouame', 'Affoue', 'Brou', 'Mariam', 'Konan', 'Fatou', 'Yapi'];
    const lastNames = ['Kouassi', 'Kone', 'Toure', 'Yao', 'Bamba', 'Diallo', 'Ouattara', 'Coulibaly', 'Traore', 'N\'Guessan', 'Kouame', 'Konan', 'Brou', 'Yapi', 'Sanogo'];
    const streets = ['Boulevard de la République', 'Avenue Houphouët-Boigny', 'Rue du Commerce', 'Avenue Marchand', 'Boulevard Latrille', 'Rue Pierre et Marie Curie', 'Avenue Nogues'];
    const cities = ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Korhogo', 'Man', 'Gagnoa'];
    const insurances = ['MUGEF-CI', 'CNPS', 'Allianz Côte d\'Ivoire', 'AXA Assurances CI', 'NSIA Assurances'];
    
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomStreet = streets[Math.floor(Math.random() * streets.length)];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const randomInsurance = insurances[Math.floor(Math.random() * insurances.length)];
    const randomSex = Math.random() > 0.5 ? 'M' : 'F';
    
    // Générer une date de naissance aléatoire (entre 18 et 80 ans)
    const today = new Date();
    const minAge = 18;
    const maxAge = 80;
    const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
    const birthYear = today.getFullYear() - age;
    const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const birthDate = `${birthYear}-${birthMonth}-${birthDay}`;
    
    // Générer un numéro de téléphone aléatoire
    const phonePrefix = ['06', '07'][Math.floor(Math.random() * 2)];
    const phoneNumber = `${phonePrefix}${Math.floor(Math.random() * 90000000) + 10000000}`;
    
    return {
      firstName: randomFirstName,
      lastName: randomLastName,
      birthDate: birthDate,
      sex: randomSex,
      phone: phoneNumber,
      address: `${Math.floor(Math.random() * 200) + 1} ${randomStreet}, ${randomCity}`,
      emergencyContact: `${phonePrefix === '06' ? '07' : '06'}${Math.floor(Math.random() * 90000000) + 10000000}`,
      insurance: randomInsurance,
      idNumber: `ID${Math.floor(Math.random() * 900000) + 100000}`,
      consentMedicalData: true,
      consentContact: true,
    };
  };

  const handleCreateTestPatient = async () => {
    try {
      const testPatient = generateRandomPatient();
      await patientsService.create(testPatient);
      fetchPatients();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création du patient test');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const isMedicalHistoryEmpty = (history?: Patient['medicalHistory']) => {
    if (!history) {
      return true;
    }

    return (
      (!history.allergies || history.allergies.length === 0) &&
      (!history.chronicDiseases || history.chronicDiseases.length === 0) &&
      (!history.familyHistory || history.familyHistory.length === 0) &&
      (!history.currentTreatments || history.currentTreatments.length === 0) &&
      !history.notes
    );
  };

  const formatSex = (sex?: string) => {
    switch (sex) {
      case 'F':
        return 'Féminin';
      case 'M':
        return 'Masculin';
      case 'AUTRE':
        return 'Autre';
      default:
        return '-';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/dashboard')}
            >
              Retour
            </Button>
            <Typography variant="h4">Patients</Typography>
          </Box>
          {canManagePatient && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined" 
                color="secondary"
                startIcon={<Add />} 
                onClick={handleCreateTestPatient}
              >
                Patient Test
              </Button>
              <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
                Nouveau Patient
              </Button>
            </Box>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <TextField
              fullWidth
              label="Rechercher un patient"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom ou prénom..."
            />
          </CardContent>
        </Card>

        <TableContainer component={Card}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Prénom</TableCell>
                <TableCell>Date de naissance</TableCell>
                <TableCell>RDV</TableCell>
                <TableCell>Prescriptions</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Aucun patient trouvé
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>{patient.lastName}</TableCell>
                    <TableCell>{patient.firstName}</TableCell>
                    <TableCell>{formatDate(patient.birthDate)}</TableCell>
                    <TableCell>{patient._count?.appointments || 0}</TableCell>
                    <TableCell>{patient._count?.prescriptions || 0}</TableCell>
                    <TableCell align="right">
                      {canViewMedicalRecord && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/patients/${patient.id}/medical-record`)}
                          title="Dossier médical"
                        >
                          <FolderOpen />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenView(patient)}
                      >
                        <Visibility />
                      </IconButton>
                      {canManagePatient && (
                        <>
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => handleOpenEdit(patient)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDelete(patient)}
                          >
                            <Delete />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Dialog pour créer un patient */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPatient ? 'Modifier le patient' : 'Nouveau Patient'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Identification minimale
            </Typography>
            <TextField
              fullWidth
              label="Identifiant patient (auto)"
              value={editingPatient?.id || 'Attribué automatiquement'}
              InputProps={{ readOnly: true }}
            />
            <TextField
              fullWidth
              label="Prénom"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Nom"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Date de naissance"
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />
            <FormControl fullWidth required>
              <InputLabel id="patient-sex-label">Sexe</InputLabel>
              <Select
                labelId="patient-sex-label"
                label="Sexe"
                value={formData.sex}
                onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
              >
                <MenuItem value="F">Féminin</MenuItem>
                <MenuItem value="M">Masculin</MenuItem>
                <MenuItem value="AUTRE">Autre</MenuItem>
              </Select>
            </FormControl>
            <Divider />
            <Typography variant="subtitle2" color="text.secondary">
              Contact
            </Typography>
            <TextField
              fullWidth
              label="Téléphone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Adresse (minimale)"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Contact d'urgence"
              value={formData.emergencyContact}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              required
            />
            <Divider />
            <Typography variant="subtitle2" color="text.secondary">
              Administratif
            </Typography>
            <TextField
              fullWidth
              label="Assurance / mutuelle"
              value={formData.insurance}
              onChange={(e) => setFormData({ ...formData, insurance: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Numéro de pièce (si disponible)"
              value={formData.idNumber}
              onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
            />
            <Divider />
            <Typography variant="subtitle2" color="text.secondary">
              Consentements
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.consentMedicalData}
                  onChange={(e) =>
                    setFormData({ ...formData, consentMedicalData: e.target.checked })
                  }
                />
              }
              label="Données médicales"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.consentContact}
                  onChange={(e) =>
                    setFormData({ ...formData, consentContact: e.target.checked })
                  }
                />
              }
              label="Autorisation de contact"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              !formData.firstName ||
              !formData.lastName ||
              !formData.birthDate ||
              !formData.sex ||
              !formData.phone ||
              !formData.address ||
              !formData.emergencyContact ||
              !formData.insurance
            }
          >
            {editingPatient ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openViewDialog} onClose={handleCloseView} maxWidth="sm" fullWidth>
        <DialogTitle>Détails du patient</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Nom complet
            </Typography>
            <Typography variant="body1">
              {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '-'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Statut
            </Typography>
            <Typography variant="body1" color="warning.main">
              {!canViewMedicalRecord
                ? 'Accès restreint'
                : selectedPatient && isMedicalHistoryEmpty(selectedPatient.medicalHistory)
                  ? 'Patient enregistré – dossier médical non complété'
                  : 'Dossier médical complété'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Identifiant patient
            </Typography>
            <Typography variant="body1">
              {selectedPatient?.id || '-'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Date de naissance
            </Typography>
            <Typography variant="body1">
              {selectedPatient ? formatDate(selectedPatient.birthDate) : '-'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Sexe
            </Typography>
            <Typography variant="body1">
              {formatSex(selectedPatient?.sex)}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Téléphone
            </Typography>
            <Typography variant="body1">
              {selectedPatient?.phone || '-'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Adresse
            </Typography>
            <Typography variant="body1">
              {selectedPatient?.address || '-'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Contact d'urgence
            </Typography>
            <Typography variant="body1">
              {selectedPatient?.emergencyContact || '-'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Assurance / mutuelle
            </Typography>
            <Typography variant="body1">
              {selectedPatient?.insurance || '-'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Numéro de pièce
            </Typography>
            <Typography variant="body1">
              {selectedPatient?.idNumber || '-'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Consentement données médicales
            </Typography>
            <Typography variant="body1">
              {selectedPatient?.consentMedicalData ? 'Oui' : 'Non'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Autorisation de contact
            </Typography>
            <Typography variant="body1">
              {selectedPatient?.consentContact ? 'Oui' : 'Non'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Rendez-vous
            </Typography>
            <Typography variant="body1">
              {selectedPatient?._count?.appointments ?? 0}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Prescriptions
            </Typography>
            <Typography variant="body1">
              {selectedPatient?._count?.prescriptions ?? 0}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseView}>Fermer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeleteDialog} onClose={handleCloseDelete} maxWidth="xs" fullWidth>
        <DialogTitle>Supprimer le patient</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {selectedPatient
              ? `Confirmer la suppression de ${selectedPatient.firstName} ${selectedPatient.lastName} ?`
              : 'Confirmer la suppression du patient ?'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete}>Annuler</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
