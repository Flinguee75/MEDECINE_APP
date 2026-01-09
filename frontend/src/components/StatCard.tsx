import { Card, CardContent, Typography, Box } from '@mui/material';
import { ReactNode, MouseEventHandler } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: ReactNode;
  color?: string;
  subtitle?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

export function StatCard({
  title,
  value,
  icon,
  color = '#1976D2',
  subtitle,
  onClick,
}: StatCardProps) {
  const isClickable = Boolean(onClick);

  return (
    <Card
      sx={{ height: '100%', cursor: isClickable ? 'pointer' : 'default' }}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
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
