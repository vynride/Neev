import { apiClient } from './apiClient';

const EXTENSIONS = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a' };

// Speaking to the AI mentor. A voice reply is a normal chat reply plus: transcript (what she
// said), language (e.g. hi-IN) and audio (base64, may be null if speech failed).
export const voiceService = {
  async isEnabled() {
    return (await apiClient.get('/api/voice/status')).data.enabled;
  },

  async ask(projectId, recording, sessionId) {
    const type = recording.type.split(';')[0];
    const form = new FormData();
    form.append('audio', recording, `question.${EXTENSIONS[type] || 'webm'}`);
    form.append('project_id', projectId);
    if (sessionId) form.append('session_id', sessionId);
    // The browser sets the multipart boundary itself
    return (await apiClient.post('/api/voice/ask', form, { headers: { 'Content-Type': undefined } })).data;
  },

  async speak(text, language) {
    return (await apiClient.post('/api/voice/speak', { text, language })).data;
  },
};

// Hindi and Marathi share a script; Hindi is the safer guess for this cohort
export const guessLanguage = (text) => (/[ऀ-ॿ]/.test(text) ? 'hi-IN' : 'en-IN');

export const audioUrl = (reply) => `data:${reply.audio_mime || 'audio/mpeg'};base64,${reply.audio}`;
