import api from './api';
import { Result, CreateResultDto, UpdateResultDto, ReviewResultDto } from '../types/Result';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

export const resultsService = {
  async getAll(filters?: { prescriptionId?: string }): Promise<Result[]> {
    const params = new URLSearchParams();
    if (filters?.prescriptionId) params.append('prescriptionId', filters.prescriptionId);

    const response = await api.get<ApiResponse<Result[]>>(`/results?${params.toString()}`);
    return response.data.data;
  },

  async getOne(id: string): Promise<Result> {
    const response = await api.get<ApiResponse<Result>>(`/results/${id}`);
    return response.data.data;
  },

  async create(data: CreateResultDto): Promise<Result> {
    const response = await api.post<ApiResponse<Result>>('/results', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateResultDto): Promise<Result> {
    const response = await api.patch<ApiResponse<Result>>(`/results/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/results/${id}`);
  },

  async review(id: string, data: ReviewResultDto): Promise<Result> {
    const response = await api.patch<ApiResponse<Result>>(`/results/${id}/review`, data);
    return response.data.data;
  },
};
