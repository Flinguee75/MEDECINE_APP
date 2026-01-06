import api from './api';
import { Document, CreateDocumentDto, UpdateDocumentDto } from '../types/Document';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

export const documentsService = {
  async getAll(filters?: { patientId?: string }): Promise<Document[]> {
    const params = new URLSearchParams();
    if (filters?.patientId) params.append('patientId', filters.patientId);

    const response = await api.get<ApiResponse<Document[]>>(`/documents?${params.toString()}`);
    return response.data.data;
  },

  async getOne(id: string): Promise<Document> {
    const response = await api.get<ApiResponse<Document>>(`/documents/${id}`);
    return response.data.data;
  },

  async create(data: CreateDocumentDto): Promise<Document> {
    const response = await api.post<ApiResponse<Document>>('/documents', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateDocumentDto): Promise<Document> {
    const response = await api.patch<ApiResponse<Document>>(`/documents/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },
};
