// Shared display helpers for values that come from the backend

export const CATEGORY_LABELS = {
  requirements_communication: 'Requirements & Communication',
  scope_timeline_contract: 'Scope, Timeline & Contract',
  architecture_design: 'Architecture & Design',
  development_debugging: 'Development & Debugging',
  deployment_handoff: 'Deployment & Handoff',
  git_workflow: 'Git Workflow',
};

export const categoryLabel = (key) => CATEGORY_LABELS[key] || key || 'General';

export const STATUS_LABELS = {
  'to do': 'To Do',
  'in progress': 'In Progress',
  review: 'In Review',
  done: 'Done',
};

export const statusLabel = (key) => STATUS_LABELS[key] || key;

export const formatDate = (iso) => {
  if (!iso) return 'Not set';
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatTime = (iso) =>
  new Date(iso || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const isOverdue = (task) =>
  task.status !== 'done' && task.due_date && task.due_date < new Date().toISOString().slice(0, 10);

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

export const titleCase = (key = '') =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
