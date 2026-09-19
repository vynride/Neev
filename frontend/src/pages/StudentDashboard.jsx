import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListChecks, CheckCircle2, AlarmClock, Eye, Sparkles, MessageSquare, PhoneCall, CalendarClock, ArrowRight } from 'lucide-react';
import { PageHeader, StatTile, SectionCard, ProgressBar, TextLink, EmptyState, Loading } from '../components/ui/Bits';
import { Badge } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { studentService } from '../services/studentService';
import { projectService } from '../services/projectService';
import { mentorService } from '../services/mentorService';
import { errorMessage } from '../services/apiClient';
import { formatDate, statusLabel, isOverdue, relativeDay } from '../services/format';
import { useAuth } from '../context/AuthContext';

const daysLeft = (iso) => (iso ? Math.ceil((new Date(`${iso}T00:00:00`) - new Date()) / 86400000) : null);

export const StudentDashboard = () => {
  const { user, projectId } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [project, profile, sessions] = await Promise.all([
          projectService.getProject(projectId),
          studentService.getProfile(user.id),
          mentorService.listSessions(projectId)
        ]);
        setData({ project, profile, sessions });
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    if (projectId) fetchDashboard();
    else setLoading(false);
  }, [projectId, user.id]);

  if (loading) return <Loading />;
  if (error) return <div className="notice-error">{error}</div>;
  if (!data) {
    return <div className="notice-error">You are not assigned to a project yet. Ask your programme coordinator.</div>;
  }

  const { project, profile, sessions } = data;
  const mine = project.tasks.filter((t) => t.assignee_id === user.id);
  const upNext = mine.filter((t) => t.status !== 'done').slice(0, 6);
  const myOverdue = mine.filter(isOverdue).length;
  const lastCall = project.meetings[project.meetings.length - 1];
  const left = daysLeft(project.deadline);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const ask = (prefill) => navigate('/student/mentor', { state: { prefill } });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <PageHeader
        title={`${greeting}, ${user.name.split(' ')[0]}`}
        subtitle={myOverdue ? `You have ${myOverdue} overdue task${myOverdue > 1 ? 's' : ''}. Start there.` : 'You are on track. Keep going.'}
      >
        <Button onClick={() => navigate('/student/mentor')} variant="primary" icon={Sparkles}>Ask the AI mentor</Button>
      </PageHeader>

      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <StatTile icon={ListChecks} label="My open tasks" value={mine.filter((t) => t.status !== 'done').length} hint={`${mine.length} assigned to me`} />
        <StatTile icon={AlarmClock} tone="accent" label="Overdue" value={myOverdue} hint={myOverdue ? 'Needs attention' : 'Nothing late'} />
        <StatTile icon={Eye} label="In review" value={mine.filter((t) => t.status === 'review').length} hint="Waiting on feedback" />
        <StatTile icon={CheckCircle2} label="Project complete" value={`${project.progress}%`} hint={`${project.metrics.completed} of ${project.metrics.total} tasks`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: '18px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Project */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-subtle)' }}>Your project</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', marginTop: '2px' }}>{project.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>for {project.client_name}</p>
              </div>
              <Badge variant="green">{project.stage}</Badge>
            </div>
            <div style={{ margin: '18px 0 8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>{project.metrics.completed} done · {project.metrics.inProgress + project.metrics.inReview} in progress · {project.metrics.pending} to do</span>
              <strong>{project.progress}%</strong>
            </div>
            <ProgressBar value={project.progress} height={8} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: left != null && left < 14 ? 'var(--color-accent-strong)' : 'var(--color-text-muted)' }}>
                <CalendarClock size={14} /> Due {formatDate(project.deadline)}{left != null && left >= 0 ? ` · ${left} days left` : ''}
              </span>
              <TextLink onClick={() => navigate('/student/project?tab=overview')}>Project details</TextLink>
            </div>
          </div>

          {/* Up next */}
          <SectionCard title="Up next for you" hint="Your open tasks, soonest first" action={<TextLink onClick={() => navigate('/student/project?tab=tasks')}>All tasks</TextLink>}>
            {upNext.length === 0 ? (
              <EmptyState icon={CheckCircle2}>No open tasks. Nicely done.</EmptyState>
            ) : (
              <div className="stagger" style={{ display: 'flex', flexDirection: 'column' }}>
                {upNext.map((t) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderTop: '1px solid var(--color-border-subtle)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{t.name}</div>
                      <div style={{ fontSize: '0.74rem', color: isOverdue(t) ? 'var(--color-accent-strong)' : 'var(--color-text-subtle)', fontWeight: isOverdue(t) ? 700 : 400 }}>
                        {isOverdue(t) ? 'Overdue · was due ' : 'Due '}{formatDate(t.due_date)}
                      </div>
                    </div>
                    <Badge variant={t.status === 'to do' ? 'gray' : 'orange'}>{statusLabel(t.status)}</Badge>
                    <button className="hover-row" title="Ask the AI mentor about this task" onClick={() => ask(`Help me with my task "${t.name}". `)} style={{ padding: '6px', borderRadius: 'var(--radius-sm)', color: 'var(--color-primary)' }}>
                      <Sparkles size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <SectionCard title="Pick up where you left off" hint="Your recent chats with the AI mentor">
            {sessions.length === 0 ? (
              <EmptyState icon={MessageSquare}>No chats yet. Ask your first question.</EmptyState>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', margin: '0 -8px' }}>
                {sessions.slice(0, 4).map((s) => (
                  <button key={s.id} className="hover-row" onClick={() => navigate(`/student/mentor?s=${s.id}`)} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px', borderRadius: 'var(--radius-md)', textAlign: 'left' }}>
                    <MessageSquare size={14} color="var(--color-text-subtle)" style={{ flexShrink: 0, marginTop: '4px' }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '0.84rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.first_message || 'Chat'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)' }}>{relativeDay(s.updated_at)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>

          {lastCall && (
            <SectionCard title="Latest client call" hint={`${lastCall.title} · ${formatDate(lastCall.started_at)}`} action={<PhoneCall size={15} color="var(--color-text-subtle)" />}>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {lastCall.summary || 'No summary yet.'}
              </p>
              <button onClick={() => navigate('/student/project?tab=calls')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '10px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)', width: 'fit-content' }}>
                All calls <ArrowRight size={13} />
              </button>
            </SectionCard>
          )}

          <SectionCard title="Your strengths and focus areas" hint="From CodeGuru and Samvad Saathi" action={<TextLink onClick={() => navigate('/student/profile')}>Scores</TextLink>}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {profile.strengths.map((s) => <Badge key={s} variant="green">{s}</Badge>)}
              {profile.focusAreas.map((s) => <Badge key={s} variant="orange">{s}</Badge>)}
              {profile.strengths.length + profile.focusAreas.length === 0 && (
                <span style={{ fontSize: '0.84rem', color: 'var(--color-text-subtle)' }}>No scores yet.</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '14px', marginTop: '12px', fontSize: '0.72rem', color: 'var(--color-text-subtle)' }}>
              <span>● <span style={{ color: 'var(--color-primary)' }}>Strong</span></span>
              <span>● <span style={{ color: 'var(--color-accent-strong)' }}>Worth practising</span></span>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};
