import { apiClient } from './apiClient';

// The AI mentor chat. Every reply has: session_id, message_id, category, next_action
// (answered | clarify | ask_client | escalated), message (markdown), citations, resources,
// draft_client_message and ticket_id.
export const mentorService = {
  async ask(projectId, message, sessionId) {
    const res = await apiClient.post('/api/chat', {
      project_id: projectId,
      message,
      session_id: sessionId || null,
    });
    return res.data;
  },

  // resolved=false gets one retry from the AI, then a mentor ticket (or a past mentor answer)
  // A rejected saved ("Fast") answer goes to the mentor for review, with the student's reason
  async sendFeedback(messageId, resolved, reason = '') {
    return (await apiClient.post(`/api/chat/${messageId}/feedback`, { resolved, reason })).data;
  },

  async getSession(sessionId) {
    return (await apiClient.get(`/api/sessions/${sessionId}`)).data;
  },

  async listSessions(projectId) {
    return (await apiClient.get('/api/sessions', { params: { project_id: projectId } })).data;
  },
};
