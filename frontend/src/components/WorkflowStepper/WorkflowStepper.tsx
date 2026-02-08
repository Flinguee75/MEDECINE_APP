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
  isOptional?: boolean;
}

interface WorkflowStepperProps {
  appointments?: any[];
  prescriptions?: any[];
}

interface WorkflowComputationResult {
  activeStep: number;
  displayedActiveStep: number;
  hasSampleCollected: boolean;
  hasAnalysisInProgress: boolean;
  hasAnalysisCompleted: boolean;
  hasClosure: boolean;
}

export const computeWorkflowState = (
  activeAppointment: any,
  activePrescriptions: any[],
): WorkflowComputationResult => {
  const hasLabOrder = activePrescriptions.some((presc) =>
    [
      PrescriptionStatus.SENT_TO_LAB,
      PrescriptionStatus.SAMPLE_COLLECTED,
      PrescriptionStatus.IN_PROGRESS,
      PrescriptionStatus.RESULTS_AVAILABLE,
      PrescriptionStatus.COMPLETED,
    ].includes(presc.status),
  );
  const hasSampleCollected = activePrescriptions.some((presc) =>
    [
      PrescriptionStatus.SAMPLE_COLLECTED,
      PrescriptionStatus.IN_PROGRESS,
      PrescriptionStatus.RESULTS_AVAILABLE,
      PrescriptionStatus.COMPLETED,
    ].includes(presc.status),
  );
  const hasAnalysisInProgress = activePrescriptions.some(
    (presc) => presc.status === PrescriptionStatus.IN_PROGRESS,
  );
  const hasAnalysisCompleted = activePrescriptions.some((presc) =>
    [PrescriptionStatus.RESULTS_AVAILABLE, PrescriptionStatus.COMPLETED].includes(
      presc.status,
    ),
  );
  const hasClosure = activeAppointment?.status === AppointmentStatus.COMPLETED;

  if (!activeAppointment) {
    return {
      activeStep: 2,
      displayedActiveStep: 2,
      hasSampleCollected,
      hasAnalysisInProgress,
      hasAnalysisCompleted,
      hasClosure: Boolean(hasClosure),
    };
  }

  const isAtOrBeyondConsultation = [
    AppointmentStatus.IN_CONSULTATION,
    AppointmentStatus.WAITING_RESULTS,
    AppointmentStatus.CONSULTATION_COMPLETED,
    AppointmentStatus.COMPLETED,
  ].includes(activeAppointment.status);

  const hasCheckedIn = [
    AppointmentStatus.CHECKED_IN,
    AppointmentStatus.IN_CONSULTATION,
    AppointmentStatus.WAITING_RESULTS,
    AppointmentStatus.CONSULTATION_COMPLETED,
    AppointmentStatus.COMPLETED,
  ].includes(activeAppointment.status);

  let activeStep = 10;
  if (!hasCheckedIn) {
    activeStep = 3;
  } else {
    const hasVitals = Boolean(
      activeAppointment.vitals ||
        activeAppointment.vitalsEnteredAt ||
        activeAppointment.vitalsTakenAt ||
        isAtOrBeyondConsultation,
    );
    if (!hasVitals) {
      activeStep = 4;
    } else {
      const hasConsultation = [
        AppointmentStatus.IN_CONSULTATION,
        AppointmentStatus.WAITING_RESULTS,
        AppointmentStatus.CONSULTATION_COMPLETED,
        AppointmentStatus.COMPLETED,
      ].includes(activeAppointment.status);

      if (!hasConsultation) {
        activeStep = 5;
      } else if (!activePrescriptions || activePrescriptions.length === 0) {
        activeStep = 6;
      } else {
        const hasLabAnalysis = activePrescriptions.some((presc) =>
          [
            PrescriptionStatus.IN_PROGRESS,
            PrescriptionStatus.RESULTS_AVAILABLE,
            PrescriptionStatus.COMPLETED,
          ].includes(presc.status),
        );
        if (!hasLabAnalysis) {
          activeStep = 8;
        } else {
          const hasResults = activePrescriptions.some(
            (presc) =>
              presc.result ||
              presc.status === PrescriptionStatus.RESULTS_AVAILABLE ||
              presc.status === PrescriptionStatus.COMPLETED,
          );
          activeStep = hasResults ? 10 : 9;
        }
      }
    }
  }

  const optionalActiveStep = hasAnalysisInProgress
    ? 8
    : hasLabOrder && !hasSampleCollected
    ? 7
    : null;
  const displayedActiveStep =
    optionalActiveStep !== null && optionalActiveStep > activeStep
      ? optionalActiveStep
      : activeStep;

  return {
    activeStep,
    displayedActiveStep,
    hasSampleCollected,
    hasAnalysisInProgress,
    hasAnalysisCompleted,
    hasClosure: Boolean(hasClosure),
  };
};

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
    label: 'Enregistrement', 
    description: 'Arrivée du patient',
    icon: <CheckCircle />,
    isOutOfScope: false 
  },
  { 
    label: 'Pré-consultation', 
    description: 'Préparation consultation',
    icon: <Assignment />,
    isOutOfScope: false 
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
    isOutOfScope: false,
    isOptional: true
  },
  { 
    label: 'Analyse / Cardio', 
    description: 'Analyse ou consultation specialisee',
    icon: <Science />,
    isOutOfScope: false,
    isOptional: true
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
    isOutOfScope: false,
    isOptional: true
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
  const sortedAppointments = [...appointments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const activeAppointment =
    sortedAppointments.find(
      (apt) =>
        apt.status !== AppointmentStatus.COMPLETED &&
        apt.status !== AppointmentStatus.CANCELLED,
    ) ?? sortedAppointments[0];
  const activePrescriptions = activeAppointment
    ? prescriptions.filter((presc) => presc.appointmentId === activeAppointment.id)
    : [];
  const hasOptionalRequest = activePrescriptions.length > 0;
  // Determine which steps are completed
  const isStepCompleted = (stepIndex: number): boolean => {
    const { activeStep, hasSampleCollected, hasAnalysisCompleted, hasClosure } =
      computeWorkflowState(activeAppointment, activePrescriptions);

    // Out-of-scope steps are never completed (they're skipped)
    if (workflowSteps[stepIndex].isOutOfScope) {
      return false;
    }

    if (workflowSteps[stepIndex].isOptional) {
      if (stepIndex === 7) return hasSampleCollected;
      if (stepIndex === 8) return hasAnalysisCompleted;
      if (stepIndex === 10) return Boolean(hasClosure);
    }

    // All steps before the active step are completed
    return stepIndex < activeStep;
  };

  const { displayedActiveStep } = computeWorkflowState(
    activeAppointment,
    activePrescriptions,
  );
  const visibleSteps = workflowSteps
    .map((step, originalIndex) => ({ step, originalIndex }))
    .filter(
      ({ step }) => !(step.isOptional && !hasOptionalRequest),
    );
  let displayedActiveStepIndex = visibleSteps.findIndex(
    ({ originalIndex }) => originalIndex === displayedActiveStep,
  );
  if (displayedActiveStepIndex < 0) {
    displayedActiveStepIndex = visibleSteps.findIndex(
      ({ originalIndex }) => originalIndex > displayedActiveStep,
    );
    if (displayedActiveStepIndex < 0) {
      displayedActiveStepIndex = visibleSteps.length - 1;
    }
  }

  return (
    <Card elevation={2} sx={{ width: '100%', mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 600 }}>
          Parcours Patient
        </Typography>
        
        <Stepper 
          activeStep={displayedActiveStepIndex} 
          alternativeLabel 
          connector={<ColorlibConnector />}
        >
          {visibleSteps.map(({ step, originalIndex }, index) => {
            const isCompleted = isStepCompleted(originalIndex);
            const isActive = index === displayedActiveStepIndex;
            
            return (
              <Step key={`${step.label}-${originalIndex}`} completed={isCompleted} active={isActive}>
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
