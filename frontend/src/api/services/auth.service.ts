import apiClient from '../client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
}

export const authService = {
  /**
   * Authenticate user and obtain JWT tokens
   * POST /api/token/
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/token/', credentials);
    return response.data;
  },

  /**
   * Refresh JWT token
   * POST /api/token/refresh/
   */
  refreshToken: async (refreshToken: string): Promise<{ access: string }> => {
    const response = await apiClient.post('/api/token/refresh/', { refresh: refreshToken });
    return response.data;
  },

  /**
   * Logout user (if backend supports token blacklisting)
   * POST /api/token/blacklist/
   */
  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/api/token/blacklist/', { refresh: refreshToken });
  },
};

export default authService;
