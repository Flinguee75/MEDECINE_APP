import api from './api';
import { Prescription, CreatePrescriptionDto, UpdatePrescriptionDto, PrescriptionStatus } from '../types/Prescription';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

export const prescriptionsService = {
  async getAll(filters?: { patientId?: string; doctorId?: string; status?: PrescriptionStatus; appointmentId?: string }): Promise<Prescription[]> {
    const params = new URLSearchParams();
    if (filters?.patientId) params.append('patientId', filters.patientId);
    if (filters?.doctorId) params.append('doctorId', filters.doctorId);
    if (filters?.appointmentId) params.append('appointmentId', filters.appointmentId);
    if (filters?.status) params.append('status', filters.status);

    const response = await api.get<ApiResponse<Prescription[]>>(`/prescriptions?${params.toString()}`);
    return response.data.data;
  },

  async getOne(id: string): Promise<Prescription> {
    const response = await api.get<ApiResponse<Prescription>>(`/prescriptions/${id}`);
    return response.data.data;
  },

  async create(data: CreatePrescriptionDto): Promise<Prescription> {
    const response = await api.post<ApiResponse<Prescription>>('/prescriptions', data);
    return response.data.data;
  },

  async update(id: string, data: UpdatePrescriptionDto): Promise<Prescription> {
    const response = await api.patch<ApiResponse<Prescription>>(`/prescriptions/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/prescriptions/${id}`);
  },

  async sendToLab(id: string, notes?: string): Promise<Prescription> {
    const response = await api.patch<ApiResponse<Prescription>>(
      `/prescriptions/${id}/send-to-lab`,
      { notes },
    );
    return response.data.data;
  },

  async collectSample(id: string, notes?: string): Promise<Prescription> {
    const response = await api.patch<ApiResponse<Prescription>>(
      `/prescriptions/${id}/collect-sample`,
      { notes },
    );
    return response.data.data;
  },

  async startAnalysis(id: string, notes?: string): Promise<Prescription> {
    const response = await api.patch<ApiResponse<Prescription>>(
      `/prescriptions/${id}/start-analysis`,
      { notes },
    );
    return response.data.data;
  },
};
