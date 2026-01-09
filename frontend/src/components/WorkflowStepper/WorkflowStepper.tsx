import { 
  Stepper, 
  Step, 
  StepLabel, 
  styled,
  Card,
  CardContent,
  Typography,
  Chip,
  StepConnector,
  stepConnectorClasses,
} from '@mui/material';
import { 
  CheckCircle,
  Person,
  EventAvailable,
  Assignment,
  MedicalServices,
  Science,
  Biotech,
  Assessment,
  TaskAlt,
} from '@mui/icons-material';
import { AppointmentStatus } from '../../types/Appointment';
import { PrescriptionStatus } from '../../types/Prescription';

interface WorkflowStep {
  label: string;
  description: string;
  icon: React.ReactNode;
  isOutOfScope: boolean;
}

interface WorkflowStepperProps {
  appointments?: any[];
  prescriptions?: any[];
}

const workflowSteps: WorkflowStep[] = [
  { 
    label: 'Demande RDV', 
    description: 'Demande de rendez-vous',
    icon: <EventAvailable />,
    isOutOfScope: false 
  },
  { 
    label: 'Création patient', 
    description: 'Enregistrement du dossier',
    icon: <Person />,
    isOutOfScope: false 
  },
  { 
    label: 'Planification RDV', 
    description: 'Rendez-vous planifié',
    icon: <Assignment />,
    isOutOfScope: false 
  },
  { 
    label: 'Check-in', 
    description: 'Arrivée du patient',
    icon: <CheckCircle />,
    isOutOfScope: false 
  },
  { 
    label: 'Pré-consultation', 
    description: 'Préparation consultation',
    icon: <Assignment />,
    isOutOfScope: true 
  },
  { 
    label: 'Consultation', 
    description: 'Examen médical',
    icon: <MedicalServices />,
    isOutOfScope: false 
  },
  { 
    label: 'Prescription', 
    description: 'Ordonnance créée',
    icon: <Science />,
    isOutOfScope: false 
  },
  { 
    label: 'Prélèvement', 
    description: 'Échantillon prélevé',
    icon: <Biotech />,
    isOutOfScope: true 
  },
  { 
    label: 'Analyse labo', 
    description: 'Analyse en cours',
    icon: <Science />,
    isOutOfScope: false 
  },
  { 
    label: 'Résultats', 
    description: 'Résultats disponibles',
    icon: <Assessment />,
    isOutOfScope: false 
  },
  { 
    label: 'Clôture', 
    description: 'Parcours terminé',
    icon: <TaskAlt />,
    isOutOfScope: true 
  },
];

// Custom styled connector pour un rendu visuel amélioré
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: `linear-gradient(90deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderRadius: 1,
  },
}));

// Custom Step Icon avec icônes personnalisées
interface ColorlibStepIconProps {
  active: boolean;
  completed: boolean;
  icon: React.ReactNode;
  isOutOfScope: boolean;
}

const ColorlibStepIconRoot = styled('div')<{
  ownerState: { completed?: boolean; active?: boolean; isOutOfScope?: boolean };
}>(({ theme, ownerState }) => ({
  backgroundColor: ownerState.isOutOfScope 
    ? theme.palette.grey[300]
    : ownerState.completed
    ? theme.palette.success.main
    : ownerState.active
    ? theme.palette.primary.main
    : theme.palette.grey[300],
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  opacity: ownerState.isOutOfScope ? 0.3 : 1,
  boxShadow: ownerState.completed || ownerState.active ? '0 4px 10px 0 rgba(0,0,0,.25)' : 'none',
}));

function ColorlibStepIcon(props: ColorlibStepIconProps) {
  const { active, completed, icon, isOutOfScope } = props;

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active, isOutOfScope }}>
      {icon}
    </ColorlibStepIconRoot>
  );
}

// Custom styled components for out-of-scope steps
const OutOfScopeStepLabel = styled(StepLabel)(({ theme }) => ({
  '& .MuiStepLabel-label': {
    opacity: 0.3,
    textDecoration: 'line-through',
    color: theme.palette.text.disabled,
  },
}));

export const WorkflowStepper = ({ appointments = [], prescriptions = [] }: WorkflowStepperProps) => {
  // Calculate current step based on patient data
  const calculateActiveStep = (): number => {
    // Step 0: Demande RDV - Always completed (patient exists)
    // Step 1: Création patient - Always completed (patient record exists)

    // Step 2: Planification RDV - Completed if patient has any appointment
    if (!appointments || appointments.length === 0) {
      return 2;
    }

    // Step 3: Check-in - Completed if any appointment has status >= CHECKED_IN
    const hasCheckedIn = appointments.some((apt) =>
      [
        AppointmentStatus.CHECKED_IN,
        AppointmentStatus.IN_CONSULTATION,
        AppointmentStatus.WAITING_RESULTS,
        AppointmentStatus.CONSULTATION_COMPLETED,
        AppointmentStatus.COMPLETED,
      ].includes(apt.status)
    );
    if (!hasCheckedIn) {
      return 3;
    }

    // Step 4: Pré-consultation - OUT OF SCOPE (always skip)
    // Step 5: Consultation - Completed if any appointment has status >= IN_CONSULTATION
    const hasConsultation = appointments.some((apt) =>
      [
        AppointmentStatus.IN_CONSULTATION,
        AppointmentStatus.WAITING_RESULTS,
        AppointmentStatus.CONSULTATION_COMPLETED,
        AppointmentStatus.COMPLETED,
      ].includes(apt.status)
    );
    if (!hasConsultation) {
      return 5; // Current step is Consultation (index 5)
    }

    // Step 6: Prescription - Completed if patient has any prescription
    if (!prescriptions || prescriptions.length === 0) {
      return 6;
    }

    // Step 7: Prélèvement - OUT OF SCOPE (always skip)
    // Step 8: Analyse labo - Completed if any prescription has status >= IN_PROGRESS
    const hasLabAnalysis = prescriptions.some((presc) =>
      [
        PrescriptionStatus.IN_PROGRESS,
        PrescriptionStatus.RESULTS_AVAILABLE,
        PrescriptionStatus.COMPLETED,
      ].includes(presc.status)
    );
    if (!hasLabAnalysis) {
      return 8; // Current step is Analyse labo (index 8)
    }

    // Step 9: Interprétation résultats - Completed if any prescription has result
    const hasResults = prescriptions.some((presc) => presc.result);
    if (!hasResults) {
      return 9;
    }

    // Step 10: Clôture - OUT OF SCOPE
    // If we have results, patient is at the last implemented step
    return 10;
  };

  // Determine which steps are completed
  const isStepCompleted = (stepIndex: number): boolean => {
    const activeStep = calculateActiveStep();

    // Out-of-scope steps are never completed (they're skipped)
    if (workflowSteps[stepIndex].isOutOfScope) {
      return false;
    }

    // All steps before the active step are completed
    return stepIndex < activeStep;
  };

  const activeStep = calculateActiveStep();

  return (
    <Card elevation={2} sx={{ width: '100%', mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 600 }}>
          Parcours Patient
        </Typography>
        
        <Stepper 
          activeStep={activeStep} 
          alternativeLabel 
          connector={<ColorlibConnector />}
        >
          {workflowSteps.map((step, index) => {
            const isCompleted = isStepCompleted(index);
            const isActive = index === activeStep;
            
            return (
              <Step key={step.label} completed={isCompleted}>
                {step.isOutOfScope ? (
                  <OutOfScopeStepLabel
                    StepIconComponent={() => (
                      <ColorlibStepIcon
                        active={false}
                        completed={false}
                        icon={step.icon}
                        isOutOfScope={true}
                      />
                    )}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {step.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {step.description}
                    </Typography>
                  </OutOfScopeStepLabel>
                ) : (
                  <StepLabel
                    StepIconComponent={() => (
                      <ColorlibStepIcon
                        active={isActive}
                        completed={isCompleted}
                        icon={step.icon}
                        isOutOfScope={false}
                      />
                    )}
                  >
                    <Typography variant="body2" sx={{ fontWeight: isActive ? 600 : 500 }}>
                      {step.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {step.description}
                    </Typography>
                    {isActive && (
                      <Chip 
                        label="En cours" 
                        size="small" 
                        color="primary" 
                        sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                    {isCompleted && !isActive && (
                      <Chip 
                        label="Terminé" 
                        size="small" 
                        color="success" 
                        sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </StepLabel>
                )}
              </Step>
            );
          })}
        </Stepper>
      </CardContent>
    </Card>
  );
};
