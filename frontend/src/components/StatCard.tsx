import { Card, CardContent, Typography, Box } from '@mui/material';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: ReactNode;
  color?: string;
  subtitle?: string;
}

export function StatCard({ title, value, icon, color = '#1976D2', subtitle }: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ color, fontWeight: 'bold' }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: `${color}15`,
                color,
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
