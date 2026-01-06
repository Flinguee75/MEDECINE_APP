import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login/Login';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { PatientsList } from './pages/Patients/PatientsList';
import { AppointmentsList } from './pages/Appointments/AppointmentsList';
import { AppointmentVitalsPage } from './pages/Appointments/AppointmentVitalsPage';
import { AppointmentConsultationPage } from './pages/Appointments/AppointmentConsultationPage';
import { DoctorInProgressConsultations } from './pages/DoctorInProgressConsultations/DoctorInProgressConsultations';
import { PrescriptionsList } from './pages/Prescriptions/PrescriptionsList';
import { PrescriptionReviewPage } from './pages/Prescriptions/PrescriptionReviewPage';
import { PrescriptionResultsPage } from './pages/Prescriptions/PrescriptionResultsPage';
import { ResultsList } from './pages/Results/ResultsList';
import { PatientMedicalRecord } from './pages/Patients/PatientMedicalRecord';

// Thème Material-UI personnalisé
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976D2', // Bleu médical
    },
    secondary: {
      main: '#424242', // Gris foncé
    },
  },
});

// Composant pour protéger les routes
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Composant pour rediriger si déjà connecté
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <PatientsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <AppointmentsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments/:id/vitals"
        element={
          <ProtectedRoute>
            <AppointmentVitalsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments/:id/consult"
        element={
          <ProtectedRoute>
            <AppointmentConsultationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/consultations/in-progress"
        element={
          <ProtectedRoute>
            <DoctorInProgressConsultations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prescriptions"
        element={
          <ProtectedRoute>
            <PrescriptionsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prescriptions/:id/review"
        element={
          <ProtectedRoute>
            <PrescriptionReviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prescriptions/:id/results"
        element={
          <ProtectedRoute>
            <PrescriptionResultsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/results"
        element={
          <ProtectedRoute>
            <ResultsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients/:id/medical-record"
        element={
          <ProtectedRoute>
            <PatientMedicalRecord />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
