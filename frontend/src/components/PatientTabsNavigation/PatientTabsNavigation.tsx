import React, { useState, ReactNode } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Badge,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Info,
  MonitorHeart,
  Science,
  Assessment,
  Description,
} from '@mui/icons-material';
import { Role } from '../../types/User';

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`patient-tabpanel-${index}`}
      aria-labelledby={`patient-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `patient-tab-${index}`,
    'aria-controls': `patient-tabpanel-${index}`,
  };
}

export interface PatientTabsData {
  newResults: number;
  activePrescriptions: number;
  pendingVitals: number;
  unreadNotes: number;
}

interface PatientTabsNavigationProps {
  userRole: Role;
  badges: PatientTabsData;
  children: {
    informations: ReactNode;
    constantes: ReactNode;
    prescriptions: ReactNode;
    resultats: ReactNode;
    notes: ReactNode;
  };
}

export function PatientTabsNavigation({ 
  userRole, 
  badges, 
  children 
}: PatientTabsNavigationProps) {
  const [value, setValue] = useState(0);
  const theme = useTheme();

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // Permissions par rôle selon spécs UX
  const getTabPermissions = (tabIndex: number) => {
    const permissions = {
      canRead: false,
      canWrite: false,
    };

    switch (tabIndex) {
      case 0: // Informations
        permissions.canRead = [Role.DOCTOR, Role.NURSE, Role.BIOLOGIST, Role.ADMIN].includes(userRole);
        permissions.canWrite = [Role.DOCTOR, Role.ADMIN].includes(userRole);
        break;
      case 1: // Constantes
        permissions.canRead = [Role.DOCTOR, Role.NURSE, Role.ADMIN].includes(userRole);
        permissions.canWrite = [Role.NURSE, Role.DOCTOR, Role.ADMIN].includes(userRole);
        break;
      case 2: // Prescriptions
        permissions.canRead = [Role.DOCTOR, Role.NURSE, Role.BIOLOGIST, Role.ADMIN].includes(userRole);
        permissions.canWrite = [Role.DOCTOR, Role.ADMIN].includes(userRole);
        break;
      case 3: // Résultats
        permissions.canRead = [Role.DOCTOR, Role.BIOLOGIST, Role.ADMIN].includes(userRole);
        permissions.canWrite = [Role.BIOLOGIST, Role.DOCTOR, Role.ADMIN].includes(userRole);
        break;
      case 4: // Notes
        permissions.canRead = [Role.DOCTOR, Role.NURSE, Role.ADMIN].includes(userRole);
        permissions.canWrite = [Role.DOCTOR, Role.NURSE, Role.ADMIN].includes(userRole);
        break;
    }

    return permissions;
  };

  // Filtrer les onglets selon les permissions
  const availableTabs = [
    {
      index: 0,
      label: 'Informations',
      icon: <Info />,
      badge: 0,
      content: children.informations,
    },
    {
      index: 1,
      label: 'Constantes',
      icon: <MonitorHeart />,
      badge: badges.pendingVitals,
      content: children.constantes,
    },
    {
      index: 2,
      label: 'Prescriptions',
      icon: <Science />,
      badge: badges.activePrescriptions,
      content: children.prescriptions,
    },
    {
      index: 3,
      label: 'Résultats',
      icon: <Assessment />,
      badge: badges.newResults,
      content: children.resultats,
    },
    {
      index: 4,
      label: 'Notes',
      icon: <Description />,
      badge: badges.unreadNotes,
      content: children.notes,
    },
  ].filter(tab => getTabPermissions(tab.index).canRead);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={value} 
          onChange={handleChange} 
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '1rem',
              fontWeight: 500,
              textTransform: 'none',
            },
            '& .MuiTab-root.Mui-selected': {
              color: theme.palette.primary.main,
              fontWeight: 600,
            },
            '& .MuiTabs-indicator': {
              height: 3,
            },
          }}
        >
          {availableTabs.map((tab, mappedIndex) => (
            <Tab
              key={tab.index}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {tab.badge > 0 ? (
                    <Badge 
                      badgeContent={tab.badge} 
                      color={
                        tab.index === 3 ? 'error' : // Résultats en rouge
                        tab.index === 2 ? 'warning' : // Prescriptions en orange
                        'primary' // Autres en bleu
                      }
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.75rem',
                          minWidth: 18,
                          height: 18,
                        }
                      }}
                    >
                      {tab.icon}
                    </Badge>
                  ) : (
                    tab.icon
                  )}
                  <Typography variant="inherit">
                    {tab.label}
                  </Typography>
                </Box>
              }
              {...a11yProps(mappedIndex)}
              sx={{
                opacity: getTabPermissions(tab.index).canWrite ? 1 : 0.7,
              }}
            />
          ))}
        </Tabs>
      </Box>

      {availableTabs.map((tab, mappedIndex) => (
        <TabPanel key={tab.index} value={value} index={mappedIndex}>
          <Box sx={{ 
            position: 'relative',
            '&::before': !getTabPermissions(tab.index).canWrite ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.02)',
              zIndex: 1,
              pointerEvents: 'none',
            } : {},
          }}>
            {!getTabPermissions(tab.index).canWrite && (
              <Box sx={{ 
                position: 'absolute', 
                top: 8, 
                right: 8, 
                zIndex: 2,
                backgroundColor: 'info.light',
                color: 'info.contrastText',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem',
              }}>
                Lecture seule
              </Box>
            )}
            {tab.content}
          </Box>
        </TabPanel>
      ))}
    </Box>
  );
}
