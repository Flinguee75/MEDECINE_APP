import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import {
  CalendarToday,
  EventAvailable,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { Appointment, AppointmentStatus } from '../../types/Appointment';
import { isToday } from 'date-fns';

interface StatisticsCardsProps {
  appointments: Appointment[];
}

export const StatisticsCards = ({ appointments }: StatisticsCardsProps) => {
  const totalAppointments = appointments.length;

  const todayAppointments = appointments.filter((apt) =>
    isToday(new Date(apt.date))
  ).length;

  const scheduledAppointments = appointments.filter(
    (apt) => apt.status === AppointmentStatus.SCHEDULED
  ).length;

  const completedAppointments = appointments.filter(
    (apt) => apt.status === AppointmentStatus.COMPLETED
  ).length;

  const cancelledAppointments = appointments.filter(
    (apt) => apt.status === AppointmentStatus.CANCELLED
  ).length;

  const stats = [
    {
      title: 'Total RDV',
      value: totalAppointments,
      icon: <CalendarToday sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      bgColor: '#e3f2fd',
    },
    {
      title: "Aujourd'hui",
      value: todayAppointments,
      icon: <EventAvailable sx={{ fontSize: 40 }} />,
      color: '#f57c00',
      bgColor: '#fff3e0',
    },
    {
      title: 'Programmés',
      value: scheduledAppointments,
      icon: <CalendarToday sx={{ fontSize: 40 }} />,
      color: '#1a73e8',
      bgColor: '#e8f0fe',
    },
    {
      title: 'Terminés',
      value: completedAppointments,
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      bgColor: '#e8f5e9',
    },
    {
      title: 'Annulés',
      value: cancelledAppointments,
      icon: <Cancel sx={{ fontSize: 40 }} />,
      color: '#c62828',
      bgColor: '#ffebee',
    },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={2.4} key={index}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderColor: stat.color,
              },
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    bgcolor: stat.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: stat.color,
                  }}
                >
                  {stat.icon}
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stat.title}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
