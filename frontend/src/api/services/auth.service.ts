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
   * POST /api/users/token/
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/users/token/', credentials);
    return response.data;
  },

  /**
   * Refresh JWT token
   * POST /api/users/token/refresh/
   */
  refreshToken: async (refreshToken: string): Promise<{ access: string }> => {
    const response = await apiClient.post('/api/users/token/refresh/', { refresh: refreshToken });
    return response.data;
  },

  /**
   * Register new user
   * POST /api/users/users/
   */
  register: async (data: {
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
  }): Promise<{ id: number; email: string }> => {
    const response = await apiClient.post('/api/users/users/', data);
    return response.data;
  },

  /**
   * Logout user (clears local storage)
   */
  logout: async (refreshToken): Promise<void> => {
    // Backend doesn't have token blacklisting, just clear local storage
    localStorage.removeItem('auditflow_token');
    localStorage.removeItem('auditflow_refresh_token');
  },
};

export default authService;
