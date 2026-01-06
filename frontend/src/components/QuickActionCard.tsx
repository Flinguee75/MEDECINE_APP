import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Avatar,
} from '@mui/material';

interface QuickActionCardProps {
  title: string;
  subtitle: string;
  status?: string;
  statusColor?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  actionLabel: string;
  onAction: () => void;
  patientName?: string;
  time?: string;
  disabled?: boolean;
}

export function QuickActionCard({
  title,
  subtitle,
  status,
  statusColor = 'default',
  actionLabel,
  onAction,
  patientName,
  time,
  disabled = false,
}: QuickActionCardProps) {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              {patientName && (
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976D2' }}>
                  {patientName.charAt(0).toUpperCase()}
                </Avatar>
              )}
              <Typography variant="h6" component="div">
                {title}
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {subtitle}
            </Typography>
            <Box display="flex" gap={1} alignItems="center" mt={1}>
              {status && <Chip label={status} color={statusColor} size="small" />}
              {time && (
                <Typography variant="caption" color="textSecondary">
                  {time}
                </Typography>
              )}
            </Box>
          </Box>
          <Button
            variant="contained"
            onClick={onAction}
            disabled={disabled}
            sx={{ ml: 2, whiteSpace: 'nowrap' }}
          >
            {actionLabel}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
