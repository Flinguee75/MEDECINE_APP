import api from './api';
import {
  Appointment,
  CreateAppointmentData,
  UpdateAppointmentData,
  AppointmentStatus,
  Vitals,
  BillingStatus,
} from '../types/Appointment';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

export const appointmentsService = {
  async getAll(
    doctorId?: string,
    patientId?: string,
    status?: AppointmentStatus,
  ): Promise<Appointment[]> {
    const params: any = {};
    if (doctorId) params.doctorId = doctorId;
    if (patientId) params.patientId = patientId;
    if (status) params.status = status;

    const response = await api.get<ApiResponse<Appointment[]>>('/appointments', { params });
    return response.data.data;
  },

  async getOne(id: string): Promise<Appointment> {
    const response = await api.get<ApiResponse<Appointment>>(`/appointments/${id}`);
    return response.data.data;
  },

  async create(data: CreateAppointmentData): Promise<Appointment> {
    const response = await api.post<ApiResponse<Appointment>>('/appointments', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateAppointmentData): Promise<Appointment> {
    const response = await api.patch<ApiResponse<Appointment>>(`/appointments/${id}`, data);
    return response.data.data;
  },

  async cancel(id: string): Promise<void> {
    await api.delete(`/appointments/${id}`);
  },

  async checkIn(id: string): Promise<Appointment> {
    const response = await api.patch<ApiResponse<Appointment>>(`/appointments/${id}/check-in`);
    return response.data.data;
  },

  async enterVitals(
    id: string,
    data: { vitals: Vitals; medicalHistoryNotes?: string },
  ): Promise<Appointment> {
    const response = await api.patch<ApiResponse<Appointment>>(
      `/appointments/${id}/vitals`,
      data,
    );
    return response.data.data;
  },

  async requestVitals(id: string): Promise<Appointment> {
    const response = await api.patch<ApiResponse<Appointment>>(
      `/appointments/${id}/request-vitals`,
    );
    return response.data.data;
  },

  async completeConsultation(
    id: string,
    consultationNotes: string,
  ): Promise<Appointment> {
    const response = await api.patch<ApiResponse<Appointment>>(
      `/appointments/${id}/consultation`,
      { consultationNotes },
    );
    return response.data.data;
  },

  async close(
    id: string,
    billingAmount?: number,
    billingStatus?: BillingStatus,
  ): Promise<Appointment> {
    const response = await api.patch<ApiResponse<Appointment>>(
      `/appointments/${id}/close`,
      { billingAmount, billingStatus },
    );
    return response.data.data;
  },

  // ==================== TRACEABILITY METHODS ====================

  async updateWithAudit(
    id: string,
    data: {
      date?: string;
      motif?: string;
      doctorId?: string;
      reason?: string;
    },
  ): Promise<Appointment> {
    const response = await api.patch<ApiResponse<Appointment>>(
      `/appointments/${id}/update-with-audit`,
      data,
    );
    return response.data.data;
  },

  async autoSaveNotes(id: string, consultationNotes: string): Promise<Appointment> {
    const response = await api.post<ApiResponse<Appointment>>(
      `/appointments/${id}/auto-save-notes`,
      { consultationNotes },
    );
    return response.data.data;
  },

  async getInProgressConsultations(): Promise<Appointment[]> {
    const response = await api.get<ApiResponse<Appointment[]>>(
      '/appointments/in-progress',
    );
    return response.data.data;
  },

  async getPatientHistory(patientId: string): Promise<Appointment[]> {
    const response = await api.get<ApiResponse<Appointment[]>>(
      `/appointments/patient/${patientId}/history`,
    );
    return response.data.data;
  },
};
