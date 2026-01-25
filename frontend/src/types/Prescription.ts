import { Patient } from './Patient';
import type { BiologicalData } from './Result';
import { AppointmentStatus } from './Appointment';

export enum PrescriptionStatus {
  CREATED = 'CREATED',
  SENT_TO_LAB = 'SENT_TO_LAB',
  SAMPLE_COLLECTED = 'SAMPLE_COLLECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESULTS_AVAILABLE = 'RESULTS_AVAILABLE',
  COMPLETED = 'COMPLETED',
}

export interface Prescription {
  id: string;
  text: string;
  status: PrescriptionStatus;
  category?: string; // "BIOLOGIE" ou "IMAGERIE"

  // Workflow tracking
  sentToLabAt?: string;
  sentToLabBy?: string;
  sampleCollectedAt?: string;
  sampleCollectedBy?: string;
  analysisStartedAt?: string;
  analysisStartedBy?: string;
  analysisCompletedAt?: string;

  patientId: string;
  appointmentId?: string;
  appointment?: {
    id: string;
    status: AppointmentStatus;
  };
  doctorId: string;
  nurseId?: string;
  patient?: Patient;
  doctor?: {
    id: string;
    name: string;
    email: string;
  };
  nurse?: {
    id: string;
    name: string;
    email: string;
  };
  result?: {
    id: string;
    text: string;
    data?: BiologicalData;
    interpretation?: string;
    reviewedBy?: string;
    reviewedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrescriptionDto {
  text: string;
  category?: string; // "BIOLOGIE" ou "IMAGERIE"
  patientId: string;
  appointmentId?: string;
}

export interface UpdatePrescriptionDto {
  status?: PrescriptionStatus;
}
