import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Inbox, CheckCircle2, Info, Send, RefreshCw } from 'lucide-react';
import { Card, Badge } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Markdown } from '../components/ui/Markdown';
import { Avatar } from '../components/ui/Avatar';
import { mentorDeskService } from '../services/mentorDeskService';
import { errorMessage } from '../services/apiClient';
import { categoryLabel, formatDate, formatTime } from '../services/format';
import { useAuth } from '../context/AuthContext';

const POLL_MS = 15000;

const Metric = ({ label, value, hint }) => (
  <Card style={{ padding: '14px 18px' }}>
    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{value}</div>
    <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{label}</div>
    {hint && <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{hint}</div>}
  </Card>
);

const Section = ({ title, children }) => (
  <div>
    <div style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
      {title}
    </div>
    {children}
  </div>
);

export const MentorDesk = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('open');
  const [tickets, setTickets] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [answer, setAnswer] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [list, m] = await Promise.all([mentorDeskService.listTickets(status), mentorDeskService.getMetrics()]);
      setTickets(list);
      setMetrics(m);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [status]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const openTicket = async (id) => {
    setSelectedId(id);
    setTicket(null);
    setError('');
    try {
      const t = await mentorDeskService.getTicket(id);
      setTicket(t);
      // Start from the AI's draft so approving it is one click
      setAnswer(t.final_answer || (t.kind === 'ticket' ? t.draft_answer : ''));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const handleResolve = async () => {
    setSending(true);
    setError('');
    try {
      await mentorDeskService.resolve(ticket.id, answer.trim() || 'Noted.');
      setSelectedId(null);
      setTicket(null);
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const isFyi = ticket?.kind === 'fyi';
  const canResolve = ticket && ticket.status === 'open' && user.role === 'mentor';
  const deflection = metrics?.deflection_rate;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      {/* Top bar */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px', background: '#FFFFFF', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.svg" alt="Barabari" style={{ width: '34px', height: '34px' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-primary)' }}>Mentor Desk</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Only what the AI mentor could not resolve reaches you</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar name={user.name} size={32} tone="orange" />
          <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>{user.name}</span>
          <Button variant="outline" size="sm" icon={LogOut} onClick={() => { logout(); navigate('/login'); }}>
            Sign Out
          </Button>
        </div>
      </header>

      <main style={{ padding: '24px 28px', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {error && <div className="notice-error">{error}</div>}

        {/* Mentor load metrics */}
        {metrics && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
            <Metric label="Handled without a mentor" value={deflection == null ? '–' : `${Math.round(deflection * 100)}%`} hint={`${metrics.questions} questions, ${metrics.escalated} escalated`} />
            <Metric label="Answered from past mentor answers" value={metrics.answered_from_kb} hint="Knowledge base reuse" />
            <Metric label="Redirected to the client" value={metrics.redirected_to_client} hint="Not a mentor question" />
            <Metric label="Tickets resolved" value={metrics.tickets_resolved} hint={metrics.mentor_minutes_per_ticket == null ? 'No timing yet' : `${metrics.mentor_minutes_per_ticket} min per ticket`} />
            <Metric label="FYIs" value={metrics.fyis} hint="Sensitive topics, no action needed" />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(0, 2.2fr)', gap: '20px', alignItems: 'start' }}>
          {/* Ticket list */}
          <Card style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-subtle)', padding: '4px', borderRadius: 'var(--radius-full)' }}>
                {['open', 'resolved'].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStatus(s); setSelectedId(null); setTicket(null); }}
                    style={{
                      padding: '5px 14px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.8rem',
                      fontWeight: status === s ? 700 : 500,
                      background: status === s ? 'var(--color-primary)' : 'transparent',
                      color: status === s ? '#FFFFFF' : 'var(--color-text-muted)',
                      textTransform: 'capitalize'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button onClick={refresh} title="Refresh" style={{ padding: '6px', color: 'var(--color-text-muted)' }}>
                <RefreshCw size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tickets.length === 0 && (
                <div style={{ padding: '28px 12px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.86rem' }}>
                  <Inbox size={26} style={{ marginBottom: '6px' }} />
                  <div>{status === 'open' ? 'Nothing waiting for you.' : 'No resolved tickets yet.'}</div>
                </div>
              )}
              {tickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openTicket(t.id)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${selectedId === t.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: selectedId === t.id ? '#F0FDF4' : '#FFFFFF'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>{t.student_name}</span>
                    <Badge variant={t.kind === 'fyi' ? 'blue' : 'orange'}>{t.kind === 'fyi' ? 'FYI' : 'Needs answer'}</Badge>
                  </div>
                  <div style={{ fontSize: '0.84rem', lineHeight: 1.4 }}>{t.question.slice(0, 110)}{t.question.length > 110 ? '…' : ''}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                    {t.project_name} · {categoryLabel(t.category)} · {formatDate(t.created_at)} {formatTime(t.created_at)}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Ticket detail */}
          <Card>
            {!selectedId && (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Choose a ticket to see the question, the project context and the AI's draft answer.
              </div>
            )}
            {selectedId && !ticket && !error && <div style={{ color: 'var(--color-text-muted)' }}>Loading ticket...</div>}
            {ticket && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <Badge variant={isFyi ? 'blue' : 'orange'}>{isFyi ? 'FYI: no answer needed' : 'Needs your answer'}</Badge>
                    <Badge variant="green">{categoryLabel(ticket.category)}</Badge>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      {ticket.student.name} · {ticket.project.name}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{ticket.question}</h2>
                </div>

                {isFyi && (
                  <div style={{ display: 'flex', gap: '10px', padding: '12px 14px', borderRadius: 'var(--radius-md)', background: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: '0.84rem', color: '#1E3A8A' }}>
                    <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>The AI mentor already answered the student. This is here because the topic is sensitive: {ticket.tried}</span>
                  </div>
                )}

                {!isFyi && (
                  <Section title="What was tried">
                    <div style={{ fontSize: '0.86rem', whiteSpace: 'pre-wrap', color: 'var(--color-text-main)', maxHeight: '220px', overflowY: 'auto', padding: '12px 14px', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      {ticket.tried}
                    </div>
                  </Section>
                )}

                {/* The answer box */}
                {canResolve ? (
                  <Section title={isFyi ? 'Note (optional)' : "Your answer (starts from the AI's draft: approve, edit or rewrite)"}>
                    <textarea
                      rows={isFyi ? 2 : 10}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', fontSize: '0.88rem', lineHeight: 1.55, resize: 'vertical', outline: 'none' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
                      <Button variant="primary" icon={isFyi ? CheckCircle2 : Send} onClick={handleResolve} disabled={sending || (!isFyi && !answer.trim())}>
                        {sending ? 'Sending...' : isFyi ? 'Mark as seen' : 'Send answer to student'}
                      </Button>
                      {!isFyi && (
                        <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                          The answer appears in the student's chat and is saved so the same question is not escalated again.
                        </span>
                      )}
                    </div>
                  </Section>
                ) : (
                  ticket.final_answer && (
                    <Section title="Answer sent">
                      <div style={{ padding: '12px 14px', background: '#F0FDF4', borderRadius: 'var(--radius-md)', border: '1px solid #BBF7D0' }}>
                        <Markdown>{ticket.final_answer}</Markdown>
                      </div>
                    </Section>
                  )
                )}

                {ticket.excerpts?.length > 0 && (
                  <Section title="What the AI looked at">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {ticket.excerpts.map((ex, idx) => (
                        <details key={idx} style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: '#F8FAFC' }}>
                          <summary style={{ fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', overflowWrap: 'anywhere' }}>
                            {ex.ref || ex.source || ex.type || `Excerpt ${idx + 1}`}
                          </summary>
                          <pre style={{ fontSize: '0.76rem', whiteSpace: 'pre-wrap', marginTop: '8px', overflowWrap: 'anywhere' }}>
                            {ex.text || ex.snippet || ex.content || JSON.stringify(ex, null, 2)}
                          </pre>
                        </details>
                      ))}
                    </div>
                  </Section>
                )}

                <Section title="The student's chat">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
                    {ticket.chat.map((turn, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          background: turn.role === 'student' ? '#F0FDF4' : turn.role === 'mentor' ? '#FFF7ED' : '#FFFFFF',
                          border: '1px solid var(--color-border)'
                        }}
                      >
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                          {turn.role === 'assistant' ? 'AI mentor' : turn.role} · {formatTime(turn.created_at)}
                        </div>
                        <Markdown>{turn.content}</Markdown>
                      </div>
                    ))}
                  </div>
                </Section>

                <details>
                  <summary style={{ fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer', color: 'var(--color-primary)' }}>
                    Project summary and what the AI knows about {ticket.student.name.split(' ')[0]}
                  </summary>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginTop: '12px' }}>
                    <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      <Markdown>{ticket.project.card || 'No project summary yet.'}</Markdown>
                    </div>
                    <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      <Markdown>{ticket.student.memory || 'No notes on this student yet.'}</Markdown>
                    </div>
                  </div>
                </details>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};
