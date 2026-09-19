import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Mic,
  Share2,
  MoreVertical,
  FolderGit2,
  Clock,
  Code2,
  AlertTriangle
} from 'lucide-react';
import { MermaidViewer } from '../components/architecture/MermaidViewer';
import { EscalationModal } from '../components/escalation/EscalationModal';
import { mentorService } from '../services/mentorService';
import { useAuth } from '../context/AuthContext';

export const MentorChat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [projectContext, setProjectContext] = useState(null);
  const [escalationOpen, setEscalationOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const initChat = async () => {
      const context = await mentorService.getProjectContext();
      setProjectContext(context);
    };
    initChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMessage = {
      id: `msg_${Date.now()}`,
      sender: 'student',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: query
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const aiResponse = await mentorService.askQuestion(query, projectContext);
      const aiMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: aiResponse
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('Error fetching AI guidance', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0, gap: '14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            Project Mentor
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '4px', margin: 0 }}>
            Get AI-powered guidance for your project with full codebase context
          </p>
        </div>
      </div>

      {/* Main Chat Viewport (Full Width) */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {/* Conversation Stream Container */}
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
          {/* Scrollable Messages Stream */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px', minHeight: 0 }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F0FDF4', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 800, marginBottom: '12px', border: '1.5px solid #BBF7D0' }}>
                  P
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '6px' }}>
                  How can I help you today?
                </h3>
                <p style={{ fontSize: '0.88rem', maxWidth: '440px', lineHeight: 1.5, margin: 0 }}>
                  Ask any question about your project, architecture, code logic, or requirements to get instant guidance.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
              const isStudent = msg.sender === 'student';

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isStudent ? 'flex-end' : 'flex-start',
                    maxWidth: '100%'
                  }}
                >
                  {/* Sender Name & Timestamp */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <span>{isStudent ? (user?.name || 'Aditi') : 'Project Saathi Mentor'}</span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    style={{
                      maxWidth: isStudent ? '80%' : '94%',
                      background: isStudent ? '#F0FDF4' : '#FFFFFF',
                      border: `1.5px solid ${isStudent ? '#BBF7D0' : 'var(--color-border)'}`,
                      borderRadius: isStudent ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '18px 20px',
                      color: 'var(--color-text-main)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    {isStudent ? (
                      <p style={{ fontSize: '0.92rem', lineHeight: 1.5, fontWeight: 500 }}>
                        {msg.content}
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {/* AI Avatar badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: 'var(--color-primary)',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8rem',
                              fontWeight: 800
                            }}
                          >
                            A
                          </span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                            Project-Aware AI Guidance
                          </span>
                        </div>

                        {/* Explanation text */}
                        <div style={{ fontSize: '0.92rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                          {typeof msg.content === 'string' ? msg.content : msg.content.explanation}
                        </div>

                        {/* Key Steps if provided */}
                        {msg.content?.keySteps && (
                          <div style={{ background: '#FAFBF8', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-primary)' }}>
                              Key steps:
                            </div>
                            <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                              {msg.content.keySteps.map((step, idx) => (
                                <li key={idx}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* System Architecture Diagram (Mermaid) */}
                        {msg.content?.diagram && (
                          <MermaidViewer
                            chartDefinition={msg.content.diagram}
                            onRegenerate={() => handleSendMessage("Can you regenerate the system architecture diagram with more service detail?")}
                          />
                        )}

                      </div>
                    )}
                  </div>
                </div>
              );
            }))}

            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)', animation: 'ping 1s infinite' }} />
                <span>AI Mentor is analyzing project codebase and generating response...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input */}
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
                placeholder="Ask your question... (e.g. How does authentication work?)"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.9rem',
                  padding: '6px 4px'
                }}
              />

              <button
                type="button"
                onClick={() => alert('Sarvam Voice AI Integration Hook: Listening for Hindi/English student voice input...')}
                style={{ padding: '6px', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                title="Sarvam Voice Input (Hindi/Telugu/English)"
              >
                <Mic size={18} />
              </button>

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                style={{
                  background: inputText.trim() ? 'var(--color-primary)' : '#CBD5E1',
                  color: '#FFFFFF',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s ease'
                }}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Escalation Modal */}
      <EscalationModal
        isOpen={escalationOpen}
        onClose={() => setEscalationOpen(false)}
        defaultCategory="Technical Implementation"
      />
    </div>
  );
};
