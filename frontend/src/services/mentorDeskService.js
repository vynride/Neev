import { apiClient } from './apiClient';

// The human mentor's side: escalated tickets, FYIs and load metrics
export const mentorDeskService = {
  async listTickets(status = 'open') {
    return (await apiClient.get('/api/mentor/tickets', { params: { status } })).data;
  },

  async getTicket(ticketId) {
    return (await apiClient.get(`/api/mentor/tickets/${ticketId}`)).data;
  },

  async resolve(ticketId, answer) {
    return (await apiClient.post(`/api/mentor/tickets/${ticketId}/resolve`, { answer })).data;
  },

  async getMetrics() {
    return (await apiClient.get('/api/mentor/metrics')).data;
  },
};
