import { apiClient } from './apiClient';
import { titleCase } from './format';

const STRONG = 70;
const WEAK = 50;

// Flatten CodeGuru domains and Samvad Saathi scores into one list of { name, score, source }
const skillList = (scores) => {
  if (!scores) return [];
  const out = [];
  Object.entries(scores.codeguru?.domains || {}).forEach(([k, v]) =>
    out.push({ name: titleCase(k), score: v, source: 'CodeGuru' }));
  Object.entries(scores.samvad_saathi?.knowledge || {}).forEach(([k, v]) =>
    out.push({ name: titleCase(k), score: v, source: 'Samvad Saathi' }));
  Object.entries(scores.samvad_saathi?.speech || {}).forEach(([k, v]) =>
    out.push({ name: `Spoken ${titleCase(k).toLowerCase()}`, score: v, source: 'Samvad Saathi' }));
  return out;
};

const average = (values) =>
  values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;

export const studentService = {
  // Scores from CodeGuru and Samvad Saathi plus what the AI mentor has learned about the student
  async getProfile(studentId) {
    const data = (await apiClient.get(`/api/students/${studentId}/memory`)).data;
    const skills = skillList(data.scores);
    const samvad = data.scores?.samvad_saathi;
    return {
      scores: data.scores,
      memory: data.markdown,
      struggles: data.struggles,
      skills,
      strengths: skills.filter((s) => s.score >= STRONG).map((s) => s.name),
      focusAreas: skills.filter((s) => s.score < WEAK).map((s) => s.name),
      samvadAverage: samvad
        ? average([...Object.values(samvad.knowledge || {}), ...Object.values(samvad.speech || {})])
        : 0,
    };
  },
};
