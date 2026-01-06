import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Paper,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { auditService, AuditLog } from '../../services/auditService';

interface AppointmentAuditLogProps {
  appointmentId: string;
}

export function AppointmentAuditLog({ appointmentId }: AppointmentAuditLogProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await auditService.getEntityAuditLogs(
          'APPOINTMENT',
          appointmentId,
        );
        setLogs(data);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            'Erreur lors de la récupération de l\'historique',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [appointmentId]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATED':
        return <InfoIcon />;
      case 'UPDATED':
        return <EditIcon />;
      case 'DELETED':
        return <WarningIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATED':
        return 'success';
      case 'UPDATED':
        return 'primary';
      case 'DELETED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  };

  const renderChanges = (changes: Record<string, { old: any; new: any }>) => {
    return Object.entries(changes).map(([field, { old: oldValue, new: newValue }]) => {
      let displayField = field;
      let displayOld = oldValue;
      let displayNew = newValue;

      // Formater les champs pour l'affichage
      if (field === 'date') {
        displayField = 'Date';
        displayOld = formatDate(oldValue);
        displayNew = formatDate(newValue);
      } else if (field === 'motif') {
        displayField = 'Motif';
      } else if (field === 'doctorId') {
        displayField = 'Médecin';
      }

      return (
        <Box key={field} sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>{displayField}:</strong>
          </Typography>
          <Typography variant="body2" sx={{ ml: 2 }}>
            <Chip label={displayOld} size="small" color="error" sx={{ mr: 1 }} />
            →
            <Chip label={displayNew} size="small" color="success" sx={{ ml: 1 }} />
          </Typography>
        </Box>
      );
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (logs.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Aucun historique de modification disponible
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Historique des modifications
      </Typography>

      <Timeline>
        {logs.map((log, index) => (
          <TimelineItem key={log.id}>
            <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.2 }}>
              <Typography variant="caption">{formatDate(log.performedAt)}</Typography>
            </TimelineOppositeContent>

            <TimelineSeparator>
              <TimelineDot color={getActionColor(log.action) as any}>
                {getActionIcon(log.action)}
              </TimelineDot>
              {index < logs.length - 1 && <TimelineConnector />}
            </TimelineSeparator>

            <TimelineContent>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="subtitle2" fontWeight="bold">
                    {log.action === 'CREATED' && 'Création'}
                    {log.action === 'UPDATED' && 'Modification'}
                    {log.action === 'DELETED' && 'Suppression'}
                  </Typography>
                  {log.performer && (
                    <Chip
                      label={log.performer.name}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>

                {Object.keys(log.changes).length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Modifications:
                    </Typography>
                    {renderChanges(log.changes)}
                  </Box>
                )}

                {log.reason && (
                  <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      <strong>Raison:</strong>
                    </Typography>
                    <Typography variant="body2">{log.reason}</Typography>
                  </Box>
                )}
              </Paper>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </Box>
  );
}
