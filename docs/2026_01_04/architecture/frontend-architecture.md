# Frontend Architecture - Complete Clinical Workflow

**Project**: Hospital Management System MVP
**Date**: 2026-01-04
**Version**: 2.0
**Framework**: React 18 + TypeScript + Material-UI + Vite

---

## Executive Summary

This document specifies the frontend architecture for implementing the complete clinical workflow UI. The design extends the existing React application with new role-based dashboards, reusable components, and clear state management patterns.

**Key Additions**:
- 1 new dashboard (NurseDashboard)
- 7 new dialog/drawer components
- 4 reusable UI components
- Extended existing dashboards for SECRETARY, DOCTOR, BIOLOGIST
- Clear state management strategy using Context API

---

## Component Hierarchy

```
src/
├── main.tsx
├── App.tsx (Root with AuthProvider and Theme)
│
├── contexts/
│   └── AuthContext.tsx (EXISTING - Session management)
│
├── components/
│   ├── common/              (NEW - Reusable components)
│   │   ├── StatCard.tsx
│   │   ├── QuickActionCard.tsx
│   │   ├── StatusChip.tsx
│   │   └── EmptyState.tsx
│   │
│   ├── layout/              (EXISTING)
│   │   ├── ProtectedRoute.tsx
│   │   └── PublicRoute.tsx
│   │
│   └── forms/               (NEW - Form components)
│       ├── VitalsDialog.tsx
│       ├── ConsultationDrawer.tsx
│       ├── ResultReviewDialog.tsx
│       ├── ResultEntryDialog.tsx
│       ├── SampleCollectionDialog.tsx
│       └── ClosureDialog.tsx
│
├── pages/
│   ├── Login/
│   │   └── Login.tsx (EXISTING)
│   │
│   ├── Dashboard/
│   │   ├── Dashboard.tsx (EXISTING - Router by role)
│   │   ├── AdminDashboard.tsx (EXISTING - No changes)
│   │   ├── SecretaryDashboard.tsx (EXTENDED)
│   │   ├── NurseDashboard.tsx (NEW)
│   │   ├── DoctorDashboard.tsx (EXTENDED)
│   │   └── BiologistDashboard.tsx (EXTENDED)
│   │
│   ├── Patients/
│   │   └── PatientsList.tsx (EXISTING - No changes)
│   │
│   ├── Appointments/
│   │   └── AppointmentsList.tsx (EXTENDED)
│   │
│   ├── Prescriptions/
│   │   └── PrescriptionsList.tsx (EXTENDED)
│   │
│   └── Results/
│       └── ResultsList.tsx (EXTENDED)
│
├── services/
│   ├── api.ts (EXISTING - Axios instance)
│   ├── authService.ts (EXISTING)
│   ├── patientService.ts (EXISTING)
│   ├── appointmentService.ts (EXTENDED)
│   ├── prescriptionService.ts (EXTENDED)
│   └── resultService.ts (EXTENDED)
│
├── types/
│   ├── index.ts (EXTENDED with new types)
│   └── enums.ts (EXTENDED with new statuses)
│
└── utils/
    ├── statusColors.ts (NEW)
    └── validators.ts (NEW)
```

---

## State Management Strategy

### Context API Usage

**AuthContext** (EXISTING - No Changes):
```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
```

**No Additional Context Needed**:
- Dashboard data: Fetch on mount, local state
- Forms: Local state with useState
- Modals/Dialogs: Local open/close state
- No global state beyond authentication

### Component State Pattern

```typescript
// Dashboard component pattern
function SecretaryDashboard() {
  const [appointmentsToCheckIn, setAppointmentsToCheckIn] = useState<Appointment[]>([]);
  const [appointmentsToClose, setAppointmentsToClose] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const toCheckIn = await appointmentService.getByStatus('SCHEDULED');
      const toClose = await appointmentService.getByStatus('CONSULTATION_COMPLETED');
      setAppointmentsToCheckIn(toCheckIn);
      setAppointmentsToClose(toClose);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // ... render
}
```

---

## Reusable Components Specification

### 1. StatCard Component

**Purpose**: Display statistics with icon and color

**Props**:
```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  onClick?: () => void;
}
```

**Implementation**:
```typescript
import { Card, CardContent, Box, Typography, Avatar } from '@mui/material';

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle,
  onClick
}) => (
  <Card
    elevation={2}
    sx={{
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.2s',
      '&:hover': onClick ? { transform: 'translateY(-4px)' } : {},
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);
```

---

### 2. StatusChip Component

**Purpose**: Display workflow status with appropriate color

**Props**:
```typescript
interface StatusChipProps {
  status: AppointmentStatus | PrescriptionStatus;
  size?: 'small' | 'medium';
}
```

**Implementation**:
```typescript
import { Chip } from '@mui/material';
import { getStatusColor, getStatusLabel } from '../utils/statusColors';

export const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'small' }) => (
  <Chip
    label={getStatusLabel(status)}
    size={size}
    sx={{
      bgcolor: getStatusColor(status),
      color: 'white',
      fontWeight: 'medium',
    }}
  />
);
```

**Status Colors Utility** (`src/utils/statusColors.ts`):
```typescript
export const STATUS_COLORS = {
  // Appointment statuses
  SCHEDULED: '#1976d2',
  CHECKED_IN: '#f57c00',
  IN_CONSULTATION: '#9c27b0',
  CONSULTATION_COMPLETED: '#00897b',
  COMPLETED: '#388e3c',
  CANCELLED: '#d32f2f',

  // Prescription statuses
  CREATED: '#1976d2',
  SENT_TO_LAB: '#f57c00',
  SAMPLE_COLLECTED: '#9c27b0',
  IN_PROGRESS: '#3949ab',
  RESULTS_AVAILABLE: '#ffa726',
} as const;

export const STATUS_LABELS = {
  SCHEDULED: 'Planifié',
  CHECKED_IN: 'Enregistré',
  IN_CONSULTATION: 'En Consultation',
  CONSULTATION_COMPLETED: 'Consultation Terminée',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
  CREATED: 'Créée',
  SENT_TO_LAB: 'Envoyée au Labo',
  SAMPLE_COLLECTED: 'Échantillon Collecté',
  IN_PROGRESS: 'En Analyse',
  RESULTS_AVAILABLE: 'Résultats Disponibles',
} as const;

export const getStatusColor = (status: string): string =>
  STATUS_COLORS[status] || '#757575';

export const getStatusLabel = (status: string): string =>
  STATUS_LABELS[status] || status;
```

---

### 3. EmptyState Component

**Purpose**: Display when no data is available

**Props**:
```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}
```

**Implementation**:
```typescript
import { Box, Typography } from '@mui/material';

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  action
}) => (
  <Box sx={{ textAlign: 'center', py: 6 }}>
    {React.cloneElement(icon as React.ReactElement, {
      sx: { fontSize: 64, color: 'text.disabled', mb: 2 }
    })}
    <Typography variant="h6" color="text.secondary" gutterBottom>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
        {subtitle}
      </Typography>
    )}
    {action}
  </Box>
);
```

---

## Dashboard Components

### NurseDashboard Component (NEW)

**Location**: `src/pages/Dashboard/NurseDashboard.tsx`

**Features**:
- Patients to Prepare section (CHECKED_IN appointments)
- Samples to Collect section (SENT_TO_LAB prescriptions)
- Statistics cards
- Vitals entry dialog
- Sample collection dialog

**State**:
```typescript
interface NurseDashboardState {
  patientsTooPrepare: Appointment[];
  samplesToCollect: Prescription[];
  loading: boolean;
  selectedAppointment: Appointment | null;
  selectedPrescription: Prescription | null;
  vitalsDialogOpen: boolean;
  sampleDialogOpen: boolean;
}
```

**Key Functions**:
```typescript
const handleEnterVitals = async (appointmentId: string, vitals: VitalsData) => {
  try {
    await appointmentService.enterVitals(appointmentId, vitals);
    showSuccess('Constantes enregistrées avec succès');
    fetchDashboardData(); // Refresh
    setVitalsDialogOpen(false);
  } catch (error) {
    showError(error.response?.data?.message || 'Erreur');
  }
};

const handleCollectSample = async (prescriptionId: string, notes?: string) => {
  try {
    await prescriptionService.collectSample(prescriptionId, notes);
    showSuccess('Échantillon collecté avec succès');
    fetchDashboardData();
    setSampleDialogOpen(false);
  } catch (error) {
    showError(error.response?.data?.message || 'Erreur');
  }
};
```

---

### SecretaryDashboard (EXTENDED)

**New Sections**:
1. **Check-In Section**: List of SCHEDULED appointments for today
2. **Closure Section**: List of CONSULTATION_COMPLETED appointments

**New Functions**:
```typescript
const handleCheckIn = async (appointmentId: string) => {
  try {
    await appointmentService.checkIn(appointmentId);
    showSuccess('Patient enregistré avec succès');
    fetchDashboardData();
  } catch (error) {
    showError(error.response?.data?.message || 'Erreur');
  }
};

const handleClose = async (appointmentId: string, billing: BillingData) => {
  try {
    await appointmentService.close(appointmentId, billing);
    showSuccess('Rendez-vous clôturé avec succès');
    fetchDashboardData();
    setClosureDialogOpen(false);
  } catch (error) {
    showError(error.response?.data?.message || 'Erreur');
  }
};
```

---

### DoctorDashboard (EXTENDED)

**New Sections**:
1. **Consultations Ready**: IN_CONSULTATION appointments with vitals
2. **Results to Review**: RESULTS_AVAILABLE prescriptions

**New Components**:
- ConsultationDrawer: Full-screen drawer for consultation
- ResultReviewDialog: Dialog for reviewing results

---

### BiologistDashboard (EXTENDED)

**New Sections**:
1. **Samples Received**: SAMPLE_COLLECTED prescriptions
2. **In Progress**: IN_PROGRESS prescriptions

**New Components**:
- ResultEntryDialog: Dialog for entering lab results

---

## Form Components

### VitalsDialog Component (NEW)

**Purpose**: Form for entering patient vitals

**Props**:
```typescript
interface VitalsDialogProps {
  open: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSave: (data: VitalsFormData) => Promise<void>;
}

interface VitalsFormData {
  vitals: {
    weight: number;
    height: number;
    temperature: number;
    bloodPressure: { systolic: number; diastolic: number };
    heartRate: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  };
  medicalHistoryNotes?: string;
}
```

**Validation**:
```typescript
const validateVitals = (vitals: VitalsData): string[] => {
  const errors: string[] = [];

  if (!vitals.weight || vitals.weight <= 0)
    errors.push('Le poids doit être supérieur à 0');
  if (!vitals.height || vitals.height <= 0)
    errors.push('La taille doit être supérieure à 0');
  if (!vitals.temperature || vitals.temperature < 30 || vitals.temperature > 45)
    errors.push('La température doit être entre 30 et 45°C');
  if (!vitals.bloodPressure?.systolic || vitals.bloodPressure.systolic < 50 || vitals.bloodPressure.systolic > 250)
    errors.push('La tension systolique doit être entre 50 et 250');
  if (!vitals.bloodPressure?.diastolic || vitals.bloodPressure.diastolic < 30 || vitals.bloodPressure.diastolic > 150)
    errors.push('La tension diastolique doit être entre 30 et 150');
  if (!vitals.heartRate || vitals.heartRate < 30 || vitals.heartRate > 220)
    errors.push('La fréquence cardiaque doit être entre 30 et 220');

  return errors;
};
```

**Layout**:
- Grid layout (2 columns on desktop)
- Required fields marked with asterisk
- Input adornments for units (kg, cm, °C, mmHg, bpm)
- Medical history notes textarea (optional)
- Save button disabled until all required fields valid

---

### ConsultationDrawer Component (NEW)

**Purpose**: Full-screen drawer for doctor consultation

**Props**:
```typescript
interface ConsultationDrawerProps {
  open: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onComplete: (notes: string) => Promise<void>;
  onCreatePrescription?: () => void;
}
```

**Sections**:
1. **Patient Information**: Read-only patient data
2. **Vitals Display**: Read-only vitals entered by nurse
3. **Medical History**: Read-only notes from nurse
4. **Consultation Notes**: Editable textarea for doctor
5. **Actions**: Create Prescription button, Complete Consultation button

---

### ResultReviewDialog Component (NEW)

**Purpose**: Dialog for doctor to review lab results

**Props**:
```typescript
interface ResultReviewDialogProps {
  open: boolean;
  result: Result | null;
  onClose: () => void;
  onReview: (interpretation: string) => Promise<void>;
}
```

**Sections**:
1. **Prescription Details**: What was ordered
2. **Biologist Results**: Read-only lab data
3. **Interpretation**: Editable textarea for doctor's interpretation

---

## API Service Layer

### Extended AppointmentService

**Location**: `src/services/appointmentService.ts`

```typescript
import api from './api';

export const appointmentService = {
  // EXISTING
  getAll: (filters?: AppointmentFilters) => api.get('/appointments', { params: filters }),
  getById: (id: string) => api.get(`/appointments/${id}`),
  create: (data: CreateAppointmentDto) => api.post('/appointments', data),

  // NEW
  checkIn: (id: string) =>
    api.patch(`/appointments/${id}/check-in`),

  enterVitals: (id: string, data: VitalsFormData) =>
    api.patch(`/appointments/${id}/vitals`, data),

  completeConsultation: (id: string, consultationNotes: string) =>
    api.patch(`/appointments/${id}/consultation`, { consultationNotes }),

  close: (id: string, billing: BillingData) =>
    api.patch(`/appointments/${id}/close`, billing),

  // Helper
  getByStatus: (status: AppointmentStatus) =>
    api.get('/appointments', { params: { status } }),
};
```

### Extended PrescriptionService

```typescript
export const prescriptionService = {
  // EXISTING
  getAll: (filters?: PrescriptionFilters) => api.get('/prescriptions', { params: filters }),
  getById: (id: string) => api.get(`/prescriptions/${id}`),
  create: (data: CreatePrescriptionDto) => api.post('/prescriptions', data),

  // NEW
  sendToLab: (id: string) =>
    api.patch(`/prescriptions/${id}/send-to-lab`),

  collectSample: (id: string, notes?: string) =>
    api.patch(`/prescriptions/${id}/collect-sample`, { notes }),

  startAnalysis: (id: string) =>
    api.patch(`/prescriptions/${id}/start-analysis`),

  // Helper
  getByStatus: (status: PrescriptionStatus) =>
    api.get('/prescriptions', { params: { status } }),
};
```

### Extended ResultService

```typescript
export const resultService = {
  // EXISTING
  getAll: (filters?: ResultFilters) => api.get('/results', { params: filters }),
  getById: (id: string) => api.get(`/results/${id}`),
  create: (data: CreateResultDto) => api.post('/results', data),

  // NEW
  review: (id: string, interpretation: string) =>
    api.patch(`/results/${id}/review`, { interpretation }),
};
```

---

## TypeScript Types

### Extended Types

**Location**: `src/types/index.ts`

```typescript
// Enums
export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CHECKED_IN = 'CHECKED_IN',              // NEW
  IN_CONSULTATION = 'IN_CONSULTATION',    // NEW
  CONSULTATION_COMPLETED = 'CONSULTATION_COMPLETED',  // NEW
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PrescriptionStatus {
  CREATED = 'CREATED',
  SENT_TO_LAB = 'SENT_TO_LAB',
  SAMPLE_COLLECTED = 'SAMPLE_COLLECTED',  // NEW
  IN_PROGRESS = 'IN_PROGRESS',
  RESULTS_AVAILABLE = 'RESULTS_AVAILABLE',  // NEW
  COMPLETED = 'COMPLETED',
}

export enum BillingStatus {  // NEW
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
}

// Models
export interface Appointment {
  id: string;
  date: string;
  motif: string;
  status: AppointmentStatus;

  // NEW fields
  vitals?: VitalsData;
  medicalHistoryNotes?: string;
  consultationNotes?: string;
  checkedInAt?: string;
  vitalsEnteredAt?: string;
  consultedAt?: string;
  closedAt?: string;
  vitalsEnteredBy?: string;
  consultedBy?: string;
  closedBy?: string;
  billingAmount?: number;
  billingStatus?: BillingStatus;

  patient: Patient;
  doctor: User;
  createdAt: string;
  updatedAt: string;
}

export interface VitalsData {
  weight: number;
  height: number;
  temperature: number;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  heartRate: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
}

export interface Prescription {
  id: string;
  text: string;
  status: PrescriptionStatus;

  // NEW fields
  sampleCollectedAt?: string;
  analysisStartedAt?: string;
  analysisCompletedAt?: string;
  nurseId?: string;
  nurse?: User;

  patient: Patient;
  doctor: User;
  result?: Result;
  createdAt: string;
  updatedAt: string;
}

export interface Result {
  id: string;
  text: string;
  data?: any;

  // NEW fields
  validatedBy?: string;
  validatedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  interpretation?: string;

  prescription: Prescription;
  createdAt: string;
  updatedAt: string;
}
```

---

## Routing Configuration

**Location**: `src/App.tsx`

```typescript
function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/patients" element={
              <ProtectedRoute>
                <PatientsList />
              </ProtectedRoute>
            } />

            <Route path="/appointments" element={
              <ProtectedRoute>
                <AppointmentsList />
              </ProtectedRoute>
            } />

            <Route path="/prescriptions" element={
              <ProtectedRoute>
                <PrescriptionsList />
              </ProtectedRoute>
            } />

            <Route path="/results" element={
              <ProtectedRoute allowedRoles={['DOCTOR', 'BIOLOGIST', 'ADMIN']}>
                <ResultsList />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
```

---

## Error Handling Pattern

### Global Error Handler

```typescript
// src/utils/errorHandler.ts
import { AxiosError } from 'axios';
import { enqueueSnackbar } from 'notistack';

export const handleApiError = (error: unknown): void => {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message || 'Une erreur est survenue';
    enqueueSnackbar(message, { variant: 'error' });
  } else {
    enqueueSnackbar('Une erreur inattendue est survenue', { variant: 'error' });
  }
};

export const showSuccess = (message: string): void => {
  enqueueSnackbar(message, { variant: 'success' });
};
```

### Usage in Components

```typescript
const handleCheckIn = async (appointmentId: string) => {
  try {
    await appointmentService.checkIn(appointmentId);
    showSuccess('Patient enregistré avec succès');
    fetchDashboardData();
  } catch (error) {
    handleApiError(error);
  }
};
```

---

## Material-UI Theme Configuration

**Location**: `src/App.tsx`

```typescript
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',  // Medical blue
    },
    secondary: {
      main: '#00897b',  // Teal
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#f57c00',
    },
    success: {
      main: '#388e3c',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',  // No uppercase
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});
```

---

## Testing Strategy

### Component Testing (Optional for MVP)

```typescript
// VitalsDialog.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { VitalsDialog } from './VitalsDialog';

describe('VitalsDialog', () => {
  it('validates required fields', () => {
    render(<VitalsDialog open={true} appointment={mockAppointment} onClose={jest.fn()} onSave={jest.fn()} />);

    const saveButton = screen.getByText('Enregistrer');
    fireEvent.click(saveButton);

    expect(screen.getByText(/poids.*requis/i)).toBeInTheDocument();
  });
});
```

### Manual Testing Checklist

- [ ] All dashboards load without errors
- [ ] Role-based routing works correctly
- [ ] Forms validate input correctly
- [ ] Success messages appear after actions
- [ ] Error messages are user-friendly
- [ ] Empty states display when no data
- [ ] Status chips show correct colors
- [ ] Dialogs open and close properly
- [ ] Data refreshes after mutations

---

## Performance Optimization

### Code Splitting

```typescript
// Lazy load dashboard components
const AdminDashboard = lazy(() => import('./pages/Dashboard/AdminDashboard'));
const SecretaryDashboard = lazy(() => import('./pages/Dashboard/SecretaryDashboard'));
const NurseDashboard = lazy(() => import('./pages/Dashboard/NurseDashboard'));
const DoctorDashboard = lazy(() => import('./pages/Dashboard/DoctorDashboard'));
const BiologistDashboard = lazy(() => import('./pages/Dashboard/BiologistDashboard'));

// In Dashboard.tsx
<Suspense fallback={<CircularProgress />}>
  {user.role === 'NURSE' && <NurseDashboard />}
  {user.role === 'DOCTOR' && <DoctorDashboard />}
  {/* ... */}
</Suspense>
```

### Memoization

```typescript
// Memoize expensive computations
const sortedAppointments = useMemo(() =>
  appointments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  [appointments]
);

// Memoize callbacks
const handleCheckIn = useCallback(async (id: string) => {
  // implementation
}, [fetchDashboardData]);
```

---

## Accessibility Considerations

### ARIA Labels

```typescript
<Button
  aria-label="Enregistrer le patient"
  onClick={handleCheckIn}
>
  Check In
</Button>

<TextField
  label="Poids"
  aria-required="true"
  aria-describedby="weight-helper"
/>
```

### Keyboard Navigation

- All interactive elements reachable by Tab
- Dialogs trap focus
- Escape key closes dialogs
- Enter key submits forms

---

## References

- Architecture Design: `/docs/2026_01_04/architecture/architecture.md`
- API Specification: `/docs/2026_01_04/architecture/api-spec.md`
- Dashboard UI Design: `/docs/2026_01_04/specs/dashboard-navigation.md`
- Material-UI Documentation: https://mui.com/
- React Documentation: https://react.dev/

---

**Document Status**: COMPLETE
**Next Steps**: Implement components and integrate with backend
**Author**: System Architecture Specialist
**Last Updated**: 2026-01-04
