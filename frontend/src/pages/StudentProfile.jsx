import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Award, Code2, MessageSquare, Briefcase, Mail, Sparkles, ShieldCheck, Brain } from 'lucide-react';
import { Card, Badge } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Markdown } from '../components/ui/Markdown';
import { studentService } from '../services/studentService';
import { projectService } from '../services/projectService';
import { errorMessage } from '../services/apiClient';
import { titleCase } from '../services/format';
import { useAuth } from '../context/AuthContext';

const ScoreBar = ({ label, value, color }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <strong>{value}</strong>
    </div>
    <div style={{ width: '100%', height: '6px', background: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden' }}>
      <div style={{ width: `${value}%`, height: '100%', background: color }} />
    </div>
  </div>
);

export const StudentProfile = () => {
  const { user, projectId } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      studentService.getProfile(user.id),
      projectId ? projectService.getProject(projectId) : null
    ])
      .then(([prof, proj]) => {
        setProfile(prof);
        setProject(proj);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [user.id, projectId]);

  if (error) return <div className="notice-error">{error}</div>;
  if (!profile) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading profile...</div>;

  const codeguru = profile.scores?.codeguru;
  const samvad = profile.scores?.samvad_saathi;
  const mentor = project?.team.find((m) => m.role === 'mentor');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%' }}>
      {/* Top Profile Header */}
      <Card style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Avatar name={user.name} size={84} />
            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
                {user.name}
              </h1>
              <div style={{ fontSize: '0.88rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: '2px' }}>
                Barabari Collective · Freelance track
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '10px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Mail size={14} color="var(--color-text-muted)" /> {user.email}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ShieldCheck size={14} color="var(--color-primary)" /> ID: <strong>{user.id}</strong>
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button onClick={() => navigate('/student/mentor')} variant="primary" size="sm" icon={Sparkles}>
              Ask AI Mentor
            </Button>
          </div>
        </div>
      </Card>

      {/* Evaluation scores from CodeGuru and Samvad Saathi */}
      {profile.scores && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <Award size={20} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
              Barabari Evaluation Scores
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              The AI mentor uses these to pitch its explanations at the right level
            </span>
          </div>

          <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'var(--color-primary-subtle)', padding: '8px', borderRadius: '8px', color: 'var(--color-primary)' }}>
                    <Code2 size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>CodeGuru</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Technical assessment</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {codeguru.monthly_avg}<span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>/100</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>monthly average</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(codeguru.domains).map(([k, v]) => (
                  <ScoreBar key={k} label={titleCase(k)} value={v} color="var(--color-primary)" />
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
                <Badge variant="gray">Capstone {codeguru.capstone}</Badge>
                <Badge variant="gray">Attendance {codeguru.attendance_pct}%</Badge>
                <Badge variant="gray">Daily activity {codeguru.daily_activity_pct}%</Badge>
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'var(--color-accent-subtle)', padding: '8px', borderRadius: '8px', color: 'var(--color-accent-strong)' }}>
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Samvad Saathi</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Mock interviews and communication</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                    {profile.samvadAverage}<span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>/100</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>average</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(samvad.knowledge).map(([k, v]) => (
                  <ScoreBar key={k} label={`${titleCase(k)} knowledge`} value={v} color="var(--color-accent)" />
                ))}
                {Object.entries(samvad.speech).map(([k, v]) => (
                  <ScoreBar key={k} label={`Spoken ${k}`} value={v} color="var(--color-accent)" />
                ))}
              </div>
              <div style={{ marginTop: '14px' }}>
                <Badge variant="gray">{samvad.interviews_taken} mock interviews taken</Badge>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Project and mentor */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {project && (
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={18} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Assigned Freelance Project</h3>
              </div>
              <Badge variant="green">{project.stage}</Badge>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '16px' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>{project.name}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Client: <strong>{project.client_name}</strong>
              </div>
              <div style={{ marginTop: '12px' }}>
                <ScoreBar label="Tasks completed" value={project.progress} color="var(--color-primary)" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Button variant="outline" size="sm" onClick={() => navigate('/student/project?tab=overview')} style={{ flex: 1 }}>
                View Project
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/student/project?tab=tasks')} style={{ flex: 1 }}>
                View Tasks
              </Button>
            </div>
          </Card>
        )}

        {mentor && (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <User size={18} color="var(--color-primary)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Your Barabari Mentor</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '16px' }}>
              <Avatar name={mentor.name} size={52} tone="orange" />
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800 }}>{mentor.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Mentor for {project.name}</div>
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              Ask the AI mentor first. If it cannot resolve your question, it goes to {mentor.name.split(' ')[0]} with
              the full context, and the reply appears in your chat.
            </p>
          </Card>
        )}
      </div>

      {/* What the AI mentor remembers */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Brain size={18} color="var(--color-primary)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>What the AI mentor remembers about you</h3>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
          Built from your past chats. Your mentor can correct it.
        </p>
        <Markdown>{profile.memory || 'Nothing yet. This fills in as you use the AI mentor.'}</Markdown>
      </Card>
    </div>
  );
};
