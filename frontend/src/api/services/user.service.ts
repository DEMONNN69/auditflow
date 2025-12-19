import apiClient from '../client';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_verified: boolean;
  created_at: string;
}

export interface Account {
  id: number;
  account_number: string;
  account_type: 'checking' | 'savings';
  balance: string;
  is_active: boolean;
  created_at: string;
}

export const userService = {
  /**
   * Get current authenticated user's profile
   * GET /api/users/users/me/
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/api/users/users/me/');
    return response.data;
  },

  /**
   * Update current user's profile
   * PATCH /api/users/users/me/
   */
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.patch<User>('/api/users/users/me/', data);
    return response.data;
  },

  /**
   * Get user's account information
   * GET /api/transactions/accounts/
   */
  getAccount: async (): Promise<Account> => {
    const response = await apiClient.get<{ results: Account[] }>('/api/transactions/accounts/');
    return response.data.results[0];
  },
};

export default userService;
