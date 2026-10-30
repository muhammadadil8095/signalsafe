import api from './api';
import { AuthResponse, LoginPayload, RegisterPayload, User } from '@/types';

export const authService = {
  async register(data: RegisterPayload): Promise<User> {
    const res = await api.post<User>('/auth/register', data);
    return res.data;
  },

  async login(credentials: LoginPayload): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/login', credentials);
    if (res.data.access_token) {
      localStorage.setItem('signalsafe_token', res.data.access_token);
      localStorage.setItem('signalsafe_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },

  logout(): void {
    localStorage.removeItem('signalsafe_token');
    localStorage.removeItem('signalsafe_user');
  },

  getCurrentUser(): User | null {
    const data = localStorage.getItem('signalsafe_user');
    return data ? JSON.parse(data) : null;
  },

  getToken(): string | null {
    return localStorage.getItem('signalsafe_token');
  },
};

