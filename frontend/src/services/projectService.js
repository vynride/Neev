import { apiClient } from './apiClient';
import { mockProject } from '../data/mockData';

export const projectService = {
  // Fetch detailed project overview
  async getProjectDetails(projectId = 'proj_ecommerce') {
    try {
      const res = await apiClient.get(`/api/projects/${projectId}`);
      return res.data;
    } catch {
      return mockProject;
    }
  },

  // Fetch project requirements list
  async getRequirements(projectId = 'proj_ecommerce') {
    try {
      const res = await apiClient.get(`/api/projects/${projectId}/requirements`);
      return res.data;
    } catch {
      return mockProject.requirements;
    }
  },

  // Fetch project tasks
  async getTasks(projectId = 'proj_ecommerce') {
    try {
      const res = await apiClient.get(`/api/projects/${projectId}/tasks`);
      return res.data;
    } catch {
      return mockProject.tasks;
    }
  }
};
