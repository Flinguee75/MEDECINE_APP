import { Box, Typography, Paper } from '@mui/material';
import { ReactNode } from 'react';

interface EmptyStateProps {
  message: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ message, icon, action }: EmptyStateProps) {
  return (
    <Paper
      sx={{
        p: 4,
        textAlign: 'center',
        bgcolor: '#f5f5f5',
      }}
    >
      {icon && (
        <Box sx={{ mb: 2, color: 'text.secondary', fontSize: 48 }}>
          {icon}
        </Box>
      )}
      <Typography variant="h6" color="textSecondary" gutterBottom>
        {message}
      </Typography>
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Paper>
  );
}
