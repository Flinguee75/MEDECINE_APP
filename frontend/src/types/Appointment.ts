import { Patient } from './Patient';
import { User } from './User';

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CHECKED_IN = 'CHECKED_IN',
  IN_CONSULTATION = 'IN_CONSULTATION',
  WAITING_RESULTS = 'WAITING_RESULTS',
  CONSULTATION_COMPLETED = 'CONSULTATION_COMPLETED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum BillingStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
}

export interface BloodPressure {
  systolic?: number;
  diastolic?: number;
}

export interface Vitals {
  weight?: number; // Poids (kg)
  height?: number; // Taille (cm)
  bloodPressure?: BloodPressure;
  temperature?: number; // Température (°C)
  heartRate?: number; // Fréquence cardiaque (bpm)
  respiratoryRate?: number; // Fréquence respiratoire (resp/min)
  oxygenSaturation?: number; // Saturation O2 (%)
  painScore?: number; // EVA 0-10
  bloodPressurePosition?: string; // Position (assis/debout/couche)
  bloodPressureArm?: string; // Bras (droit/gauche)
  notes?: string;
}

export interface MedicalHistory {
  allergies?: string[];
  currentMedications?: string[];
  chronicConditions?: string[];
  surgicalHistory?: string[];
  familyHistory?: string;
}

export interface Appointment {
  id: string;
  date: string;
  motif: string;
  status: AppointmentStatus;
  vitals?: Vitals;
  medicalHistory?: MedicalHistory;

  // Workflow tracking
  checkedInAt?: string;
  checkedInBy?: string;
  vitalsTakenAt?: string;
  vitalsTakenBy?: string;
  consultationNotes?: string;
  medicalHistoryNotes?: string;
  consultationCompletedAt?: string;

  // Traceability features
  lastAutoSaveAt?: string;
  isDraftConsultation?: boolean;

  // Billing
  billingStatus?: BillingStatus;
  billingAmount?: number;
  closedAt?: string;
  closedBy?: string;

  patientId: string;
  doctorId: string;
  patient?: Patient;
  doctor?: Pick<User, 'id' | 'name' | 'email'>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentData {
  date: string;
  motif: string;
  patientId: string;
  doctorId: string;
}

export interface UpdateAppointmentData {
  date?: string;
  motif?: string;
  patientId?: string;
  doctorId?: string;
  status?: AppointmentStatus;
  vitals?: Vitals;
}
