import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check existing session on application mount
  const checkAuthStatus = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Student Login
  const loginStudent = async (rollNumber, password) => {
    const response = await api.post('/auth/student/login', {
      rollNumber,
      password,
    });
    if (response.data.success && response.data.user) {
      setUser(response.data.user);
    }
    return response.data;
  };

  // Student Registration
  const registerStudent = async (formData) => {
    const response = await api.post('/auth/student/register', formData);
    if (response.data.success && response.data.user) {
      setUser(response.data.user);
    }
    return response.data;
  };

  // Admin Login
  const loginAdmin = async (username, password) => {
    const response = await api.post('/auth/admin/login', {
      username,
      password,
    });
    if (response.data.success && response.data.user) {
      setUser(response.data.user);
    }
    return response.data;
  };

  // Logout
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        loading,
        isAuthenticated: !!user,
        loginStudent,
        registerStudent,
        loginAdmin,
        logout,
        checkAuthStatus,
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

