import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockStudent } from '../data/mockData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('saathi_student_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return mockStudent;
      }
    }
    // Default authenticated with Aditi for hackathon judging convenience
    return mockStudent;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('saathi_student_user') || true;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('saathi_student_user', JSON.stringify(user));
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('saathi_student_user');
      localStorage.removeItem('saathi_auth_token');
      setIsAuthenticated(false);
    }
  }, [user]);

  const login = (email, password) => {
    // In hackathon dev mode, match student credentials or mock student
    const studentUser = {
      ...mockStudent,
      email: email || mockStudent.email
    };
    localStorage.setItem('saathi_auth_token', 'mock_jwt_token_for_aditi');
    setUser(studentUser);
    return true;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const demoLogin = () => {
    localStorage.setItem('saathi_auth_token', 'mock_jwt_token_for_aditi');
    setUser(mockStudent);
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, demoLogin }}>
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
