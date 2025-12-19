import apiClient from '../client';

export interface AuditEntry {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  counterparty: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
}

export interface AuditHistoryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditEntry[];
}

export interface AuditFilters {
  type?: 'sent' | 'received';
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export const auditService = {
  /**
   * Get audit history with optional filters
   * GET /api/audit/history/
   */
  getHistory: async (filters?: AuditFilters): Promise<AuditHistoryResponse> => {
    const response = await apiClient.get<AuditHistoryResponse>('/api/audit/history/', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get single audit entry details
   * GET /api/audit/history/:id/
   */
  getEntry: async (id: string): Promise<AuditEntry> => {
    const response = await apiClient.get<AuditEntry>(`/api/audit/history/${id}/`);
    return response.data;
  },

  /**
   * Export audit history as CSV/PDF
   * GET /api/audit/export/
   */
  exportHistory: async (format: 'csv' | 'pdf', filters?: AuditFilters): Promise<Blob> => {
    const response = await apiClient.get('/api/audit/export/', {
      params: { format, ...filters },
      responseType: 'blob',
    });
    return response.data;
  },
};

export default auditService;
