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

  async listRequirements(projectId) {
    return (await apiClient.get(`/api/mentor/projects/${projectId}/requirements`)).data;
  },

  async getRequirement(projectId, requirementId) {
    return (await apiClient.get(`/api/mentor/projects/${projectId}/requirements/${requirementId}`)).data;
  },

  async createRequirement(projectId, draft) {
    return (await apiClient.post(`/api/mentor/projects/${projectId}/requirements`, draft)).data;
  },

  async saveRequirement(projectId, requirementId, draft) {
    return (await apiClient.put(`/api/mentor/projects/${projectId}/requirements/${requirementId}`, draft)).data;
  },

  async publishRequirement(projectId, requirementId, expectedRevision) {
    return (await apiClient.post(`/api/mentor/projects/${projectId}/requirements/${requirementId}/publish`, { expected_revision: expectedRevision })).data;
  },

  async listRuns(projectId, q = '') {
    return (await apiClient.get('/api/mentor/runs', { params: { project_id: projectId, q } })).data;
  },

  async getRun(runId) {
    return (await apiClient.get(`/api/mentor/runs/${runId}`)).data;
  },

  async reviewRun(runId, review) {
    return (await apiClient.post(`/api/mentor/runs/${runId}/review`, review)).data;
  },

  async listEvalCases(projectId) {
    return (await apiClient.get('/api/mentor/evals/cases', { params: { project_id: projectId } })).data;
  },

  async createEvalCase(runId, expectedRefs, forbiddenText, requiredText) {
    return (await apiClient.post(`/api/mentor/evals/cases/from-run/${runId}`, {
      expected_refs: expectedRefs, forbidden_text: forbiddenText, required_text: requiredText
    })).data;
  },

  async updateEvalCase(caseId, expectedRefs, forbiddenText, requiredText) {
    return (await apiClient.put(`/api/mentor/evals/cases/${caseId}`, {
      expected_refs: expectedRefs, forbidden_text: forbiddenText, required_text: requiredText
    })).data;
  },

  async getLatestEval(projectId) {
    return (await apiClient.get('/api/mentor/evals/latest', { params: { project_id: projectId } })).data;
  },

  async listAuditEvents(projectId) {
    return (await apiClient.get('/api/mentor/runs/audit/events', { params: { project_id: projectId } })).data;
  },
};
