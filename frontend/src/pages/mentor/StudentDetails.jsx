import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Save, X, MessageSquare, MessagesSquare, LifeBuoy, GraduationCap, ListChecks } from 'lucide-react';
import { SectionCard, StatTile, ProgressBar, EmptyState, Loading } from '../../components/ui/Bits';
import { Badge } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Markdown } from '../../components/ui/Markdown';
import { TicketRow } from '../../components/mentor/TicketRow';
import { mentorDeskService } from '../../services/mentorDeskService';
import { errorMessage } from '../../services/apiClient';
import { formatDate, formatTime, relativeDay, statusLabel, titleCase, isOverdue } from '../../services/format';
import { useAuth } from '../../context/AuthContext';

const ScoreRow = ({ label, value, tone }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <strong>{value}</strong>
    </div>
    <ProgressBar value={value} tone={tone} />
  </div>
);

// A past chat, read-only, with the tools the AI used
const TranscriptModal = ({ sessionId, onClose }) => {
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    mentorDeskService.getSession(sessionId).then(setSession).catch((err) => setError(errorMessage(err)));
  }, [sessionId]);

  return (
    <div className="fade-enter" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(27, 31, 29, 0.5)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="modal-enter" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '860px', maxHeight: '86vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>Chat transcript</h3>
          <button className="hover-row" onClick={onClose} style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div className="notice-error">{error}</div>}
          {!session && !error && <Loading />}
          {session?.turns.map((turn) => (
            turn.role === 'student' ? (
              <div key={turn.id} style={{ alignSelf: 'flex-end', maxWidth: '80%', background: 'var(--color-primary)', color: '#FFFFFF', borderRadius: '16px 16px 4px 16px', padding: '9px 14px', fontSize: '0.88rem', whiteSpace: 'pre-wrap' }}>
                {turn.content}
              </div>
            ) : (
              <div key={turn.id}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: turn.role === 'mentor' ? 'var(--color-accent-strong)' : 'var(--color-text-subtle)', marginBottom: '4px' }}>
                  {turn.role === 'mentor' ? turn.mentor_name || 'Mentor' : 'AI mentor'} · {formatTime(turn.created_at)}
                  {turn.tool_calls?.length > 0 && ` · used ${[...new Set(turn.tool_calls.map((c) => c.name || c.tool))].filter(Boolean).join(', ')}`}
                </div>
                <Markdown>{turn.content}</Markdown>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default function StudentDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [openSession, setOpenSession] = useState(null);

  useEffect(() => {
    mentorDeskService.getStudent(id).then(setStudent).catch((err) => setError(errorMessage(err)));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await mentorDeskService.saveStudentMemory(id, draft);
      setStudent((prev) => ({ ...prev, memory: draft, memory_edited_by: user.id }));
      setEditing(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const back = (
    <button onClick={() => navigate('/mentor/students')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-text-muted)', width: 'fit-content' }}>
      <ArrowLeft size={15} /> All students
    </button>
  );

  if (error && !student) return <>{back}<div className="notice-error">{error}</div></>;
  if (!student) return <Loading />;

  const codeguru = student.scores?.codeguru;
  const samvad = student.scores?.samvad_saathi;
  const selfServed = student.questions ? Math.round(100 * (1 - student.escalated / student.questions)) : null;

  return (
    <>
      {back}

      <div className="card" style={{ padding: '22px 26px', display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
        <Avatar id={student.id} name={student.name} size={72} />
        <div style={{ flex: 1, minWidth: '220px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{student.name}</h1>
          <div style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)' }}>{student.email}</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
            {student.projects.map((p) => <Badge key={p.id} variant="green">{p.name}</Badge>)}
            {codeguru && <Badge variant="gray">Attendance {codeguru.attendance_pct}%</Badge>}
          </div>
        </div>
      </div>

      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <StatTile icon={MessagesSquare} label="Questions to the AI mentor" value={student.questions} />
        <StatTile icon={LifeBuoy} tone="accent" label="Escalated to you" value={student.escalated} hint={selfServed == null ? undefined : `${selfServed}% resolved without you`} />
        <StatTile icon={GraduationCap} label="Answered from past mentor answers" value={student.answered_from_kb} />
        <StatTile icon={ListChecks} label="Tasks done" value={`${student.projects.reduce((n, p) => n + p.counts.done, 0)}/${student.projects.reduce((n, p) => n + p.counts.total, 0)}`} hint={`${student.projects.reduce((n, p) => n + p.counts.overdue, 0)} overdue`} />
      </div>

      {error && <div className="notice-error">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '18px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <SectionCard
            title="What the AI mentor believes about this student"
            hint={student.memory_edited_by ? 'Last corrected by a mentor' : 'Built from their chats. Correct it if it is wrong: the AI reads this before every answer.'}
            action={!editing && user.role === 'mentor' && (
              <Button variant="outline" size="sm" icon={Pencil} onClick={() => { setDraft(student.memory); setEditing(true); }}>Edit</Button>
            )}
          >
            {editing ? (
              <>
                <textarea rows={14} value={draft} onChange={(e) => setDraft(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', fontSize: '0.84rem', lineHeight: 1.6, fontFamily: 'var(--font-mono)', resize: 'vertical', outline: 'none' }} />
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <Button variant="primary" size="sm" icon={Save} onClick={handleSave} disabled={saving || !draft.trim()}>{saving ? 'Saving…' : 'Save'}</Button>
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </>
            ) : (
              <Markdown>{student.memory || 'Nothing yet. This fills in as the student uses the AI mentor.'}</Markdown>
            )}
          </SectionCard>

          {student.projects.map((p) => (
            <SectionCard key={p.id} title={`Tasks on ${p.name}`} hint={`${p.counts.done} of ${p.counts.total} done · live from ClickUp`}>
              <div style={{ marginBottom: '12px' }}><ProgressBar value={p.counts.progress} /></div>
              {p.tasks.length === 0 && <EmptyState>No tasks assigned.</EmptyState>}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {p.tasks.map((t) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 0', borderTop: '1px solid var(--color-border-subtle)' }}>
                    <div style={{ flex: 1, minWidth: 0, fontSize: '0.86rem', fontWeight: 500, color: t.status === 'done' ? 'var(--color-text-subtle)' : undefined, textDecoration: t.status === 'done' ? 'line-through' : undefined }}>{t.name}</div>
                    <span style={{ fontSize: '0.74rem', color: isOverdue(t) ? 'var(--color-accent-strong)' : 'var(--color-text-subtle)', fontWeight: isOverdue(t) ? 700 : 400, whiteSpace: 'nowrap' }}>
                      {isOverdue(t) ? 'Overdue · ' : ''}{formatDate(t.due_date)}
                    </span>
                    <Badge variant={t.status === 'done' ? 'green' : t.status === 'to do' ? 'gray' : 'orange'}>{statusLabel(t.status)}</Badge>
                  </div>
                ))}
              </div>
            </SectionCard>
          ))}

          <SectionCard flush title="Tickets" hint="Everything from this student that reached a mentor">
            {student.tickets.length === 0 ? <EmptyState icon={LifeBuoy}>Nothing has been escalated.</EmptyState> : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {student.tickets.map((t) => <TicketRow key={t.id} ticket={{ ...t, student_name: student.name }} compact />)}
              </div>
            )}
          </SectionCard>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {codeguru && (
            <SectionCard title="CodeGuru" hint={`Monthly average ${codeguru.monthly_avg} · capstone ${codeguru.capstone}`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(codeguru.domains).map(([k, v]) => <ScoreRow key={k} label={titleCase(k)} value={v} />)}
              </div>
            </SectionCard>
          )}
          {samvad && (
            <SectionCard title="Samvad Saathi" hint={`${samvad.interviews_taken} mock interviews taken`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(samvad.knowledge).map(([k, v]) => <ScoreRow key={k} label={`${titleCase(k)} knowledge`} value={v} tone="accent" />)}
                {Object.entries(samvad.speech).map(([k, v]) => <ScoreRow key={k} label={`Spoken ${k}`} value={v} tone="accent" />)}
              </div>
            </SectionCard>
          )}

          {student.struggles.length > 0 && (
            <SectionCard title="Recurring struggles" hint="Topics the student keeps coming back to">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {student.struggles.map((s) => (
                  <div key={s.topic} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '0.86rem' }}>
                    <span>{s.topic}</span>
                    <Badge variant="gray">{s.count}×</Badge>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          <SectionCard title="Recent chats with the AI mentor" hint="Open one to read the full transcript">
            {student.sessions.length === 0 ? <EmptyState icon={MessageSquare}>No chats yet.</EmptyState> : (
              <div style={{ display: 'flex', flexDirection: 'column', margin: '0 -12px' }}>
                {student.sessions.map((s) => (
                  <button key={s.id} className="hover-row" onClick={() => setOpenSession(s.id)} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px', borderRadius: 'var(--radius-md)', textAlign: 'left' }}>
                    <MessageSquare size={14} color="var(--color-text-subtle)" style={{ flexShrink: 0, marginTop: '4px' }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.84rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.first_message || 'Chat'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)' }}>{relativeDay(s.updated_at)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {openSession && <TranscriptModal sessionId={openSession} onClose={() => setOpenSession(null)} />}
    </>
  );
}
