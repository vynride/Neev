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

export const relativeDay = (iso) => {
  const d = new Date(iso);
  const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
  if (days <= 0) return `Today, ${formatTime(iso)}`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDate(iso);
};

const DOC_NAMES = { sow: 'Statement of Work', brief: 'Project brief', readme: 'README' };

// Turn an internal reference into something a person would say.
// Returns { label, title, detail, href } for one citation.
export const describeCitation = (c, project) => {
  const ref = c.ref || '';
  if (c.type === 'kb') {
    return { label: 'Mentor answer', title: c.snippet || 'A question your mentor answered before', detail: '' };
  }
  if (c.type === 'task') {
    const task = project?.tasks?.find((t) => t.id === ref);
    return {
      label: 'Task',
      title: task?.name || c.snippet || 'Project task',
      detail: task ? `${statusLabel(task.status)} · due ${formatDate(task.due_date)}` : ''
    };
  }
  if (c.type === 'meeting') {
    const [meetingId, at] = ref.split('@');
    const meeting = project?.meetings?.find((m) => m.id === meetingId);
    const time = at ? at.replace(/^00:/, '') : '';
    return { label: 'Client call', title: meeting?.title || 'Client call', detail: time ? `at ${time}` : '', quote: c.snippet };
  }
  if (c.type === 'doc') {
    const [file, section] = ref.split('#');
    const base = file.split('/').pop().replace(/\.\w+$/, '');
    return { label: 'Document', title: DOC_NAMES[base.toLowerCase()] || titleCase(base), detail: section || '', quote: c.snippet };
  }
  if (c.type === 'code') {
    const match = /^(.*?)(?::(\d+))?$/.exec(ref);
    const path = match[1];
    const line = match[2];
    const repo = project?.repo_url?.replace(/\.git$/, '');
    return {
      label: 'Code',
      title: path.split('/').pop(),
      detail: [path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '', line && line !== '1' ? `line ${line}` : ''].filter(Boolean).join(' · '),
      href: repo ? `${repo}/blob/HEAD/${path}${line ? `#L${line}` : ''}` : undefined,
      mono: true
    };
  }
  return { label: titleCase(c.type), title: ref, detail: '', quote: c.snippet };
};

// "Due in 3 days" is easier to act on than a date
export const dueLabel = (iso, done = false) => {
  if (!iso) return 'No due date';
  if (done) return `Was due ${formatDate(iso)}`;
  const days = Math.round((new Date(`${iso.slice(0, 10)}T00:00:00`) - new Date().setHours(0, 0, 0, 0)) / 86400000);
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days > 1 && days <= 14) return `Due in ${days} days`;
  if (days === -1) return '1 day late';
  if (days < -1) return `${-days} days late`;
  return `Due ${formatDate(iso)}`;
};

export const waitingFor = (iso) => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
  if (mins < 60) return `${mins || 1} min`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)} h`;
  return `${Math.round(mins / 1440)} d`;
};
