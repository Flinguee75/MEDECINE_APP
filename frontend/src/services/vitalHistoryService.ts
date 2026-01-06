import api from './api';
import { Vitals } from '../types/Appointment';

export interface VitalHistory {
  id: string;
  appointmentId: string;
  patientId: string;
  vitals: Vitals;
  medicalHistoryNotes?: string;
  enteredBy: string;
  enteredAt: string;
  actionType: string;
  isDraft: boolean;
  finalizedAt?: string;
  appointment?: {
    id: string;
    date: string;
    motif: string;
    status: string;
  };
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

export const vitalHistoryService = {
  async autoSave(data: {
    appointmentId: string;
    patientId: string;
    vitals: Vitals;
    medicalHistoryNotes?: string;
  }): Promise<VitalHistory> {
    const response = await api.post<ApiResponse<VitalHistory>>(
      '/vital-history/auto-save',
      data,
    );
    return response.data.data;
  },

  async finalize(id: string): Promise<VitalHistory> {
    const response = await api.post<ApiResponse<VitalHistory>>(
      `/vital-history/${id}/finalize`,
      {},
    );
    return response.data.data;
  },

  async getPatientHistory(patientId: string): Promise<VitalHistory[]> {
    const response = await api.get<ApiResponse<VitalHistory[]>>(
      `/vital-history/patient/${patientId}`,
    );
    return response.data.data;
  },

  async getAppointmentHistory(appointmentId: string): Promise<VitalHistory[]> {
    const response = await api.get<ApiResponse<VitalHistory[]>>(
      `/vital-history/appointment/${appointmentId}`,
    );
    return response.data.data;
  },

  async getDraft(appointmentId: string): Promise<VitalHistory | null> {
    const response = await api.get<ApiResponse<VitalHistory | null>>(
      `/vital-history/draft/${appointmentId}`,
    );
    return response.data.data;
  },
};
