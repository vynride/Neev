import React, { createContext, useContext, useState, useCallback } from 'react';
import { apiClient, TOKEN_KEY, USER_KEY } from '../services/apiClient';

const AuthContext = createContext(null);

const readSavedUser = () => {
  try {
    const saved = localStorage.getItem(USER_KEY);
    return saved && localStorage.getItem(TOKEN_KEY) ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readSavedUser);

  // The backend has seeded users and no passwords: logging in means picking one
  const login = useCallback(async (userId) => {
    const res = await apiClient.post('/api/login', { user_id: userId });
    localStorage.setItem(TOKEN_KEY, res.data.token);
    const me = (await apiClient.get('/api/me')).data;
    localStorage.setItem(USER_KEY, JSON.stringify(me));
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const project = user?.projects?.[0] || null;

  return (
    <AuthContext.Provider
      value={{ user, project, projectId: project?.id || null, isAuthenticated: !!user, login, logout }}
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

export const homeFor = (user) => (user?.role === 'student' ? '/student/dashboard' : '/mentor/desk');
