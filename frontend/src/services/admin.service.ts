import api from './api';
import { AdminDashboardStats, AuditLogItem, User } from '@/types';

export interface UsersPaginated {
  items: User[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface AuditLogsPaginated {
  items: AuditLogItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export const adminService = {
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const res = await api.get<AdminDashboardStats>('/admin/dashboard');
    return res.data;
  },

  async getUsers(page = 1, size = 20, search = ''): Promise<UsersPaginated> {
    const res = await api.get<UsersPaginated>(`/admin/users?page=${page}&size=${size}&search=${encodeURIComponent(search)}`);
    return res.data;
  },

  async updateUserRole(userId: string, role: string): Promise<{ message: string }> {
    const res = await api.put<{ message: string }>(`/admin/users/${userId}/role?role=${role}`);
    return res.data;
  },

  async updateUserStatus(userId: string, is_active: boolean): Promise<{ message: string }> {
    const res = await api.put<{ message: string }>(`/admin/users/${userId}/status?is_active=${is_active}`);
    return res.data;
  },

  async getAuditLogs(page = 1, size = 50): Promise<AuditLogsPaginated> {
    const res = await api.get<AuditLogsPaginated>(`/admin/audit-logs?page=${page}&size=${size}`);
    return res.data;
  },
};

