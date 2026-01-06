import api from './api';
import { User, Role } from '../types/User';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

export const usersService = {
  async getAll(role?: Role): Promise<User[]> {
    const params: any = {};
    if (role) params.role = role;

    const response = await api.get<ApiResponse<User[]>>('/auth/users', { params });
    return response.data.data;
  },

  async getDoctors(): Promise<User[]> {
    return this.getAll(Role.DOCTOR);
  },
};
