import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListChecks, CheckCircle2, AlarmClock, Eye, Sparkles, MessageSquare, PhoneCall, CalendarClock } from 'lucide-react';
import { PageHeader, StatTile, SectionCard, ProgressBar, TextLink, EmptyState, Loading } from '../components/ui/Bits';
import { Badge } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { studentService } from '../services/studentService';
import { projectService } from '../services/projectService';
import { mentorService } from '../services/mentorService';
import { errorMessage } from '../services/apiClient';
import { formatDate, statusLabel, isOverdue, relativeDay, dueLabel } from '../services/format';
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

  const openCount = mine.filter((t) => t.status !== 'done').length;
  const subtitle = myOverdue
    ? `${myOverdue} of your tasks ${myOverdue > 1 ? 'are' : 'is'} past the due date. Start there, and ask if you are stuck.`
    : openCount
      ? `You have ${openCount} task${openCount > 1 ? 's' : ''} in hand and nothing is late.`
      : 'You have no open tasks right now.';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader title={`${greeting}, ${user.name.split(' ')[0]}`} subtitle={subtitle}>
        <Button onClick={() => navigate('/student/mentor')} variant="primary" icon={Sparkles}>Ask the AI mentor</Button>
      </PageHeader>

      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }}>
        <StatTile icon={ListChecks} label="My open tasks" value={openCount} hint={`${mine.length} assigned to you in total`} onClick={() => navigate('/student/project?tab=tasks')} />
        <StatTile icon={AlarmClock} tone={myOverdue ? 'accent' : 'primary'} label="Past the due date" value={myOverdue} hint={myOverdue ? 'Worth doing first' : 'Nothing is late'} onClick={() => navigate('/student/project?tab=tasks')} />
        <StatTile icon={Eye} label="Waiting for review" value={mine.filter((t) => t.status === 'review').length} hint="Finished, not yet checked" />
        <StatTile icon={CheckCircle2} label="Whole project" value={`${project.progress}%`} hint={`${project.metrics.completed} of ${project.metrics.total} tasks done`} onClick={() => navigate('/student/project?tab=overview')} />
      </div>

      {/* Row 1: what to do next, beside the project. Cards in a row share one height. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '16px', alignItems: 'stretch' }}>
        <SectionCard
          flush
          title="What to do next"
          hint="Your open tasks, soonest first"
          action={<TextLink onClick={() => navigate('/student/project?tab=tasks')}>All tasks</TextLink>}
        >
          {upNext.length === 0 ? (
            <EmptyState icon={CheckCircle2}>You have no open tasks. Well done.</EmptyState>
          ) : (
            <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {upNext.map((t) => (
                <div key={t.id} className="hover-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: isOverdue(t) ? 'var(--color-accent)' : t.status === 'to do' ? 'var(--color-border-strong)' : 'var(--color-primary)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                    <div style={{ fontSize: '0.76rem', color: isOverdue(t) ? 'var(--color-accent-strong)' : 'var(--color-text-subtle)', fontWeight: isOverdue(t) ? 600 : 400 }}>
                      {dueLabel(t.due_date)} · {statusLabel(t.status)}
                    </div>
                  </div>
                  <button
                    onClick={() => ask(`Help me with my task "${t.name}". `)}
                    className="btn-outline"
                    style={{ padding: '5px 12px', fontSize: '0.76rem', flexShrink: 0 }}
                  >
                    <Sparkles size={13} /> Get help
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title={project.name} hint={`For ${project.client_name}`} action={<Badge variant="green">{project.stage}</Badge>}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>{project.progress}%</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>complete</span>
          </div>
          <div style={{ margin: '12px 0 14px' }}><ProgressBar value={project.progress} height={8} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
            {[
              ['Done', project.metrics.completed],
              ['In progress', project.metrics.inProgress + project.metrics.inReview],
              ['To do', project.metrics.pending]
            ].map(([label, value]) => (
              <div key={label} style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '8px 4px' }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>{value}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)' }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: left != null && left < 14 ? 'var(--color-accent-strong)' : 'var(--color-text-muted)' }}>
              <CalendarClock size={14} /> {left != null && left >= 0 ? `${left} days to the deadline` : `Deadline ${formatDate(project.deadline)}`}
            </span>
            <TextLink onClick={() => navigate('/student/project?tab=overview')}>Details</TextLink>
          </div>
        </SectionCard>
      </div>

      {/* Row 2: three equal cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px', alignItems: 'stretch' }}>
        <SectionCard flush title="Pick up where you left off" hint="Your recent chats with the AI mentor">
          {sessions.length === 0 ? (
            <EmptyState icon={MessageSquare}>No chats yet. Ask your first question, however small.</EmptyState>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {sessions.slice(0, 4).map((s) => (
                <button key={s.id} className="hover-row" onClick={() => navigate(`/student/mentor?s=${s.id}`)} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px 12px', borderRadius: 'var(--radius-md)', textAlign: 'left' }}>
                  <MessageSquare size={14} color="var(--color-text-subtle)" style={{ flexShrink: 0, marginTop: '4px' }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.first_message || 'Chat'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)' }}>{relativeDay(s.updated_at)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Latest client call"
          hint={lastCall ? `${lastCall.title} · ${formatDate(lastCall.started_at)}` : 'Nothing recorded yet'}
          action={<TextLink onClick={() => navigate('/student/project?tab=calls')}>All calls</TextLink>}
        >
          {lastCall ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {lastCall.summary || 'No summary yet.'}
            </p>
          ) : (
            <EmptyState icon={PhoneCall}>Summaries of your client calls will appear here.</EmptyState>
          )}
        </SectionCard>

        <SectionCard title="Your strengths" hint="From CodeGuru and Samvad Saathi" action={<TextLink onClick={() => navigate('/student/profile')}>All scores</TextLink>}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {profile.strengths.map((s) => <Badge key={s} variant="green">{s}</Badge>)}
            {profile.strengths.length === 0 && <span style={{ fontSize: '0.84rem', color: 'var(--color-text-subtle)' }}>Your scores will show here.</span>}
          </div>
          {profile.focusAreas.length > 0 && (
            <>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', margin: '16px 0 8px' }}>Worth practising. The AI mentor explains these step by step.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {profile.focusAreas.map((s) => <Badge key={s} variant="orange">{s}</Badge>)}
              </div>
            </>
          )}
        </SectionCard>
      </div>
    </div>
  );
};
