import apiClient from '../client';

export interface TransferData {
  recipient_account: string;
  amount: number;
  description?: string;
}

export interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  counterparty: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface TransferResponse {
  id: string;
  status: string;
  message: string;
  transaction: Transaction;
}

export const transactionService = {
  /**
   * Initiate a money transfer
   * POST /api/transactions/transfer/
   */
  initiateTransfer: async (data: TransferData): Promise<TransferResponse> => {
    const response = await apiClient.post<TransferResponse>('/api/transactions/transfer/', data);
    return response.data;
  },

  /**
   * Get transaction by ID
   * GET /api/transactions/:id/
   */
  getTransaction: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get<Transaction>(`/api/transactions/${id}/`);
    return response.data;
  },

  /**
   * Get all transactions for current user
   * GET /api/transactions/
   */
  getTransactions: async (): Promise<Transaction[]> => {
    const response = await apiClient.get<Transaction[]>('/api/transactions/');
    return response.data;
  },
};

export default transactionService;
