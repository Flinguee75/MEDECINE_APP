import { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  MenuItem,
  Divider,
} from '@mui/material';
import { Add, ArrowBack, Edit } from '@mui/icons-material';
import { appointmentsService } from '../../services/appointmentsService';
import { patientsService } from '../../services/patientsService';
import { usersService } from '../../services/usersService';
import { Appointment, CreateAppointmentData, AppointmentStatus } from '../../types/Appointment';
import { Patient } from '../../types/Patient';
import { Role, User } from '../../types/User';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer, type Event } from 'react-big-calendar';
import { addDays, addMinutes, format, getDay, parse, startOfWeek as startOfWeekFn } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './appointmentsCalendar.css';
import { EditAppointmentModal } from '../../components/EditAppointmentModal/EditAppointmentModal';

const locales = {
  fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeekFn(date, { locale: fr }),
  getDay,
  locales,
});

type AppointmentEvent = Event & { resource: Appointment };

export const AppointmentsList = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [motifChoice, setMotifChoice] = useState('AUTRE');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [formData, setFormData] = useState<CreateAppointmentData>({
    date: '',
    motif: '',
    patientId: '',
    doctorId: '',
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  const canCreateAppointment = user?.role === Role.SECRETARY || user?.role === Role.ADMIN;
  const canEditAppointment =
    user?.role === Role.SECRETARY || user?.role === Role.DOCTOR || user?.role === Role.ADMIN;
  const canCancelAppointment = user?.role === Role.SECRETARY || user?.role === Role.ADMIN;

  const motifOptions = [
    'Consultation generale',
    'Controle',
    'Vaccination',
    'Suivi',
    'Urgence',
  ];

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchDoctors();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointmentsService.getAll();
      setAppointments(data);
    } catch (err: any) {
      setError('Erreur lors du chargement des rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const data = await patientsService.getAll();
      setPatients(data);
    } catch (err) {
      console.error('Erreur chargement patients');
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

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAppointment(null);
    setFormData({ date: '', motif: '', patientId: '', doctorId: '' });
    setMotifChoice('AUTRE');
    setAppointmentDate('');
    setAppointmentTime('');
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

  const handleOpenCreate = () => {
    setEditingAppointment(null);
    setFormData({ date: '', motif: '', patientId: '', doctorId: '' });
    setMotifChoice('AUTRE');
    setAppointmentDate('');
    setAppointmentTime('');
    setOpenDialog(true);
  };

  const handleOpenEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setOpenDialog(true);
    const date = new Date(appointment.date);
    const nextDate = format(date, 'yyyy-MM-dd');
    const nextTime = format(date, 'HH:mm');
    updateAppointmentDateTime(nextDate, nextTime);
    setFormData((prev) => ({
      ...prev,
      motif: appointment.motif,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
    }));
    if (motifOptions.includes(appointment.motif)) {
      setMotifChoice(appointment.motif);
    } else {
      setMotifChoice('AUTRE');
    }
  };

  const handleSaveAppointment = async () => {
    if (!formData.patientId || !formData.doctorId || !formData.date) {
      setError('Veuillez selectionner un patient, un medecin et une date/heure');
      return;
    }
    try {
      if (editingAppointment) {
        await appointmentsService.update(editingAppointment.id, formData);
      } else {
        await appointmentsService.create(formData);
      }
      handleCloseDialog();
      fetchAppointments();
    } catch (err: any) {
      const fallbackMessage = editingAppointment
        ? 'Erreur lors de la modification'
        : 'Erreur lors de la création';
      setError(err.response?.data?.message || fallbackMessage);
    }
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return 'primary';
      case AppointmentStatus.WAITING_RESULTS:
        return 'warning';
      case AppointmentStatus.COMPLETED:
        return 'success';
      case AppointmentStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return 'Programmé';
      case AppointmentStatus.WAITING_RESULTS:
        return 'En attente de résultats';
      case AppointmentStatus.COMPLETED:
        return 'Terminé';
      case AppointmentStatus.CANCELLED:
        return 'Annulé';
      default:
        return status;
    }
  };

  const events: AppointmentEvent[] = useMemo(() => {
    return appointments.map((appointment) => {
      const start = new Date(appointment.date);
      const end = addMinutes(start, 30);
      const patientName = appointment.patient
        ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
        : 'Patient';
      return {
        id: appointment.id,
        title: patientName, // Afficher seulement le nom du patient
        start,
        end,
        resource: appointment,
      };
    });
  }, [appointments]);

  const handleEventClick = (event: AppointmentEvent) => {
    setSelectedAppointment(event.resource);
    setOpenDetailsDialog(true);
  };

  // Définir les heures min et max pour le calendrier (8h - 20h)
  const minTime = useMemo(() => {
    const date = new Date();
    date.setHours(8, 0, 0, 0);
    return date;
  }, []);

  const maxTime = useMemo(() => {
    const date = new Date();
    date.setHours(20, 0, 0, 0);
    return date;
  }, []);

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

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/dashboard')}
            >
              Retour
            </Button>
            <Typography variant="h4">Rendez-vous</Typography>
          </Box>
          {canCreateAppointment && (
            <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
              Nouveau RDV
            </Button>
          )}
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Card>
          <CardContent sx={{ p: 2 }}>
            {loading ? (
              <Typography variant="body2" color="text.secondary">
                Chargement...
              </Typography>
            ) : appointments.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Aucun rendez-vous
              </Typography>
            ) : (
              <Calendar
                className="appointments-calendar"
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                defaultView="week"
                views={['month', 'week', 'day', 'agenda']}
                style={{ height: 650 }}
                min={minTime}
                max={maxTime}
                onSelectEvent={handleEventClick}
                messages={{
                  today: "Aujourd'hui",
                  previous: '←',
                  next: '→',
                  month: 'Mois',
                  week: 'Semaine',
                  day: 'Jour',
                  agenda: 'Agenda',
                  date: 'Date',
                  time: 'Heure',
                  event: 'Rendez-vous',
                  noEventsInRange: 'Aucun rendez-vous',
                }}
                eventPropGetter={(event) => {
                  const status = event.resource.status;
                  const colorMap: Record<AppointmentStatus, string> = {
                    [AppointmentStatus.SCHEDULED]: '#1a73e8',
                    [AppointmentStatus.CHECKED_IN]: '#00897b',
                    [AppointmentStatus.IN_CONSULTATION]: '#1976d2',
                    [AppointmentStatus.WAITING_RESULTS]: '#f9a825',
                    [AppointmentStatus.CONSULTATION_COMPLETED]: '#388e3c',
                    [AppointmentStatus.COMPLETED]: '#2e7d32',
                    [AppointmentStatus.CANCELLED]: '#c62828',
                  };
                  return {
                    style: {
                      backgroundColor: colorMap[status],
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      padding: '8px 12px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      minHeight: '32px',
                    },
                  };
                }}
              />
            )}
          </CardContent>
        </Card>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Légende: <Chip label={getStatusLabel(AppointmentStatus.SCHEDULED)} color={getStatusColor(AppointmentStatus.SCHEDULED)} size="small" />{' '}
            <Chip label={getStatusLabel(AppointmentStatus.WAITING_RESULTS)} color={getStatusColor(AppointmentStatus.WAITING_RESULTS)} size="small" />{' '}
            <Chip label={getStatusLabel(AppointmentStatus.COMPLETED)} color={getStatusColor(AppointmentStatus.COMPLETED)} size="small" />{' '}
            <Chip label={getStatusLabel(AppointmentStatus.CANCELLED)} color={getStatusColor(AppointmentStatus.CANCELLED)} size="small" />
          </Typography>
        </Box>
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAppointment ? 'Modifier le Rendez-vous' : 'Nouveau Rendez-vous'}
        </DialogTitle>
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
            disabled={!formData.patientId || !formData.doctorId || !formData.date}
          >
            {editingAppointment ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pour afficher les détails du rendez-vous */}
      <Dialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Détails du Rendez-vous</DialogTitle>
        <DialogContent>
          {selectedAppointment && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Patient
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedAppointment.patient
                    ? `${selectedAppointment.patient.firstName} ${selectedAppointment.patient.lastName}`
                    : 'Patient inconnu'}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Date et heure
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {format(new Date(selectedAppointment.date), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Motif
                </Typography>
                <Typography variant="body1">{selectedAppointment.motif}</Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Statut
                </Typography>
                <Chip
                  label={getStatusLabel(selectedAppointment.status)}
                  color={getStatusColor(selectedAppointment.status)}
                  size="small"
                />
              </Box>
              <Divider />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedAppointment && canCancelAppointment && (
            <Button
              onClick={() => setOpenCancelDialog(true)}
              color="error"
              variant="outlined"
            >
              Annuler le RDV
            </Button>
          )}
          {selectedAppointment && canEditAppointment && user?.role === Role.SECRETARY && (
            <Button
              onClick={() => {
                setOpenDetailsDialog(false);
                setEditingAppointment(selectedAppointment);
              }}
              variant="outlined"
              startIcon={<Edit />}
            >
              Modifier (avec audit)
            </Button>
          )}
          {selectedAppointment && canEditAppointment && user?.role !== Role.SECRETARY && (
            <Button
              onClick={() => {
                setOpenDetailsDialog(false);
                handleOpenEdit(selectedAppointment);
              }}
              variant="outlined"
            >
              Modifier
            </Button>
          )}
          <Button onClick={() => setOpenDetailsDialog(false)} variant="contained">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Annuler le rendez-vous</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Confirmer l'annulation du rendez-vous ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)}>Retour</Button>
          <Button
            onClick={async () => {
              if (!selectedAppointment) return;
              try {
                await appointmentsService.cancel(selectedAppointment.id);
                setOpenCancelDialog(false);
                setOpenDetailsDialog(false);
                fetchAppointments();
              } catch (err: any) {
                setError(err.response?.data?.message || 'Erreur lors de l\'annulation');
              }
            }}
            color="error"
            variant="contained"
          >
            Annuler le RDV
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal d'édition avec audit (pour secrétaires) */}
      <EditAppointmentModal
        appointment={editingAppointment}
        open={!!editingAppointment && user?.role === Role.SECRETARY}
        onClose={() => setEditingAppointment(null)}
        onSuccess={() => {
          setEditingAppointment(null);
          fetchAppointments();
        }}
      />
    </Container>
  );
};
