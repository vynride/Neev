import { apiClient } from './apiClient';
import { isOverdue } from './format';

const taskMetrics = (tasks) => ({
  total: tasks.length,
  completed: tasks.filter((t) => t.status === 'done').length,
  inProgress: tasks.filter((t) => t.status === 'in progress').length,
  inReview: tasks.filter((t) => t.status === 'review').length,
  pending: tasks.filter((t) => t.status === 'to do').length,
  overdue: tasks.filter(isOverdue).length,
});

export const projectService = {
  // Project details with live ClickUp tasks, team, client calls and the AI-written project card
  async getProject(projectId) {
    const p = (await apiClient.get(`/api/projects/${projectId}`)).data;
    const metrics = taskMetrics(p.tasks);
    return {
      ...p,
      metrics,
      progress: metrics.total ? Math.round((metrics.completed / metrics.total) * 100) : 0,
    };
  },

  async syncRepo(projectId) {
    return (await apiClient.post(`/api/projects/${projectId}/sync`)).data;
  },

  // Mentor-approved answers, reused before any new escalation
  async getKnowledgeBase() {
    return (await apiClient.get('/api/kb')).data;
  },
};
