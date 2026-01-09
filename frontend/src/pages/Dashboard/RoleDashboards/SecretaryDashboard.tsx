import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { PersonAdd, AssignmentTurnedIn, People } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { appointmentsService } from '../../../services/appointmentsService';
import { patientsService } from '../../../services/patientsService';
import { usersService } from '../../../services/usersService';
import { Appointment, AppointmentStatus, BillingStatus, CreateAppointmentData } from '../../../types/Appointment';
import { Patient } from '../../../types/Patient';
import { User } from '../../../types/User';
import { StatCard } from '../../../components/StatCard';
import { QuickActionCard } from '../../../components/QuickActionCard';
import { EmptyState } from '../../../components/EmptyState';
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Tableau de bord Secrétariat
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Rendez-vous à enregistrer"
            value={scheduledAppointments.length}
            icon={<PersonAdd />}
            color="#1976D2"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Consultations à clôturer"
            value={consultationCompleted.length}
            icon={<AssignmentTurnedIn />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Patients enregistrés"
            value={patientsCount}
            icon={<People />}
            color="#6a1b9a"
          />
        </Grid>
      </Grid>

      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Enregistrements aujourd'hui</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={() => navigate('/appointments')}>
              Voir calendrier
            </Button>
            <Button variant="outlined" onClick={() => navigate('/patients')}>
              Gérer patients
            </Button>
            <Button variant="outlined" onClick={handleOpenCreate}>
              Nouveau rendez-vous
            </Button>
          </Box>
        </Box>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {scheduledAppointments.length === 0 ? (
          <EmptyState message="Aucun rendez-vous à enregistrer" />
        ) : (
          scheduledAppointments.map((apt) => (
            <QuickActionCard
              key={apt.id}
              title={`${apt.patient?.firstName} ${apt.patient?.lastName}`}
              subtitle={`${new Date(apt.date).toLocaleDateString()} - ${apt.motif}`}
              status="Planifié"
              statusColor="default"
              actionLabel="Enregistrer"
              onAction={() => handleCheckIn(apt.id)}
              time={new Date(apt.date).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            />
          ))
        )}
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Consultations à clôturer
        </Typography>
        {consultationCompleted.length === 0 ? (
          <EmptyState message="Aucune consultation à clôturer" />
        ) : (
          consultationCompleted.map((apt) => (
            <QuickActionCard
              key={apt.id}
              title={`${apt.patient?.firstName} ${apt.patient?.lastName}`}
              subtitle={`Dr. ${apt.doctor?.name} - ${apt.motif}`}
              status="Consultation terminée"
              statusColor="success"
              actionLabel="Clôturer"
              onAction={() => handleClose(apt.id)}
            />
          ))
        )}
      </Box>

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
