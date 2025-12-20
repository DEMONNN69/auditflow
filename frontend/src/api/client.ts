import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('auditflow_refresh_token');
  if (!refreshToken) return null;

  const response = await refreshClient.post<{ access: string }>(
    '/api/users/token/refresh/',
    { refresh: refreshToken }
  );

  const newAccess = response.data?.access;
  if (newAccess) {
    localStorage.setItem('auditflow_token', newAccess);
    apiClient.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
    return newAccess;
  }

  return null;
};

// Request interceptor to add JWT token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auditflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    const isAuthEndpoint = originalRequest?.url?.includes('/token');

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      try {
        refreshPromise = refreshPromise ?? refreshAccessToken().finally(() => {
          refreshPromise = null;
        });

        const newAccess = await refreshPromise;

        if (newAccess) {
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${newAccess}`,
          };

          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // fall through to logout
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('auditflow_token');
      localStorage.removeItem('auditflow_refresh_token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default apiClient;
