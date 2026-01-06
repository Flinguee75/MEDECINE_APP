import api from './api';

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  performedAt: string;
  changes: Record<string, { old: any; new: any }>;
  reason?: string;
  performer?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

export const auditService = {
  async getEntityAuditLogs(
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    const response = await api.get<ApiResponse<AuditLog[]>>(
      `/audit/entity/${entityType}/${entityId}`,
    );
    return response.data.data;
  },

  async getUserAuditLogs(
    userId: string,
    skip?: number,
    take?: number,
  ): Promise<AuditLog[]> {
    const params: any = {};
    if (skip !== undefined) params.skip = skip;
    if (take !== undefined) params.take = take;

    const response = await api.get<ApiResponse<AuditLog[]>>(
      `/audit/user/${userId}`,
      { params },
    );
    return response.data.data;
  },

  async getAllAuditLogs(params?: {
    entityType?: string;
    entityId?: string;
    performedBy?: string;
    skip?: number;
    take?: number;
  }): Promise<AuditLog[]> {
    const response = await api.get<ApiResponse<AuditLog[]>>('/audit', { params });
    return response.data.data;
  },
};
