import api from './api';
import { User } from '../types/User';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  data: {
    user: User;
  };
  message: string;
}

export interface MeResponse {
  data: User | null;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data.data.user;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async me(): Promise<User | null> {
    try {
      const response = await api.get<MeResponse>('/auth/me');
      return response.data.data;
    } catch (error) {
      return null;
    }
  },
};
