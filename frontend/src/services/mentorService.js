import { apiClient } from './apiClient';
import {
  mockMentorContext,
  mockSuggestedQuestions,
  mockInitialConversation
} from '../data/mockData';

export const mentorService = {
  // Retrieve project context panel data
  async getProjectContext() {
    try {
      const res = await apiClient.get('/api/mentor/context');
      return res.data;
    } catch {
      return mockMentorContext;
    }
  },

  // Retrieve suggested follow-up prompts
  async getSuggestedQuestions() {
    try {
      const res = await apiClient.get('/api/mentor/suggested-questions');
      return res.data;
    } catch {
      return mockSuggestedQuestions;
    }
  },

  // Retrieve initial conversation history
  async getConversationHistory() {
    try {
      const res = await apiClient.get('/api/mentor/history');
      return res.data;
    } catch {
      return mockInitialConversation;
    }
  },

  // Ask AI Mentor a technical/project question
  async askQuestion(questionText, projectContext = {}) {
    try {
      const res = await apiClient.post('/api/mentor/chat', {
        question: questionText,
        context: projectContext
      });
      return res.data;
    } catch {
      // Dynamic simulated response for demo
      const lower = questionText.toLowerCase();
      if (lower.includes('token') || lower.includes('expiration') || lower.includes('refresh')) {
        return {
          type: 'architecture_response',
          explanation: "In your project, JWT access tokens expire after 15 minutes for security. When an access token expires, your React client catches the 401 Unauthorized status and uses an HTTP-only refresh token stored securely in the browser to request a fresh access token without logging the user out.",
          keySteps: [
            "Access token sent in header: Authorization: Bearer <token>",
            "Server returns 401 Unauthorized when token reaches expiration",
            "Axios interceptor catches 401 and calls /api/auth/refresh",
            "Server verifies refresh token against session store",
            "New access token is returned and original request is retried"
          ],
          diagram: `graph TD
  Client["Client (React)"]
  API["API Backend (FastAPI)"]
  AuthStore["Token Store / Redis"]

  Client -->|"1. API Request (Expired Token)"| API
  API -->|"2. 401 Expired Error"| Client
  Client -->|"3. POST /refresh (HTTP-only Cookie)"| API
  API -->|"4. Validate Refresh Token"| AuthStore
  AuthStore -->|"5. Token Valid"| API
  API -->|"6. Issue New Access Token"| Client
  Client -->|"7. Re-send Original Request"| API

  classDef primary fill:#1E5E3A,stroke:#164E2E,stroke-width:2px,color:#fff;
  classDef accent fill:#FEF3C7,stroke:#E06D53,stroke-width:1.5px,color:#1E293B;
  class Client,API primary;
  class AuthStore accent;`
        };
      }

      return {
        type: 'text_response',
        explanation: `Based on your ${projectContext.project || 'E-Commerce Platform'} codebase: To solve this, consider the modules in ${projectContext.keyModules || 'Auth, Products, Payments'}. Keep your API endpoints RESTful and make sure to validate client inputs before writing to the database.`,
        keySteps: [
          "Check relevant file in your repository",
          "Ensure schema matches backend validation",
          "Test locally using unit tests before deploying"
        ]
      };
    }
  }
};
