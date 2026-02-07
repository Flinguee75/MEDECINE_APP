import {
  Box,
  Button,
  Paper,
  Typography,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Role } from '../../types/User';
import { SecretaryDashboard } from './RoleDashboards/SecretaryDashboard';
import { NurseDashboard } from './RoleDashboards/NurseDashboard';
import { DoctorDashboard } from './RoleDashboards/DoctorDashboard';
import { BiologistDashboard } from './RoleDashboards/BiologistDashboard';
import { RadiologistDashboard } from './RoleDashboards/RadiologistDashboard';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrateur';
      case 'DOCTOR':
        return 'Médecin';
      case 'BIOLOGIST':
        return 'Biologiste';
      case 'NURSE':
        return 'Infirmier';
      case 'SECRETARY':
        return 'Secrétaire';
      case 'RADIOLOGIST':
        return 'Radiologue';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '#d32f2f';
      case 'DOCTOR':
        return '#1976d2';
      case 'BIOLOGIST':
        return '#388e3c';
      case 'NURSE':
        return '#00897b';
      case 'SECRETARY':
        return '#f57c00';
      case 'RADIOLOGIST':
        return '#9c27b0';
      default:
        return '#757575';
    }
  };

  const getDisplayName = (name: string) => {
    const roleLabels = [
      'Administrateur',
      'Médecin',
      'Biologiste',
      'Infirmier',
      'Secrétaire',
      'Radiologue',
    ];
    let displayName = name;

    roleLabels.forEach((roleLabel) => {
      displayName = displayName
        .replace(new RegExp(`\\s*${roleLabel}\\s*`, 'gi'), '')
        .trim();
    });

    const parts = displayName.split(' ');
    return parts[0] || displayName;
  };

  const renderRoleBasedDashboard = () => {
    switch (user.role) {
      case Role.SECRETARY:
        return <SecretaryDashboard />;
      case Role.NURSE:
        return <NurseDashboard />;
      case Role.DOCTOR:
        return <DoctorDashboard />;
      case Role.BIOLOGIST:
        return <BiologistDashboard />;
      case Role.RADIOLOGIST:
        return <RadiologistDashboard />;
      case Role.ADMIN:
        // Admin can see doctor dashboard for now, or create a separate AdminDashboard
        return <DoctorDashboard />;
      default:
        return (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography>Dashboard not available for this role</Typography>
          </Box>
        );
    }
  };

  return (
    <Box>
      {/* Header with user info */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: getRoleColor(user.role),
                fontSize: '1.5rem',
                fontWeight: 'bold',
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Bienvenue, {getDisplayName(user.name)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  label={getRoleLabel(user.role)}
                  sx={{
                    bgcolor: getRoleColor(user.role),
                    color: 'white',
                    fontWeight: 'medium',
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Button
            variant="outlined"
            color="error"
            onClick={handleLogout}
            size="large"
            sx={{ px: 4 }}
          >
            Se déconnecter
          </Button>
        </Box>
      </Paper>

      <Divider sx={{ mb: 4 }} />

      {/* Role-specific dashboard */}
      {renderRoleBasedDashboard()}
    </Box>
  );
};
