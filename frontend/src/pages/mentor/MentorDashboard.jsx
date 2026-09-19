import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LifeBuoy, GraduationCap, Timer, Inbox, CalendarClock, ChevronRight, Info } from 'lucide-react';
import { PageHeader, StatTile, SectionCard, ProgressBar, TextLink, EmptyState, Loading } from '../../components/ui/Bits';
import { Badge } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { TicketRow } from '../../components/mentor/TicketRow';
import { mentorDeskService } from '../../services/mentorDeskService';
import { errorMessage } from '../../services/apiClient';
import { waitingFor } from '../../services/format';
import { useAuth } from '../../context/AuthContext';

const daysLeft = (iso) => (iso ? Math.ceil((new Date(`${iso}T00:00:00`) - new Date()) / 86400000) : null);

export default function MentorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      mentorDeskService.getMetrics(),
      mentorDeskService.listTickets('open'),
      mentorDeskService.listProjects(),
      mentorDeskService.listStudents()
    ])
      .then(([metrics, tickets, projects, students]) => setData({ metrics, tickets, projects, students }))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <div className="notice-error">{error}</div>;
  if (!data) return <Loading />;

  const { metrics, tickets, projects, students } = data;
  const waiting = tickets.filter((t) => t.kind === 'ticket');
  const fyis = tickets.filter((t) => t.kind === 'fyi');
  const deflection = metrics.deflection_rate == null ? '–' : `${Math.round(metrics.deflection_rate * 100)}%`;
  // Students who most likely need a human: open tickets first, then overdue work, then repeated struggles
  const attention = [...students]
    .map((s) => ({ ...s, weight: s.open_tickets * 5 + s.tasks.overdue * 2 + s.struggles.reduce((n, x) => n + x.count, 0) }))
    .filter((s) => s.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);

  const subtitle = waiting.length
    ? `${waiting.length} student${waiting.length > 1 ? 's are' : ' is'} waiting for your answer. Each one has a draft ready.`
    : 'Nobody is waiting on you. The AI mentor is handling the rest.';

  return (
    <>
      <PageHeader title={`Hello, ${user.name.split(' ')[0]}`} subtitle={subtitle} />

      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }}>
        <StatTile
          icon={LifeBuoy}
          tone={waiting.length ? 'accent' : 'primary'}
          label="Waiting for you"
          value={waiting.length}
          hint={waiting.length ? `Oldest has waited ${waitingFor(waiting[waiting.length - 1].created_at)}` : 'All caught up'}
          onClick={() => navigate('/mentor/escalations')}
        />
        <StatTile
          icon={ShieldCheck}
          label="Handled without you"
          value={deflection}
          hint={metrics.questions ? `${metrics.questions - metrics.escalated} of ${metrics.questions} questions` : 'No questions asked yet'}
        />
        <StatTile
          icon={GraduationCap}
          label="Your past answers reused"
          value={metrics.answered_from_kb}
          hint={`${metrics.redirected_to_client} more sent to the client`}
        />
        <StatTile
          icon={Timer}
          label="Your time per ticket"
          value={metrics.mentor_minutes_per_ticket == null ? '–' : `${metrics.mentor_minutes_per_ticket} min`}
          hint={metrics.tickets_resolved ? `${metrics.tickets_resolved} resolved so far` : 'Shows after your first answer'}
        />
      </div>

      {/* Cards in the same row share one height, so the bottoms line up */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '16px', alignItems: 'stretch' }}>
        <SectionCard
          flush
          title="Waiting for you"
          hint="Each one comes with the chat, the project context and a draft answer"
          action={<TextLink onClick={() => navigate('/mentor/escalations')}>See all</TextLink>}
        >
          {waiting.length === 0 ? (
            <EmptyState icon={Inbox}>All caught up. New escalations appear here as they come in.</EmptyState>
          ) : (
            <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {waiting.slice(0, 5).map((t) => <TicketRow key={t.id} ticket={t} compact />)}
            </div>
          )}
        </SectionCard>

        <SectionCard
          flush
          title="Students who may need you"
          hint="Open tickets, late tasks, repeated struggles"
          action={<TextLink onClick={() => navigate('/mentor/students')}>All students</TextLink>}
        >
          {attention.length === 0 ? (
            <EmptyState icon={ShieldCheck}>Nobody stands out right now.</EmptyState>
          ) : (
            <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {attention.map((s) => (
                <button key={s.id} className="hover-row" onClick={() => navigate(`/mentor/students/${s.id}`)} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '8px 12px', borderRadius: 'var(--radius-md)', textAlign: 'left' }}>
                  <Avatar id={s.id} name={s.name} size={36} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {[
                        s.open_tickets && `${s.open_tickets} open ticket${s.open_tickets > 1 ? 's' : ''}`,
                        s.tasks.overdue && `${s.tasks.overdue} late task${s.tasks.overdue > 1 ? 's' : ''}`,
                        s.struggles[0] && `keeps asking about ${s.struggles[0].topic}`
                      ].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <ChevronRight size={15} color="var(--color-text-subtle)" style={{ flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '16px', alignItems: 'stretch' }}>
        <SectionCard title="Your projects" hint="Task progress comes live from ClickUp">
          <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {projects.map((p) => {
              const left = daysLeft(p.deadline);
              return (
                <div key={p.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--color-text-subtle)' }}>{p.client_name}</div>
                    </div>
                    <div style={{ display: 'flex' }}>
                      {p.students.map((st, i) => (
                        <button key={st.id} title={st.name} onClick={() => navigate(`/mentor/students/${st.id}`)} style={{ marginLeft: i ? '-8px' : 0, borderRadius: '50%' }}>
                          <Avatar id={st.id} name={st.name} size={28} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{p.tasks.done} of {p.tasks.total} tasks done</span>
                      <strong>{p.tasks.progress}%</strong>
                    </div>
                    <ProgressBar value={p.tasks.progress} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: 'auto' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: left != null && left < 14 ? 'var(--color-accent-strong)' : 'var(--color-text-subtle)' }}>
                      <CalendarClock size={13} /> {left == null ? 'No deadline' : left >= 0 ? `${left} days left` : `${-left} days late`}
                    </span>
                    <span style={{ display: 'flex', gap: '6px' }}>
                      {p.tasks.overdue > 0 && <Badge variant="orange">{p.tasks.overdue} late</Badge>}
                      {p.open_tickets > 0 && <Badge variant="orange">{p.open_tickets} waiting</Badge>}
                      {p.tasks.overdue === 0 && p.open_tickets === 0 && <Badge variant="green">On track</Badge>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard flush title="Good to know" hint="Sensitive topics the AI already answered. No reply needed.">
          {fyis.length === 0 ? (
            <EmptyState icon={Info}>Nothing to flag.</EmptyState>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {fyis.slice(0, 4).map((t) => <TicketRow key={t.id} ticket={t} compact />)}
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
}
