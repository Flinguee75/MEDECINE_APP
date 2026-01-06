import api from './api';
import { User, Role } from '../types/User';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
}

export const usersService = {
  async getAll(role?: Role, search?: string): Promise<User[]> {
    const params: any = {};
    if (role) params.role = role;
    if (search) params.search = search;

    const response = await api.get<ApiResponse<User[]>>('/auth/users', { params });
    return response.data.data;
  },

  async getDoctors(): Promise<User[]> {
    return this.getAll(Role.DOCTOR);
  },

  async create(data: CreateUserData): Promise<User> {
    const response = await api.post<ApiResponse<User>>('/auth/users', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateUserData): Promise<User> {
    const response = await api.patch<ApiResponse<User>>(`/auth/users/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/auth/users/${id}`);
  },
};
