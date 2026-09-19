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
import { projectService } from '../services/projectService';

export const ProjectOverview = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'overview';
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data = await projectService.getProjectDetails();
        setProject(data);
      } catch (err) {
        console.error('Failed to load project details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading project context...</div>;
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'requirements', label: 'Requirements' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'technical', label: 'Technical Context' },
    { id: 'issues', label: 'Issues' }
  ];

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            {project.name}
          </h1>
          <Badge variant="green">{project.stage}</Badge>
        </div>
        <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', marginTop: '4px', margin: 0 }}>
          Client: <strong style={{ color: 'var(--color-text-main)' }}>{project.client}</strong>
        </p>
      </div>

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
              borderBottom: activeTab === tab.id ? '3px solid var(--color-primary)' : '3px solid transparent',
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
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1.1fr)', gap: '28px' }}>
          {/* Left Column: Project Summary & Technologies */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Project Summary Card */}
            <Card>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '12px' }}>
                Project Summary
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
                {project.summary}
              </p>

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
                    {project.client}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Domain</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '2px' }}>
                    {project.domain}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Deadline</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '2px' }}>
                    {project.deadline}
                  </div>
                </div>
              </div>
            </Card>

            {/* Technologies Card */}
            <Card>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '16px' }}>
                Technologies & Architecture
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px' }}>
                {project.techStack.map((tech) => (
                  <div
                    key={tech.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: '#F8FAFC',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{tech.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{tech.name}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{tech.category}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column: Project Progress Donut & Team */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Project Progress Card with Donut Chart */}
            <Card>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '20px' }}>
                Project Progress
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px' }}>
                {/* SVG Radial Donut Chart */}
                <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                  <svg width="130" height="130" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#F1F5F9" strokeWidth="12" fill="none" />
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
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>In Progress</span>
                    <strong style={{ marginLeft: 'auto' }}>{project.metrics.inProgress}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#CBD5E1' }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>Pending</span>
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
                  4 Members
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {project.team.map((member) => (
                  <div
                    key={member.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: '#FAFBF8'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={member.avatar}
                        alt={member.name}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>{member.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{member.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Requirements Tab View */}
      {activeTab === 'requirements' && (
        <Card>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Project Requirements</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Tracked specifications aligned with Barabari Collective standards
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {project.requirements.map((req) => (
              <div
                key={req.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: req.status === 'Done' ? '#F0FDF4' : '#FFFFFF'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {req.id}
                  </span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                    {req.title}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Badge variant={req.priority === 'High' ? 'orange' : 'gray'}>{req.priority}</Badge>
                  <Badge variant={req.status === 'Done' ? 'green' : 'blue'}>{req.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tasks Tab View */}
      {activeTab === 'tasks' && (
        <Card>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>Sprint Tasks</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {project.tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: '#FFFFFF'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Assignee: <strong>{task.assignee}</strong> · {task.due}
                  </div>
                </div>
                <Badge variant={task.status === 'Done' ? 'green' : 'orange'}>{task.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Technical Context Tab View */}
      {activeTab === 'technical' && (
        <Card>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>Technical Architecture</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Repository</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '4px', color: 'var(--color-primary)' }}>
                {project.technicalContext.repository}
              </div>
            </div>
            <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Active Branch</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '4px' }}>
                {project.technicalContext.branch}
              </div>
            </div>
            <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Database & Cache</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '4px' }}>
                {project.technicalContext.database}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
