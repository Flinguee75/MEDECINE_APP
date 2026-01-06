import { Stepper, Step, StepLabel, Box, styled } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { AppointmentStatus } from '../../types/Appointment';
import { PrescriptionStatus } from '../../types/Prescription';

interface WorkflowStep {
  label: string;
  isOutOfScope: boolean;
}

interface WorkflowStepperProps {
  appointments?: any[];
  prescriptions?: any[];
}

const workflowSteps: WorkflowStep[] = [
  { label: 'Demande RDV', isOutOfScope: false },
  { label: 'Création patient', isOutOfScope: false },
  { label: 'Planification RDV', isOutOfScope: false },
  { label: 'Check-in', isOutOfScope: false },
  { label: 'Pré-consultation', isOutOfScope: true }, // Step 5 - OUT OF SCOPE
  { label: 'Consultation', isOutOfScope: false },
  { label: 'Prescription', isOutOfScope: false },
  { label: 'Prélèvement', isOutOfScope: true }, // Step 8 - OUT OF SCOPE
  { label: 'Analyse labo', isOutOfScope: false },
  { label: 'Interprétation résultats', isOutOfScope: false },
  { label: 'Clôture', isOutOfScope: true }, // Step 11 - OUT OF SCOPE
];

// Custom styled components for out-of-scope steps
const OutOfScopeStepLabel = styled(StepLabel)(({ theme }) => ({
  '& .MuiStepLabel-label': {
    opacity: 0.3,
    textDecoration: 'line-through',
    color: theme.palette.text.disabled,
  },
  '& .MuiStepIcon-root': {
    opacity: 0.3,
    color: theme.palette.action.disabled,
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
    <Box sx={{ width: '100%', mb: 4 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {workflowSteps.map((step, index) => (
          <Step key={step.label} completed={isStepCompleted(index)}>
            {step.isOutOfScope ? (
              <OutOfScopeStepLabel>{step.label}</OutOfScopeStepLabel>
            ) : (
              <StepLabel
                StepIconComponent={
                  isStepCompleted(index)
                    ? () => <CheckCircle color="primary" />
                    : undefined
                }
              >
                {step.label}
              </StepLabel>
            )}
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};
