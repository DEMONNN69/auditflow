import apiClient from '../client';

export interface AuditEntry {
  id: number;
  event_type: 'transaction_created' | 'transaction_completed' | 'transaction_failed' | 'balance_updated' | 'user_login' | 'user_logout' | 'account_created';
  user: number | null;
  user_email: string | null;
  transaction: number | null;
  transaction_reference: string | null;
  description: string;
  data: Record<string, any>;
  ip_address: string | null;
  created_at: string;
  is_immutable: boolean;
}

export interface AuditHistoryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditEntry[];
}

export interface AuditFilters {
  event_type?: string;
  user_id?: number;
  page?: number;
  page_size?: number;
}

export const auditService = {
  /**
   * Get audit history with optional filters (Admin only)
   * GET /api/audit/logs/
   */
  getHistory: async (filters?: AuditFilters): Promise<AuditHistoryResponse> => {
    const response = await apiClient.get<AuditHistoryResponse>('/api/audit/logs/', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get current user's audit logs
   * GET /api/audit/logs/my_logs/
   */
  getMyLogs: async (): Promise<AuditEntry[]> => {
    const response = await apiClient.get<AuditEntry[]>('/api/audit/logs/my_logs/');
    return response.data;
  },

  /**
   * Get single audit entry details
   * GET /api/audit/logs/:id/
   */
  getEntry: async (id: number): Promise<AuditEntry> => {
    const response = await apiClient.get<AuditEntry>(`/api/audit/logs/${id}/`);
    return response.data;
  },
};

export default auditService;
