import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCode,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Card, Badge } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Markdown } from '../components/ui/Markdown';
import { Avatar } from '../components/ui/Avatar';
import { projectService } from '../services/projectService';
import { errorMessage } from '../services/apiClient';
import { formatDate, statusLabel, isOverdue } from '../services/format';
import { useAuth } from '../context/AuthContext';

export const ProjectOverview = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'overview';
  const { user, projectId } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setProject(await projectService.getProject(projectId));
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    try {
      const res = await projectService.syncRepo(projectId);
      setProject((prev) => ({ ...prev, repo_synced_at: res.repo_synced_at }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading project context...</div>;
  }
  if (!project) return <div className="notice-error">{error || 'Project not found.'}</div>;

  const visibleTasks = mineOnly ? project.tasks.filter((t) => t.assignee_id === user.id) : project.tasks;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'tasks', label: `Tasks (${project.tasks.length})` },
    { id: 'calls', label: `Client Calls (${project.meetings.length})` },
    { id: 'technical', label: 'Technical Context' }
  ];

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Top Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            {project.name}
          </h1>
          <Badge variant="green">{project.stage}</Badge>
        </div>
        <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', marginTop: '4px', margin: 0 }}>
          Client: <strong style={{ color: 'var(--color-text-main)' }}>{project.client_name}</strong>
        </p>
      </div>

      {error && <div className="notice-error">{error}</div>}

      {/* Tabs Row */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: '8px' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            style={{
              padding: '10px 18px',
              fontSize: '0.88rem',
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-1px',
              background: 'transparent',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="tab-enter" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1.1fr)', gap: '12px' }}>
          {/* Left Column: Project Summary & Technologies */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Project Summary Card */}
            <Card>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '12px' }}>
                Project Summary
              </h3>
              <div style={{ marginBottom: '24px' }}>
                <Markdown>{project.card || 'The project summary is built when the project is ingested.'}</Markdown>
              </div>

              {/* Metadata 3-column stats */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '16px',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--color-border)'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Client</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '2px' }}>
                    {project.client_name}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Started</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '2px' }}>
                    {formatDate(project.start_date)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Deadline</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '2px' }}>
                    {formatDate(project.deadline)}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Project Progress Donut & Team */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Project Progress Card with Donut Chart */}
            <Card>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '20px' }}>
                Project Progress
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px' }}>
                {/* SVG Radial Donut Chart */}
                <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                  <svg width="130" height="130" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="var(--bg-subtle)" strokeWidth="12" fill="none" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="var(--color-primary)"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray="251.2"
                      strokeDashoffset={`${251.2 - (251.2 * project.progress) / 100}`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                      {project.progress}%
                    </span>
                  </div>
                </div>

                {/* Progress Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-primary)' }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>Completed</span>
                    <strong style={{ marginLeft: 'auto' }}>{project.metrics.completed}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-accent)' }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>In Progress</span>
                    <strong style={{ marginLeft: 'auto' }}>{project.metrics.inProgress + project.metrics.inReview}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-border-strong)' }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>To Do</span>
                    <strong style={{ marginLeft: 'auto' }}>{project.metrics.pending}</strong>
                  </div>
                </div>
              </div>
            </Card>

            {/* Team Members Card */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                  Team
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  {project.team.length} Members
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {project.team.map((member) => (
                  <div
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Avatar id={member.id} name={member.name} tone={member.role === 'mentor' ? 'orange' : 'green'} />
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>{member.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                          {member.role}{member.id === user.id ? ' (you)' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tasks Tab View: live from ClickUp */}
      {activeTab === 'tasks' && (
        <Card className="tab-enter">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Project Tasks</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Synced from ClickUp. The AI mentor reads the same list.
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={mineOnly}
                onChange={(e) => setMineOnly(e.target.checked)}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              Only my tasks
            </label>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {visibleTasks.length === 0 && (
              <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>No tasks here.</div>
            )}
            {visibleTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: task.status === 'done' ? 'var(--bg-accent-soft)' : '#FFFFFF'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                    {task.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Assignee: <strong>{task.assignee_name || 'Unassigned'}</strong> · Due {formatDate(task.due_date)}
                    {isOverdue(task) && <strong style={{ color: 'var(--color-danger)' }}> · Overdue</strong>}
                  </div>
                </div>
                <Badge variant={task.status === 'done' ? 'green' : task.status === 'to do' ? 'gray' : 'orange'}>
                  {statusLabel(task.status)}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Client Calls Tab View: past calls the AI mentor can search */}
      {activeTab === 'calls' && (
        <Card className="tab-enter">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Client Calls</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '2px 0 16px' }}>
            Transcripts of these calls are part of the AI mentor's project context.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {project.meetings.length === 0 && (
              <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>No calls recorded yet.</div>
            )}
            {project.meetings.map((m) => (
              <div key={m.id} style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{m.title}</div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDate(m.started_at)}
                  </span>
                </div>
                <Markdown>{m.summary || 'No summary yet.'}</Markdown>
                <button
                  onClick={() => navigate('/student/mentor', { state: { prefill: `In the call "${m.title}", ` } })}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)' }}
                >
                  Ask the AI mentor about this call <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Technical Context Tab View */}
      {activeTab === 'technical' && (
        <Card className="tab-enter">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>Technical Context</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Repository</div>
              <a
                href={project.repo_url}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginTop: '4px', color: 'var(--color-primary)', overflowWrap: 'anywhere' }}
              >
                {project.repo_url || 'No repository linked'}
              </a>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Code last read by the AI mentor</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '4px' }}>
                {project.repo_synced_at ? new Date(project.repo_synced_at).toLocaleString('en-IN') : 'Not synced yet'}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing || !project.repo_url}>
              {syncing ? 'Fetching latest code...' : 'Fetch latest code now'}
            </Button>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              This also happens on its own whenever you start a new chat.
            </span>
          </div>
        </Card>
      )}
    </div>
  );
};
