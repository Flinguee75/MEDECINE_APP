import { describe, expect, it } from 'vitest';
import { computeWorkflowState } from './WorkflowStepper';
import { AppointmentStatus } from '../../types/Appointment';
import { PrescriptionStatus } from '../../types/Prescription';

describe('WorkflowStepper logic', () => {
  it('does not regress to pre-consultation when consultation is already completed', () => {
    const state = computeWorkflowState(
      {
        id: 'apt-1',
        status: AppointmentStatus.CONSULTATION_COMPLETED,
      },
      [],
    );

    expect(state.activeStep).toBeGreaterThanOrEqual(6);
  });

  it('keeps a single active step aligned with lab workflow progression', () => {
    const state = computeWorkflowState(
      {
        id: 'apt-1',
        status: AppointmentStatus.CHECKED_IN,
      },
      [
        {
          id: 'pres-1',
          appointmentId: 'apt-1',
          status: PrescriptionStatus.SENT_TO_LAB,
        },
      ],
    );

    // If lab flow started, optional lab step should become the displayed current step.
    expect(state.displayedActiveStep).toBe(7);
    // But logical core progression should remain explicit and deterministic.
    expect(state.activeStep).toBe(4);
  });
});
