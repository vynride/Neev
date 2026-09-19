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

  async listProjects() {
    return (await apiClient.get('/api/mentor/projects')).data;
  },

  async listStudents() {
    return (await apiClient.get('/api/mentor/students')).data;
  },

  async getStudent(studentId) {
    return (await apiClient.get(`/api/mentor/students/${studentId}`)).data;
  },

  // Mentors can correct what the AI believes about a student
  async saveStudentMemory(studentId, markdown) {
    return (await apiClient.put(`/api/students/${studentId}/memory`, { markdown })).data;
  },

  async getSession(sessionId) {
    return (await apiClient.get(`/api/sessions/${sessionId}`)).data;
  },

  async getMetrics() {
    return (await apiClient.get('/api/mentor/metrics')).data;
  },
};
