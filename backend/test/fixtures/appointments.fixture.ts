import { AppointmentStatus } from '@prisma/client';

export const createAppointmentFixture = (overrides = {}) => ({
  id: 'appointment-test-uuid',
  date: new Date('2026-01-10T14:00:00Z'),
  motif: 'Consultation de suivi',
  status: AppointmentStatus.SCHEDULED,
  patientId: 'patient-test-uuid',
  doctorId: 'doctor-test-uuid',
  vitals: null,
  medicalHistoryNotes: null,
  consultationNotes: null,
  checkedInAt: null,
  vitalsEnteredAt: null,
  consultedAt: null,
  closedAt: null,
  vitalsEnteredBy: null,
  consultedBy: null,
  closedBy: null,
  billingAmount: null,
  billingStatus: null,
  createdAt: new Date('2026-01-02T10:00:00Z'),
  updatedAt: new Date('2026-01-02T10:00:00Z'),
  ...overrides,
});

export const validVitals = {
  weight: 75.5,
  height: 175,
  temperature: 37.2,
  bloodPressure: {
    systolic: 120,
    diastolic: 80,
  },
  heartRate: 72,
  respiratoryRate: 16,
  oxygenSaturation: 98,
};

export const appointmentWorkflowFixtures = {
  scheduled: createAppointmentFixture({
    status: AppointmentStatus.SCHEDULED,
  }),
  checkedIn: createAppointmentFixture({
    status: AppointmentStatus.CHECKED_IN,
    checkedInAt: new Date('2026-01-10T13:45:00Z'),
  }),
  inConsultation: createAppointmentFixture({
    status: AppointmentStatus.IN_CONSULTATION,
    checkedInAt: new Date('2026-01-10T13:45:00Z'),
    vitals: validVitals,
    medicalHistoryNotes: 'Patient reports pollen allergies',
    vitalsEnteredBy: 'nurse-test-uuid',
    vitalsEnteredAt: new Date('2026-01-10T13:50:00Z'),
  }),
  consultationCompleted: createAppointmentFixture({
    status: AppointmentStatus.CONSULTATION_COMPLETED,
    checkedInAt: new Date('2026-01-10T13:45:00Z'),
    vitals: validVitals,
    medicalHistoryNotes: 'Patient reports pollen allergies',
    consultationNotes: 'Patient in good health. Recommend routine blood work.',
    vitalsEnteredBy: 'nurse-test-uuid',
    vitalsEnteredAt: new Date('2026-01-10T13:50:00Z'),
    consultedBy: 'doctor-test-uuid',
    consultedAt: new Date('2026-01-10T14:30:00Z'),
  }),
  completed: createAppointmentFixture({
    status: AppointmentStatus.COMPLETED,
    checkedInAt: new Date('2026-01-10T13:45:00Z'),
    vitals: validVitals,
    consultationNotes: 'Patient in good health. Recommend routine blood work.',
    consultedBy: 'doctor-test-uuid',
    consultedAt: new Date('2026-01-10T14:30:00Z'),
    closedBy: 'secretary-test-uuid',
    closedAt: new Date('2026-01-10T15:00:00Z'),
    billingAmount: 150.0,
    billingStatus: 'PAID',
  }),
};
