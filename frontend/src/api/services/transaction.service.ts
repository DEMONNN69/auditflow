import apiClient from '../client';

export interface TransferData {
  to_account: number;
  amount: number;
  description?: string;
}

export interface Transaction {
  id: number;
  from_account: number | null;
  from_account_number: string | null;
  to_account: number;
  to_account_number: string;
  amount: string;
  transaction_type: 'transfer' | 'deposit' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed';
  description: string;
  reference_id: string;
  created_at: string;
}

export interface TransferResponse extends Transaction {}

export interface TransactionListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Transaction[];
}

export const transactionService = {
  /**
   * Initiate a money transfer
   * POST /api/transactions/transactions/
   */
  initiateTransfer: async (data: TransferData): Promise<TransferResponse> => {
    const response = await apiClient.post<TransferResponse>('/api/transactions/transactions/', data);
    return response.data;
  },

  /**
   * Get transaction by ID
   * GET /api/transactions/transactions/:id/
   */
  getTransaction: async (id: number): Promise<Transaction> => {
    const response = await apiClient.get<Transaction>(`/api/transactions/transactions/${id}/`);
    return response.data;
  },

  /**
   * Get all transactions for current user with pagination
   * GET /api/transactions/transactions/
   */
  getTransactions: async (params?: { page?: number; page_size?: number }): Promise<TransactionListResponse> => {
    const response = await apiClient.get<TransactionListResponse>('/api/transactions/transactions/', { params });
    return response.data;
  },
};

export default transactionService;
