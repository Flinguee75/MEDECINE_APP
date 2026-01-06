import api from './api';
import { Patient, CreatePatientData, UpdatePatientData } from '../types/Patient';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

export const patientsService = {
  async getAll(search?: string): Promise<Patient[]> {
    const params = search ? { search } : {};
    const response = await api.get<ApiResponse<Patient[]>>('/patients', { params });
    return response.data.data;
  },

  async getOne(id: string): Promise<Patient> {
    const response = await api.get<ApiResponse<Patient>>(`/patients/${id}`);
    return response.data.data;
  },

  async create(data: CreatePatientData): Promise<Patient> {
    const response = await api.post<ApiResponse<Patient>>('/patients', data);
    return response.data.data;
  },

  async update(id: string, data: UpdatePatientData): Promise<Patient> {
    const response = await api.patch<ApiResponse<Patient>>(`/patients/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/patients/${id}`);
  },
};
