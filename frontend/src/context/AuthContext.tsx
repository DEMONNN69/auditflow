import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService, userService, LoginCredentials, User } from '@/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => 
    localStorage.getItem('auditflow_token')
  );
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  const fetchUser = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await userService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('auditflow_token');
      localStorage.removeItem('auditflow_refresh_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    
    localStorage.setItem('auditflow_token', response.access);
    localStorage.setItem('auditflow_refresh_token', response.refresh);
    setToken(response.access);

    const userData = await userService.getCurrentUser();
    setUser(userData);
  };

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem('auditflow_refresh_token');
    
    if (refreshToken) {
      authService.logout(refreshToken).catch(console.error);
    }

    localStorage.removeItem('auditflow_token');
    localStorage.removeItem('auditflow_refresh_token');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
