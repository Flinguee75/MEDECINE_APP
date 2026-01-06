import { PrescriptionStatus } from '@prisma/client';

export const createPrescriptionFixture = (overrides = {}) => ({
  id: 'prescription-test-uuid',
  text: 'Complete Blood Count (CBC)',
  status: PrescriptionStatus.CREATED,
  patientId: 'patient-test-uuid',
  doctorId: 'doctor-test-uuid',
  nurseId: null,
  sampleCollectedAt: null,
  analysisStartedAt: null,
  analysisCompletedAt: null,
  createdAt: new Date('2026-01-10T14:35:00Z'),
  updatedAt: new Date('2026-01-10T14:35:00Z'),
  ...overrides,
});

export const prescriptionWorkflowFixtures = {
  created: createPrescriptionFixture({
    status: PrescriptionStatus.CREATED,
  }),
  sentToLab: createPrescriptionFixture({
    status: PrescriptionStatus.SENT_TO_LAB,
  }),
  sampleCollected: createPrescriptionFixture({
    status: PrescriptionStatus.SAMPLE_COLLECTED,
    nurseId: 'nurse-test-uuid',
    sampleCollectedAt: new Date('2026-01-10T15:30:00Z'),
  }),
  inProgress: createPrescriptionFixture({
    status: PrescriptionStatus.IN_PROGRESS,
    nurseId: 'nurse-test-uuid',
    sampleCollectedAt: new Date('2026-01-10T15:30:00Z'),
    analysisStartedAt: new Date('2026-01-10T16:00:00Z'),
  }),
  resultsAvailable: createPrescriptionFixture({
    status: PrescriptionStatus.RESULTS_AVAILABLE,
    nurseId: 'nurse-test-uuid',
    sampleCollectedAt: new Date('2026-01-10T15:30:00Z'),
    analysisStartedAt: new Date('2026-01-10T16:00:00Z'),
  }),
  completed: createPrescriptionFixture({
    status: PrescriptionStatus.COMPLETED,
    nurseId: 'nurse-test-uuid',
    sampleCollectedAt: new Date('2026-01-10T15:30:00Z'),
    analysisStartedAt: new Date('2026-01-10T16:00:00Z'),
    analysisCompletedAt: new Date('2026-01-10T17:00:00Z'),
  }),
};
