import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('stockflow_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [organization, setOrganization] = useState(() => {
    const saved = localStorage.getItem('stockflow_org');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('stockflow_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('stockflow_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (res.success && res.data) {
            setUser(res.data.user);
            setOrganization(res.data.organization);
            localStorage.setItem('stockflow_user', JSON.stringify(res.data.user));
            localStorage.setItem('stockflow_org', JSON.stringify(res.data.organization));
          }
        } catch (err) {
          console.warn('Session verification failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    if (res.success && res.data) {
      const { token: newToken, user: newUser, organization: newOrg } = res.data;
      setToken(newToken);
      setUser(newUser);
      setOrganization(newOrg);
      localStorage.setItem('stockflow_token', newToken);
      localStorage.setItem('stockflow_user', JSON.stringify(newUser));
      localStorage.setItem('stockflow_org', JSON.stringify(newOrg));
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const signup = async (signupData) => {
    const res = await authService.signup(signupData);
    if (res.success && res.data) {
      const { token: newToken, user: newUser, organization: newOrg } = res.data;
      setToken(newToken);
      setUser(newUser);
      setOrganization(newOrg);
      localStorage.setItem('stockflow_token', newToken);
      localStorage.setItem('stockflow_user', JSON.stringify(newUser));
      localStorage.setItem('stockflow_org', JSON.stringify(newOrg));
      return res;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setOrganization(null);
    localStorage.removeItem('stockflow_token');
    localStorage.removeItem('stockflow_user');
    localStorage.removeItem('stockflow_org');
  };

  const updateOrganizationContext = (updatedOrg) => {
    setOrganization((prev) => {
      const updated = { ...prev, ...updatedOrg };
      localStorage.setItem('stockflow_org', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        signup,
        logout,
        updateOrganizationContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
