import apiClient from '../client';

export interface User {
  id: number;
  email: string;
  recipient_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  balance: number;
  is_verified: boolean;
  created_at: string;
}

export interface RecipientInfo {
  recipient_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
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
   * Get recipient info by recipient_id
   * GET /api/users/users/recipient/:recipient_id/
   */
  getRecipientInfo: async (recipientId: string): Promise<RecipientInfo> => {
    const response = await apiClient.get<RecipientInfo>(`/api/users/users/recipient/${recipientId}/`);
    return response.data;
  },
};

export default userService;
