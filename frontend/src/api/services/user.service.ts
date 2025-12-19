import apiClient from '../client';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  balance: number;
  account_number: string;
  created_at: string;
}

export const userService = {
  /**
   * Get current authenticated user's profile
   * GET /api/users/me/
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/api/users/me/');
    return response.data;
  },

  /**
   * Update current user's profile
   * PATCH /api/users/me/
   */
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.patch<User>('/api/users/me/', data);
    return response.data;
  },
};

export default userService;
