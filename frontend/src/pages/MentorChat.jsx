import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { ArrowUp, LifeBuoy } from 'lucide-react';
import { EscalationModal } from '../components/escalation/EscalationModal';
import { AiMessage } from '../components/chat/AiMessage';
import { Thinking } from '../components/chat/Thinking';
import { Markdown } from '../components/ui/Markdown';
import { Avatar } from '../components/ui/Avatar';
import { SESSIONS_CHANGED } from '../components/layout/StudentLayout';
import { mentorService } from '../services/mentorService';
import { projectService } from '../services/projectService';
import { errorMessage } from '../services/apiClient';
import { formatTime } from '../services/format';
import { useAuth } from '../context/AuthContext';

const POLL_MS = 8000;

const STARTERS = [
  { title: 'My week', text: 'What is pending for me this week, and what is overdue?' },
  { title: 'The codebase', text: 'Explain how the main parts of this codebase fit together, with a diagram.' },
  { title: 'A tricky client', text: 'The client asked for something outside the agreed scope. How do I respond?' }
];

// A turn from the session log -> a chat message
const fromTurn = (t) => ({
  id: t.id,
  message_id: t.id,
  sender: t.role === 'assistant' ? 'ai' : t.role,
  timestamp: formatTime(t.created_at),
  content: t.content,
  mentor_name: t.mentor_name,
  category: t.category,
  next_action: t.next_action,
  citations: t.citations,
  resources: t.resources,
  draft_client_message: t.draft_client_message,
  ticket_id: t.ticket_id,
  attempt: t.attempt,
  resolved: t.resolved
});

// A reply from POST /api/chat or the feedback endpoint -> a chat message
const fromReply = (r) => ({
  ...r,
  id: r.message_id,
  sender: 'ai',
  timestamp: formatTime(),
  content: r.message,
  resolved: null
});

export const MentorChat = () => {
  const { user, projectId } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  // The open chat lives in the URL (?s=), so the sidebar, reload and back button all agree
  const sessionId = searchParams.get('s');
  const heldSession = useRef(null);
  const [messages, setMessages] = useState([]);
  const [project, setProject] = useState(null);
  const [inputText, setInputText] = useState(location.state?.prefill || '');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingIn, setPendingIn] = useState(null);
  const [feedbackBusyId, setFeedbackBusyId] = useState(null);
  const [error, setError] = useState('');
  const [escalationOpen, setEscalationOpen] = useState(false);
  const scrollRef = useRef(null);
  // A reply can arrive after the student has moved to another page. Nothing may navigate then.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const inputRef = useRef(null);

  const loadSession = useCallback(async (id) => {
    const session = await mentorService.getSession(id);
    setMessages(session.turns.map(fromTurn));
  }, []);

  // Tasks, calls and the repo link give the sources readable names; the team gives the mentor's name
  useEffect(() => {
    projectService.getProject(projectId).then(setProject).catch(() => {});
  }, [projectId]);

  useEffect(() => {
    if (sessionId === heldSession.current) return;
    heldSession.current = sessionId;
    setError('');
    if (!sessionId) {
      setMessages([]);
      inputRef.current?.focus();
      return;
    }
    setMessages([]);
    loadSession(sessionId).catch((err) => setError(errorMessage(err)));
  }, [sessionId, loadSession]);

  // Scroll the conversation itself, never the page around it
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping, feedbackBusyId]);

  // While a ticket is waiting on the mentor, check the session for their reply
  const answeredTickets = new Set(messages.filter((m) => m.sender === 'mentor').map((m) => m.ticket_id));
  const waitingOnMentor = messages.some((m) => m.next_action === 'escalated' && !answeredTickets.has(m.ticket_id));
  useEffect(() => {
    if (!waitingOnMentor || !sessionId) return undefined;
    const timer = setInterval(() => {
      if (!isTyping && !feedbackBusyId) loadSession(sessionId).catch(() => {});
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [waitingOnMentor, sessionId, isTyping, feedbackBusyId, loadSession]);

  const handleSendMessage = async (textToSend) => {
    const query = (typeof textToSend === 'string' ? textToSend : inputText).trim();
    if (!query || isTyping) return;

    setMessages((prev) => [...prev, { id: `local_${Date.now()}`, sender: 'student', timestamp: formatTime(), content: query }]);
    setInputText('');
    setError('');
    setIsTyping(true);
    // The chat this question belongs to. If the student opens another chat while waiting,
    // the reply must not land in that one.
    const askedIn = sessionId;
    setPendingIn(askedIn);

    try {
      const reply = await mentorService.ask(projectId, query, sessionId);
      const stillHere = mounted.current && heldSession.current === askedIn;
      if (reply.session_id !== sessionId) {
        window.dispatchEvent(new Event(SESSIONS_CHANGED));
        // Changing the URL from a page the student has left would pull them back to the chat
        if (!stillHere) return;
        heldSession.current = reply.session_id;
        setSearchParams({ s: reply.session_id }, { replace: true });
      }
      if (!stillHere) return;
      setMessages((prev) => [...prev, fromReply(reply)]);
    } catch (err) {
      if (mounted.current && heldSession.current === askedIn) setError(errorMessage(err));
    } finally {
      setIsTyping(false);
    }
  };

  const handleFeedback = async (msg, resolved) => {
    setFeedbackBusyId(msg.id);
    setError('');
    try {
      const reply = await mentorService.sendFeedback(msg.message_id, resolved);
      if (!mounted.current || heldSession.current !== sessionId) return;
      setMessages((prev) => {
        const marked = prev.map((m) => (m.id === msg.id ? { ...m, resolved } : m));
        // "Not solved" comes back with a second attempt, a past mentor answer, or a ticket
        return reply.message ? [...marked, fromReply(reply)] : marked;
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setFeedbackBusyId(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const mentor = project?.team.find((m) => m.role === 'mentor');
  const mentorName = mentor?.name || '';
  const busy = isTyping || !!feedbackBusyId;
  const isEmpty = messages.length === 0 && !busy && !sessionId;
  const canSend = inputText.trim() && !busy;

  return (
    // Negative margin cancels the page padding: the conversation runs edge to edge
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, margin: '-24px -28px' }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={{ padding: '28px clamp(28px, 5vw, 88px) 12px', display: 'flex', flexDirection: 'column', gap: '26px', minHeight: '100%' }}>
          {isEmpty && (
            <div className="fade-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '22px', paddingBottom: '6vh' }}>
              <div>
                <h2 style={{ fontSize: '1.7rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
                  Hello {user.name.split(' ')[0]}, what are you working on?
                </h2>
                <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginTop: '6px', maxWidth: '560px' }}>
                  I know {project?.name || 'your project'}: the code, the documents, your client calls and your tasks.
                </p>
              </div>
              <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px' }}>
                {STARTERS.map((s) => (
                  <button
                    key={s.title}
                    onClick={() => handleSendMessage(s.text)}
                    className="card is-clickable"
                    style={{ padding: '14px 16px', textAlign: 'left' }}
                  >
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '4px' }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'var(--color-text-main)', lineHeight: 1.45 }}>{s.text}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => {
            if (msg.sender === 'student') {
              return (
                <div key={msg.id} className="msg-enter" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div
                    title={msg.timestamp}
                    style={{ maxWidth: '78%', background: 'var(--color-primary)', color: '#FFFFFF', borderRadius: '18px 18px 4px 18px', padding: '10px 16px', fontSize: '0.93rem', lineHeight: 1.55, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            }

            const isMentor = msg.sender === 'mentor';
            return (
              <div key={msg.id} className="msg-enter" style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                {isMentor ? (
                  <Avatar id={mentor?.id} name={msg.mentor_name || 'Mentor'} size={30} tone="orange" />
                ) : (
                  <img src="/logo.svg" alt="" style={{ width: '30px', height: '30px', flexShrink: 0 }} />
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: isMentor ? 'var(--color-accent-strong)' : 'var(--color-text-main)' }}>
                      {isMentor ? msg.mentor_name || 'Your mentor' : 'AI Mentor'}
                    </span>
                    {isMentor && <span style={{ fontSize: '0.72rem', color: 'var(--color-accent-strong)' }}>your mentor</span>}
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)' }}>{msg.timestamp}</span>
                  </div>
                  {isMentor ? (
                    <div style={{ background: 'var(--color-accent-subtle)', border: '1px solid var(--color-accent-border)', borderRadius: '4px 16px 16px 16px', padding: '14px 18px' }}>
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  ) : (
                    <AiMessage
                      msg={msg}
                      project={project}
                      isLatest={idx === messages.length - 1}
                      onFeedback={handleFeedback}
                      feedbackBusy={feedbackBusyId === msg.id}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {(feedbackBusyId || (isTyping && pendingIn === sessionId)) && (
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <img src="/logo.svg" alt="" style={{ width: '30px', height: '30px', flexShrink: 0 }} />
              <Thinking />
            </div>
          )}
          {error && <div className="notice-error">{error}</div>}
        </div>
      </div>

      {/* Composer */}
      <div style={{ flexShrink: 0, padding: '8px clamp(28px, 5vw, 88px) 18px' }}>
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-surface)',
              borderRadius: '18px',
              border: '1px solid var(--color-border-strong)',
              padding: '8px 8px 8px 18px',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about your code, tasks or client…"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.94rem', padding: '8px 0', background: 'transparent' }}
            />
            <button
              type="button"
              className="hover-row"
              onClick={() => setEscalationOpen(true)}
              disabled={busy}
              title="Send a question straight to your mentor"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}
            >
              <LifeBuoy size={15} /> Ask my mentor
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!canSend}
              aria-label="Send"
              style={{
                background: canSend ? 'var(--color-primary)' : 'var(--color-border)',
                color: '#FFFFFF',
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 1,
                transform: canSend ? 'none' : 'scale(0.94)'
              }}
            >
              <ArrowUp size={17} strokeWidth={2.4} />
            </button>
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--color-text-subtle)', marginTop: '8px' }}>
            The AI mentor can be wrong. If an answer does not help, say so and it goes to {mentorName || 'your mentor'}.
          </div>
        </div>
      </div>

      <EscalationModal
        isOpen={escalationOpen}
        onClose={() => setEscalationOpen(false)}
        onSubmit={handleSendMessage}
        mentorName={mentorName}
      />
    </div>
  );
};
