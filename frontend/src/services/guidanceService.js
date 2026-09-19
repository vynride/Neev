import { apiClient } from './apiClient';
import { mockGuidanceData } from '../data/mockData';

export const guidanceService = {
  // Fetch detailed structured AI guidance breakdown
  async getGuidanceDetails(guidanceId = 'guidance_101') {
    try {
      const res = await apiClient.get(`/api/guidance/${guidanceId}`);
      return res.data;
    } catch {
      return mockGuidanceData;
    }
  },

  // Generate polite professional client message from requirement ambiguity
  async generateClientMessage(unclearPoints) {
    try {
      const res = await apiClient.post('/api/guidance/generate-client-message', {
        unclearPoints
      });
      return res.data.message;
    } catch {
      return mockGuidanceData.clientMessageDraft;
    }
  }
};
