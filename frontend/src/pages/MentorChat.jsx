import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, LifeBuoy, Plus, UserCheck } from 'lucide-react';
import { EscalationModal } from '../components/escalation/EscalationModal';
import { AiMessage } from '../components/chat/AiMessage';
import { Markdown } from '../components/ui/Markdown';
import { Button } from '../components/ui/Button';
import { mentorService } from '../services/mentorService';
import { projectService } from '../services/projectService';
import { errorMessage } from '../services/apiClient';
import { formatTime } from '../services/format';
import { useAuth } from '../context/AuthContext';

const POLL_MS = 8000;

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
  const { user, project, projectId } = useAuth();
  const location = useLocation();
  const sessionKey = `saathi_session_${user.id}_${projectId}`;
  const [sessionId, setSessionId] = useState(() => localStorage.getItem(sessionKey));
  const [messages, setMessages] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [mentorName, setMentorName] = useState('');
  const [inputText, setInputText] = useState(location.state?.prefill || '');
  const [isTyping, setIsTyping] = useState(false);
  const [feedbackBusyId, setFeedbackBusyId] = useState(null);
  const [error, setError] = useState('');
  const [escalationOpen, setEscalationOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const loadSession = useCallback(async (id) => {
    const session = await mentorService.getSession(id);
    setMessages(session.turns.map(fromTurn));
  }, []);

  // Restore the current chat, list earlier ones, find the mentor's name
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId).catch(() => {
        localStorage.removeItem(sessionKey);
        setSessionId(null);
      });
    }
    mentorService.listSessions(projectId).then(setPastSessions).catch(() => {});
    projectService
      .getProject(projectId)
      .then((p) => setMentorName(p.team.find((m) => m.role === 'mentor')?.name || ''))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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
    const query = (textToSend || inputText).trim();
    if (!query || isTyping) return;

    setMessages((prev) => [...prev, { id: `local_${Date.now()}`, sender: 'student', timestamp: formatTime(), content: query }]);
    setInputText('');
    setError('');
    setIsTyping(true);

    try {
      const reply = await mentorService.ask(projectId, query, sessionId);
      if (reply.session_id !== sessionId) {
        localStorage.setItem(sessionKey, reply.session_id);
        setSessionId(reply.session_id);
      }
      setMessages((prev) => [...prev, fromReply(reply)]);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsTyping(false);
    }
  };

  const handleFeedback = async (msg, resolved) => {
    setFeedbackBusyId(msg.id);
    setError('');
    try {
      const reply = await mentorService.sendFeedback(msg.message_id, resolved);
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

  const handleNewChat = () => {
    localStorage.removeItem(sessionKey);
    setSessionId(null);
    setMessages([]);
    setError('');
    mentorService.listSessions(projectId).then(setPastSessions).catch(() => {});
  };

  const handleOpenSession = async (id) => {
    if (!id) return;
    localStorage.setItem(sessionKey, id);
    setSessionId(id);
    setError('');
    try {
      await loadSession(id);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const starters = [
    'What is pending for me this week, and what is overdue?',
    'Explain how the main parts of this codebase fit together, with a diagram.',
    'The client asked for something outside the agreed scope. How do I respond?'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0, gap: '14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            Project Mentor
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0 }}>
            Knows {project?.name}: the code, documents, client calls and ClickUp tasks
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {pastSessions.length > 0 && (
            <select
              value={sessionId || ''}
              onChange={(e) => handleOpenSession(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', fontSize: '0.8rem', maxWidth: '240px', background: '#FFFFFF' }}
            >
              <option value="">Earlier chats</option>
              {pastSessions.map((s) => (
                <option key={s.id} value={s.id}>{s.first_message.slice(0, 50) || 'Chat'}</option>
              ))}
            </select>
          )}
          <Button variant="outline" size="sm" icon={Plus} onClick={handleNewChat} disabled={isTyping}>
            New chat
          </Button>
          <Button variant="terracotta" size="sm" icon={LifeBuoy} onClick={() => setEscalationOpen(true)} disabled={isTyping}>
            Ask my mentor
          </Button>
        </div>
      </div>

      {/* Conversation */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
          flex: 1,
          minHeight: 0
        }}
      >
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {messages.length === 0 && !isTyping ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '6px' }}>
                How can I help you today?
              </h3>
              <p style={{ fontSize: '0.88rem', maxWidth: '460px', lineHeight: 1.5, marginBottom: '18px' }}>
                Ask about your project, the code, your tasks or how to handle your client.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '520px' }}>
                {starters.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSendMessage(s)}
                    style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: '#F8FAFC', fontSize: '0.85rem', textAlign: 'left', color: 'var(--color-text-main)' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isStudent = msg.sender === 'student';
              const isMentor = msg.sender === 'mentor';
              const name = isStudent ? user.name : isMentor ? `${msg.mentor_name || 'Your mentor'} (mentor)` : 'AI Mentor';

              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isStudent ? 'flex-end' : 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {isMentor && <UserCheck size={13} color="#C2410C" />}
                    <span style={{ fontWeight: isMentor ? 700 : 400, color: isMentor ? '#C2410C' : undefined }}>{name}</span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    style={{
                      maxWidth: isStudent ? '80%' : '94%',
                      background: isStudent ? '#F0FDF4' : isMentor ? '#FFF7ED' : '#FFFFFF',
                      border: `1.5px solid ${isStudent ? '#BBF7D0' : isMentor ? '#FED7AA' : 'var(--color-border)'}`,
                      borderRadius: isStudent ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '16px 20px',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    {isStudent && (
                      <p style={{ fontSize: '0.92rem', lineHeight: 1.5, fontWeight: 500, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                    )}
                    {isMentor && <Markdown>{msg.content}</Markdown>}
                    {!isStudent && !isMentor && (
                      <AiMessage
                        msg={msg}
                        isLatest={idx === messages.length - 1}
                        onFeedback={handleFeedback}
                        feedbackBusy={feedbackBusyId === msg.id}
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}

          {(isTyping || feedbackBusyId) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)', animation: 'ping 1s infinite' }} />
              <span>Reading your project and writing a reply. This takes 10 to 25 seconds.</span>
            </div>
          )}
          {error && <div className="notice-error">{error}</div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border)', background: '#FAFBF8', flexShrink: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: '#FFFFFF',
              borderRadius: 'var(--radius-full)',
              border: '1.5px solid var(--color-border)',
              padding: '6px 14px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <input
              type="text"
              placeholder="Ask your question... (e.g. How does authentication work in our code?)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.9rem', padding: '6px 4px' }}
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isTyping}
              style={{
                background: inputText.trim() && !isTyping ? 'var(--color-primary)' : '#CBD5E1',
                color: '#FFFFFF',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send size={15} />
            </button>
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
