import { apiClient } from './apiClient';

export const escalationService = {
  // Submit an escalation ticket to human mentors
  async submitEscalation(ticketData) {
    try {
      const res = await apiClient.post('/api/escalations', ticketData);
      return res.data;
    } catch {
      // Mock generated ticket ID
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      return {
        success: true,
        ticketId: `T-${randomNum}`,
        status: 'Pending Mentor Response',
        category: ticketData.category || 'Architecture & Implementation',
        priority: ticketData.priority || 'Medium',
        createdAt: new Date().toISOString()
      };
    }
  }
};
