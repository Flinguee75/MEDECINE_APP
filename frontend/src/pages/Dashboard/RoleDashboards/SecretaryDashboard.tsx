import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  Alert,
  Card,
  CardContent,
  Badge,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { 
  People, 
  EventAvailable,
  CheckCircle,
  Person,
  AccessTime,
  Receipt,
  Event,
  MonetizationOn,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { appointmentsService } from '../../../services/appointmentsService';
import { patientsService } from '../../../services/patientsService';
import { usersService } from '../../../services/usersService';
import { Appointment, AppointmentStatus, BillingStatus, CreateAppointmentData } from '../../../types/Appointment';
import { Patient } from '../../../types/Patient';
import { User } from '../../../types/User';
import { WorkflowStatusChip } from '../../../components/StatusChips';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function SecretaryDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scheduledAppointments, setScheduledAppointments] = useState<Appointment[]>([]);
  const [consultationCompleted, setConsultationCompleted] = useState<Appointment[]>([]);
  const [patientsCount, setPatientsCount] = useState(0);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openCloseDialog, setOpenCloseDialog] = useState(false);
  const [closingAppointment, setClosingAppointment] = useState<Appointment | null>(null);
  const [billingAmount, setBillingAmount] = useState('');
  const [billingStatus, setBillingStatus] = useState<BillingStatus>(BillingStatus.PENDING);
  const [error, setError] = useState('');
  const [motifChoice, setMotifChoice] = useState('AUTRE');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [formData, setFormData] = useState<CreateAppointmentData>({
    date: '',
    motif: '',
    patientId: '',
    doctorId: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const allAppointments = await appointmentsService.getAll();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      setScheduledAppointments(
        allAppointments.filter(
          (apt) =>
            apt.status === AppointmentStatus.SCHEDULED &&
            new Date(apt.date) >= today
        )
      );

      setConsultationCompleted(
        allAppointments.filter(
          (apt) => apt.status === AppointmentStatus.CONSULTATION_COMPLETED
        )
      );
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    fetchPatients();
    fetchDoctors();
  }, []);

  const handleCheckIn = async (appointmentId: string) => {
    try {
      await appointmentsService.checkIn(appointmentId);
      await loadData();
    } catch (error) {
      console.error('Failed to check in:', error);
    }
  };

  const handleClose = (appointmentId: string) => {
    const appointment = consultationCompleted.find((apt) => apt.id === appointmentId);
    if (!appointment) {
      setError('Rendez-vous introuvable pour la clôture');
      return;
    }
    setClosingAppointment(appointment);
    setBillingAmount('');
    setBillingStatus(BillingStatus.PENDING);
    setError('');
    setOpenCloseDialog(true);
  };

  const fetchPatients = async () => {
    try {
      const data = await patientsService.getAll();
      setPatients(data);
      setPatientsCount(data.length);
    } catch (err) {
      console.error('Erreur chargement patients');
      setPatientsCount(0);
    }
  };

  const fetchDoctors = async () => {
    try {
      const data = await usersService.getDoctors();
      setDoctors(data);
    } catch (err) {
      console.error('Erreur chargement medecins');
    }
  };

  const handleOpenCreate = () => {
    setFormData({ date: '', motif: '', patientId: '', doctorId: '' });
    setMotifChoice('AUTRE');
    setAppointmentDate('');
    setAppointmentTime('');
    setError('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ date: '', motif: '', patientId: '', doctorId: '' });
    setMotifChoice('AUTRE');
    setAppointmentDate('');
    setAppointmentTime('');
    setError('');
  };

  const handleCloseAppointmentDialog = () => {
    setOpenCloseDialog(false);
    setClosingAppointment(null);
    setBillingAmount('');
    setBillingStatus(BillingStatus.PENDING);
  };

  const handleConfirmCloseAppointment = async () => {
    if (!closingAppointment) return;
    const amountValue = Number(billingAmount);
    if (Number.isNaN(amountValue) || amountValue < 0) {
      setError('Veuillez saisir un montant valide');
      return;
    }
    try {
      await appointmentsService.close(closingAppointment.id, amountValue, billingStatus);
      handleCloseAppointmentDialog();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la clôture');
    }
  };

  const updateAppointmentDateTime = (nextDate: string, nextTime: string) => {
    setAppointmentDate(nextDate);
    setAppointmentTime(nextTime);
    if (!nextDate || !nextTime) {
      setFormData((prev) => ({ ...prev, date: '' }));
      return;
    }
    setFormData((prev) => ({ ...prev, date: `${nextDate}T${nextTime}` }));
  };

  const handleSaveAppointment = async () => {
    const nextMotif =
      motifChoice === 'AUTRE' ? formData.motif.trim() : motifChoice;
    if (!formData.patientId || !formData.doctorId || !formData.date) {
      setError('Veuillez selectionner un patient, un medecin et une date/heure');
      return;
    }
    if (!nextMotif) {
      setError('Veuillez renseigner le motif du rendez-vous');
      return;
    }
    try {
      await appointmentsService.create({ ...formData, motif: nextMotif });
      handleCloseDialog();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const motifOptions = [
    'Consultation generale',
    'Controle',
    'Vaccination',
    'Suivi',
    'Urgence',
  ];

  const availableDates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 30 }, (_, index) => {
      const date = addDays(today, index);
      return {
        value: format(date, 'yyyy-MM-dd'),
        label: format(date, "EEEE d MMMM yyyy", { locale: fr }),
      };
    });
  }, []);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    const startMinutes = 8 * 60;
    const endMinutes = 20 * 60;
    const step = 30;
    for (let minutes = startMinutes; minutes <= endMinutes; minutes += step) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      slots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
    }
    return slots;
  }, []);

  const isMotifValid = motifChoice === 'AUTRE' ? Boolean(formData.motif.trim()) : true;
  const isFormValid = Boolean(formData.patientId && formData.doctorId && formData.date && isMotifValid);

  // Loading skeleton selon spécs UX - jamais de page blanche
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width={350} height={48} />
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
      {/* Header avec actions rapides */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        {/* Boutons d'action rapide */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<Event />}
            onClick={() => navigate('/appointments')}
          >
            Calendrier
          </Button>
          <Button
            variant="outlined"
            startIcon={<People />}
            onClick={() => navigate('/patients')}
          >
            Patients
          </Button>
          <Button
            variant="contained"
            startIcon={<EventAvailable />}
            onClick={handleOpenCreate}
            sx={{ boxShadow: 2 }}
          >
            Nouveau RDV
          </Button>
        </Box>
      </Box>

      {/* Cards de statistiques avec badges notifications */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%', 
              cursor: scheduledAppointments.length > 0 ? 'pointer' : 'default',
              border: scheduledAppointments.length > 0 ? '2px solid' : '1px solid',
              borderColor: scheduledAppointments.length > 0 ? 'primary.main' : 'divider'
            }}
            onClick={() => scheduledAppointments.length > 0 && document.getElementById('check-in-section')?.scrollIntoView()}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Check-in à effectuer
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 600 }}>
                    {scheduledAppointments.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Patients arrivés
                  </Typography>
                </Box>
                <Badge 
                  badgeContent={scheduledAppointments.length} 
                  color="primary"
                  sx={{ 
                    '& .MuiBadge-badge': { 
                      fontSize: '0.75rem',
                      display: scheduledAppointments.length > 0 ? 'block' : 'none'
                    } 
                  }}
                >
                  <EventAvailable sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
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
                    En attente de clôture
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'warning.main', fontWeight: 600 }}>
                    {consultationCompleted.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Consultations terminées
                  </Typography>
                </Box>
                <MonetizationOn sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
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
                    Patients enregistrés
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'success.main', fontWeight: 600 }}>
                    {patientsCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Base de données
                  </Typography>
                </Box>
                <People sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Section Check-in - Action prioritaire selon spécs UX */}
      <Card id="check-in-section" sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 500, color: 'primary.main' }}>
              Check-in Patients
            </Typography>
            <Badge badgeContent={scheduledAppointments.length} color="primary">
              <EventAvailable />
            </Badge>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {scheduledAppointments.length === 0 ? (
            <Box textAlign="center" p={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Tous les patients sont enregistrés
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aucun patient en attente de check-in pour le moment.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Heure RDV</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Motif</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Médecin</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Statut</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scheduledAppointments.map((appointment) => (
                    <TableRow key={appointment.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Person sx={{ color: 'primary.main', mr: 1 }} />
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {appointment.patient?.firstName} {appointment.patient?.lastName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccessTime sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {new Date(appointment.date).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {appointment.motif}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          Dr. {appointment.doctor?.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <WorkflowStatusChip status={appointment.status} />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={<CheckCircle />}
                          onClick={() => handleCheckIn(appointment.id)}
                          sx={{ 
                            minWidth: 120,
                            fontWeight: 600
                          }}
                        >
                          Check-in
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Section Clôture administrative */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 500, color: 'warning.main' }}>
              Clôture & Facturation
            </Typography>
            <Badge badgeContent={consultationCompleted.length} color="warning">
              <Receipt />
            </Badge>
          </Box>

          {consultationCompleted.length === 0 ? (
            <Box textAlign="center" p={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Aucune consultation à clôturer
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toutes les consultations ont été clôturées et facturées.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Médecin</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Motif</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Statut</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {consultationCompleted.map((appointment) => (
                    <TableRow key={appointment.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Person sx={{ color: 'primary.main', mr: 1 }} />
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {appointment.patient?.firstName} {appointment.patient?.lastName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                           {appointment.doctor?.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {appointment.motif}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(appointment.date).toLocaleDateString('fr-FR')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <WorkflowStatusChip status={appointment.status} />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          color="warning"
                          size="large"
                          startIcon={<Receipt />}
                          onClick={() => handleClose(appointment.id)}
                          sx={{ 
                            minWidth: 120,
                            fontWeight: 600
                          }}
                        >
                          Clôturer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Nouveau Rendez-vous</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              fullWidth
              select
              label="Patient"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
            >
              {patients.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Médecin"
              value={formData.doctorId}
              onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
              SelectProps={{ displayEmpty: true }}
            >
              {doctors.map((doctor) => (
                <MenuItem key={doctor.id} value={doctor.id}>
                  {doctor.name} ({doctor.email})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Jour"
              value={appointmentDate}
              onChange={(e) => updateAppointmentDateTime(e.target.value, appointmentTime)}
              SelectProps={{ displayEmpty: true }}
            >
              {availableDates.map((date) => (
                <MenuItem key={date.value} value={date.value}>
                  {date.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Heure"
              value={appointmentTime}
              onChange={(e) => updateAppointmentDateTime(appointmentDate, e.target.value)}
              SelectProps={{ displayEmpty: true }}
            >
              {timeSlots.map((slot) => (
                <MenuItem key={slot} value={slot}>
                  {slot}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Motif"
              value={motifChoice}
              onChange={(e) => {
                const value = e.target.value;
                setMotifChoice(value);
                setFormData({
                  ...formData,
                  motif: value === 'AUTRE' ? '' : value,
                });
              }}
            >
              {motifOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
              <MenuItem value="AUTRE">Autre (preciser)</MenuItem>
            </TextField>
            {motifChoice === 'AUTRE' && (
              <TextField
                fullWidth
                label="Preciser le motif"
                value={formData.motif}
                onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                multiline
                rows={3}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button
            onClick={handleSaveAppointment}
            variant="contained"
            disabled={!isFormValid}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCloseDialog} onClose={handleCloseAppointmentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Clôturer le rendez-vous</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {closingAppointment
                ? `${closingAppointment.patient?.firstName || ''} ${closingAppointment.patient?.lastName || ''}`.trim() || 'Patient'
                : 'Patient'}
            </Typography>
            <TextField
              fullWidth
              label="Montant de facturation"
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              value={billingAmount}
              onChange={(e) => setBillingAmount(e.target.value)}
            />
            <TextField
              fullWidth
              select
              label="Statut de paiement"
              value={billingStatus}
              onChange={(e) => setBillingStatus(e.target.value as BillingStatus)}
            >
              <MenuItem value={BillingStatus.PENDING}>En attente</MenuItem>
              <MenuItem value={BillingStatus.PAID}>Payé</MenuItem>
              <MenuItem value={BillingStatus.PARTIALLY_PAID}>Partiellement payé</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAppointmentDialog}>Annuler</Button>
          <Button onClick={handleConfirmCloseAppointment} variant="contained">
            Clôturer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
