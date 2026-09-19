import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  CheckSquare,
  Network,
  Calendar,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Card, Badge } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { studentService } from '../services/studentService';
import { projectService } from '../services/projectService';
import { errorMessage } from '../services/apiClient';
import { formatDate } from '../services/format';
import { useAuth } from '../context/AuthContext';

export const StudentDashboard = () => {
  const { user, projectId } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [project, profile] = await Promise.all([
          projectService.getProject(projectId),
          studentService.getProfile(user.id)
        ]);
        setData({ project, profile });
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    if (projectId) fetchDashboard();
    else setLoading(false);
  }, [projectId, user.id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="skeleton" style={{ height: '80px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div className="skeleton" style={{ height: '300px' }} />
          <div className="skeleton" style={{ height: '300px' }} />
        </div>
      </div>
    );
  }

  if (error) return <div className="notice-error">{error}</div>;
  if (!data) {
    return <div className="notice-error">You are not assigned to a project yet. Ask your programme coordinator.</div>;
  }

  const { project, profile } = data;
  const { strengths, focusAreas } = profile;
  const myTasks = project.tasks.filter((t) => t.assignee_id === user.id && t.status !== 'done');
  const stats = {
    totalTasks: project.metrics.total,
    completed: project.metrics.completed,
    overdue: project.metrics.overdue,
    inReview: project.metrics.inReview
  };
  const quickActions = [
    { id: 'ask', label: 'Ask the AI mentor', path: '/student/mentor' },
    { id: 'tasks', label: `My open tasks (${myTasks.length})`, path: '/student/project?tab=tasks' },
    { id: 'calls', label: 'Client call notes', path: '/student/project?tab=calls' },
    { id: 'kb', label: 'Answers from mentors', path: '/student/knowledge' }
  ];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const handleQuickAction = (action) => {
    if (action.path) {
      navigate(action.path);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Greeting Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
            {greeting}, {user.name.split(' ')[0]}!
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Keep going. Small steps make big progress.
          </p>
        </div>

        {/* Quick Help CTA */}
        <Button
          onClick={() => navigate('/student/mentor')}
          variant="primary"
        >
          Ask AI Mentor
        </Button>
      </div>

      {/* Main Grid: 2 Columns matching Reference Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1.1fr)', gap: '28px' }}>
        {/* Left Column: Project Card, Statistics, Next Up */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Main Project Card */}
          <Card style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                  {project.name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Client: <strong style={{ color: 'var(--color-text-main)' }}>{project.client_name}</strong>
                </p>
              </div>
              <Badge variant="green">{project.stage}</Badge>
            </div>

            {/* Progress Section */}
            <div style={{ marginTop: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Tasks Completed</span>
                <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{project.progress}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${project.progress}%`,
                    height: '100%',
                    background: 'var(--color-primary)',
                    borderRadius: '999px',
                    transition: 'width 0.5s ease'
                  }}
                />
              </div>
            </div>

            {/* Deadline and Details Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid var(--color-border)',
                fontSize: '0.85rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)' }}>
                <span>Deadline: <strong style={{ color: 'var(--color-text-main)' }}>{formatDate(project.deadline)}</strong></span>
              </div>

              <button
                onClick={() => navigate('/student/project')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  fontSize: '0.85rem'
                }}
              >
                View Project Details <ChevronRight size={16} />
              </button>
            </div>
          </Card>

          {/* 4 Statistics KPI Cards Row */}
          <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <Card style={{ padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                {stats.totalTasks}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, marginTop: '2px' }}>
                Total Tasks
              </div>
            </Card>

            <Card style={{ padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                {stats.completed}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, marginTop: '2px' }}>
                Completed
              </div>
            </Card>

            <Card style={{ padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                {stats.overdue}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, marginTop: '2px' }}>
                Overdue
              </div>
            </Card>

            <Card style={{ padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-info)' }}>
                {stats.inReview}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, marginTop: '2px' }}>
                In Review
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column: Quick Actions, Strengths & Focus Areas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Quick Actions Panel */}
          <Card>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '16px' }}>
              Quick Actions
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {quickActions.map((action) => {
                let Icon = Sparkles;
                if (action.icon === 'BookOpen') Icon = BookOpen;
                else if (action.icon === 'CheckSquare') Icon = CheckSquare;
                else if (action.icon === 'Network') Icon = Network;

                return (
                  <button
                    key={action.id}
                    className="hover-row"
                    onClick={() => handleQuickAction(action)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: 'var(--color-text-main)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{action.label}</span>
                    <ChevronRight size={16} color="var(--color-text-subtle)" />
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Your Strengths & Focus Areas */}
          <Card>
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-main)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                Your Strengths
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {strengths.length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No scores yet</span>}
                {strengths.map((str) => (
                  <span
                    key={str}
                    style={{
                      background: 'var(--color-primary-subtle)',
                      color: 'var(--color-primary)',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}
                  >
                    {str}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-main)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                Areas to Focus
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {focusAreas.map((area) => (
                  <span
                    key={area}
                    style={{
                      background: 'var(--color-accent-subtle)',
                      color: 'var(--color-accent-strong)',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
