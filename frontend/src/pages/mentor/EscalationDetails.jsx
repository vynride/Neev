import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle2, Info, Sparkles } from 'lucide-react';
import { SectionCard, Loading } from '../../components/ui/Bits';
import { Badge } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Markdown } from '../../components/ui/Markdown';
import { TICKETS_CHANGED } from './MentorLayout';
import { mentorDeskService } from '../../services/mentorDeskService';
import { errorMessage } from '../../services/apiClient';
import { categoryLabel, formatDate, formatTime } from '../../services/format';
import { useAuth } from '../../context/AuthContext';

export default function EscalationDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [answer, setAnswer] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    mentorDeskService
      .getTicket(id)
      .then((t) => {
        setTicket(t);
        // Start from the AI's draft, so approving it is one click
        setAnswer(t.final_answer || (t.kind === 'ticket' ? t.draft_answer : ''));
      })
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  const handleResolve = async () => {
    setSending(true);
    setError('');
    try {
      await mentorDeskService.resolve(ticket.id, answer.trim() || 'Noted.');
      window.dispatchEvent(new Event(TICKETS_CHANGED));
      navigate('/mentor/escalations');
    } catch (err) {
      setError(errorMessage(err));
      setSending(false);
    }
  };

  const back = (
    <button onClick={() => navigate('/mentor/escalations')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-text-muted)', width: 'fit-content' }}>
      <ArrowLeft size={15} /> All escalations
    </button>
  );

  if (error && !ticket) return <>{back}<div className="notice-error">{error}</div></>;
  if (!ticket) return <Loading />;

  const isFyi = ticket.kind === 'fyi';
  const canResolve = ticket.status === 'open' && user.role === 'mentor';
  const usingDraft = answer.trim() === (ticket.draft_answer || '').trim();

  return (
    <>
      {back}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.9fr) minmax(300px, 1fr)', gap: '12px', alignItems: 'start' }}>
        {/* Main column: the question and the answer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <Badge variant={isFyi ? 'blue' : ticket.status === 'open' ? 'orange' : 'green'}>
                {isFyi ? 'FYI' : ticket.status === 'open' ? 'Needs your answer' : 'Resolved'}
              </Badge>
              <Badge variant="gray">{categoryLabel(ticket.category)}</Badge>
              <span style={{ fontSize: '0.76rem', color: 'var(--color-text-subtle)' }}>
                {formatDate(ticket.created_at)}, {formatTime(ticket.created_at)}
              </span>
            </div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.45, letterSpacing: '-0.01em', whiteSpace: 'pre-wrap' }}>{ticket.question}</h1>
            {ticket.tried && (
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-subtle)', marginBottom: '6px' }}>
                  {isFyi ? 'Why you are seeing this' : 'What was tried'}
                </div>
                <div style={{ fontSize: '0.86rem', whiteSpace: 'pre-wrap', color: 'var(--color-text-muted)', maxHeight: '200px', overflowY: 'auto' }}>{ticket.tried}</div>
              </div>
            )}
          </div>

          {isFyi && (
            <div style={{ display: 'flex', gap: '10px', padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--color-info-subtle)', fontSize: '0.85rem', color: 'var(--color-info)' }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              The AI mentor already answered the student. Nothing is blocked. This is only so you know.
            </div>
          )}

          {canResolve ? (
            <SectionCard
              title={isFyi ? 'Add a note (optional)' : 'Your answer'}
              hint={isFyi ? undefined : 'It appears in the student’s chat and is saved, so the same question is not escalated again.'}
            >
              {!isFyi && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '8px' }}>
                  <Sparkles size={13} /> {usingDraft ? 'This is the AI’s draft. Approve it, edit it or rewrite it.' : 'Edited from the AI’s draft.'}
                </div>
              )}
              <textarea
                rows={isFyi ? 3 : 12}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', fontSize: '0.9rem', lineHeight: 1.6, resize: 'vertical', outline: 'none' }}
              />
              {error && <div className="notice-error" style={{ marginTop: '10px' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                <Button variant="primary" icon={isFyi ? CheckCircle2 : Send} onClick={handleResolve} disabled={sending || (!isFyi && !answer.trim())}>
                  {sending ? 'Sending…' : isFyi ? 'Mark as seen' : usingDraft ? 'Approve and send' : 'Send answer'}
                </Button>
                {!isFyi && !usingDraft && (
                  <Button variant="outline" onClick={() => setAnswer(ticket.draft_answer)}>Back to the draft</Button>
                )}
              </div>
            </SectionCard>
          ) : (
            ticket.final_answer && (
              <SectionCard title="Answer sent" hint={ticket.resolved_at ? `${formatDate(ticket.resolved_at)}, ${formatTime(ticket.resolved_at)}` : undefined}>
                <Markdown>{ticket.final_answer}</Markdown>
              </SectionCard>
            )
          )}

          <SectionCard title="The student’s chat" hint="Everything said before this reached you">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '520px', overflowY: 'auto', paddingRight: '6px' }}>
              {ticket.chat.map((turn, idx) => (
                turn.role === 'student' ? (
                  <div key={idx} style={{ alignSelf: 'flex-end', maxWidth: '80%', background: 'var(--color-primary)', color: '#FFFFFF', borderRadius: '16px 16px 4px 16px', padding: '9px 14px', fontSize: '0.88rem', whiteSpace: 'pre-wrap' }}>
                    {turn.content}
                  </div>
                ) : (
                  <div key={idx} style={{ maxWidth: '92%' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: turn.role === 'mentor' ? 'var(--color-accent-strong)' : 'var(--color-text-subtle)', marginBottom: '4px' }}>
                      {turn.role === 'mentor' ? 'Mentor' : 'AI mentor'} · {formatTime(turn.created_at)}
                    </div>
                    <Markdown>{turn.content}</Markdown>
                  </div>
                )
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Side rail: who, which project, what the AI looked at */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <SectionCard title="Student">
            <button className="hover-row" onClick={() => navigate(`/mentor/students/${ticket.student.id}`)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px', margin: '-6px', borderRadius: 'var(--radius-md)', textAlign: 'left' }}>
              <Avatar id={ticket.student.id} name={ticket.student.name} size={44} />
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>{ticket.student.name}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--color-primary)', fontWeight: 600 }}>Open profile</div>
              </div>
            </button>
            {ticket.student.memory && (
              <details style={{ marginTop: '14px' }}>
                <summary style={{ fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', color: 'var(--color-text-muted)' }}>What the AI knows about them</summary>
                <div style={{ marginTop: '10px' }}><Markdown>{ticket.student.memory}</Markdown></div>
              </details>
            )}
          </SectionCard>

          <SectionCard title={ticket.project.name} hint="Project summary">
            <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '6px' }}>
              <Markdown>{ticket.project.card || 'No project summary yet.'}</Markdown>
            </div>
          </SectionCard>

          {ticket.excerpts?.length > 0 && (
            <SectionCard title="What the AI looked at" hint="Code, documents and calls it read for this question">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {ticket.excerpts.map((ex, idx) => (
                  <details key={idx} style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)' }}>
                    <summary style={{ fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', overflowWrap: 'anywhere', fontFamily: ex.type === 'code' ? 'var(--font-mono)' : undefined }}>
                      {ex.ref || `Excerpt ${idx + 1}`}
                    </summary>
                    <pre style={{ fontSize: '0.74rem', whiteSpace: 'pre-wrap', marginTop: '8px', overflowWrap: 'anywhere', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{ex.text}</pre>
                  </details>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </>
  );
}
