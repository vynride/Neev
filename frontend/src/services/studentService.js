import { apiClient } from './apiClient';
import { mockDashboardData, mockStudent } from '../data/mockData';

export const studentService = {
  // Fetch dashboard summary for the authenticated student
  async getDashboard() {
    try {
      const res = await apiClient.get('/api/student/dashboard');
      return res.data;
    } catch {
      // Graceful fallback for hackathon judging & offline demo
      return mockDashboardData;
    }
  },

  // Fetch student profile details
  async getProfile() {
    try {
      const res = await apiClient.get('/api/student/profile');
      return res.data;
    } catch {
      return mockStudent;
    }
  }
};
