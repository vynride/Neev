import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Send, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { escalationService } from '../../services/escalationService';

export const EscalationModal = ({ isOpen, onClose, defaultCategory = 'Technical Implementation' }) => {
  const [category, setCategory] = useState(defaultCategory);
  const [priority, setPriority] = useState('Medium');
  const [triedSteps, setTriedSteps] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await escalationService.submitEscalation({
        category,
        priority,
        triedSteps,
        additionalContext
      });
      setResult(res);
    } catch (err) {
      console.error('Escalation failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setResult(null);
    setTriedSteps('');
    setAdditionalContext('');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={handleResetAndClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '540px',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          border: '1px solid var(--color-border)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FAFBF8'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🤝</span>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                Escalate to Human Mentor
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Connect directly with your Barabari mentor for unblocking
              </p>
            </div>
          </div>
          <button onClick={handleResetAndClose} style={{ padding: '6px', color: '#64748B' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {result ? (
            <div style={{ textAlign: 'center', padding: '16px 8px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#DCFCE7',
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}
              >
                <CheckCircle size={32} />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '8px' }}>
                Escalated to Mentor Successfully!
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
                Your assigned mentor has received this ticket along with your project context and AI discussion log.
              </p>

              <div
                style={{
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginBottom: '24px',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Ticket ID:</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{result.ticketId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Status:</span>
                  <span style={{ fontWeight: 600, color: '#C2410C', background: '#FFEDD5', padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem' }}>
                    {result.status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Category:</span>
                  <span style={{ fontWeight: 600 }}>{result.category}</span>
                </div>
              </div>

              <Button onClick={handleResetAndClose} variant="primary" style={{ width: '100%' }}>
                Done & Return to Workspace
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--color-border)',
                    outline: 'none',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="Technical Implementation">Technical Implementation / Architecture</option>
                  <option value="Requirements Clarification">Ambiguous Client Requirement</option>
                  <option value="Deployment & DevOps">Deployment / AWS / Database Error</option>
                  <option value="Git & Version Control">Git Conflict / Merge Issue</option>
                  <option value="Client Communication">Client Communication Guidance</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Priority Level
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['Low', 'Medium', 'Urgent / Blocker'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setPriority(lvl)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        border: priority === lvl ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: priority === lvl ? 'var(--bg-accent-soft)' : '#FFFFFF',
                        color: priority === lvl ? 'var(--color-primary)' : 'var(--color-text-main)'
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  What did you try so far? <span style={{ color: 'var(--color-accent)' }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={triedSteps}
                  onChange={(e) => setTriedSteps(e.target.value)}
                  placeholder="e.g., I implemented the JWT middleware in Express but requests to /orders fail with 401 even when the token is attached."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--color-border)',
                    outline: 'none',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Additional Context (optional)
                </label>
                <textarea
                  rows={2}
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Branch name, relevant file path, or error log snippets..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--color-border)',
                    outline: 'none',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <Button type="button" variant="outline" onClick={handleResetAndClose} style={{ flex: 1 }}>
                  Cancel
                </Button>
                <Button type="submit" variant="terracotta" disabled={loading} style={{ flex: 1 }}>
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  Submit Escalation
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
