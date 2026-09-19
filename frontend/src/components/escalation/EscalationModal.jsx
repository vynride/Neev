import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '../ui/Button';

// Asks for a human mentor. The request goes through the chat, so the mentor's ticket carries
// the conversation and project context, and the reply comes back into the same chat.
export const EscalationModal = ({ isOpen, onClose, onSubmit, mentorName }) => {
  const [question, setQuestion] = useState('');
  const [triedSteps, setTriedSteps] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setQuestion('');
    setTriedSteps('');
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let message = `I would like to talk to my mentor about this: ${question.trim()}`;
    if (triedSteps.trim()) message += `\n\nWhat I have tried so far: ${triedSteps.trim()}`;
    onSubmit(message);
    handleClose();
  };

  const fieldStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    outline: 'none',
    fontSize: '0.875rem',
    resize: 'vertical'
  };

  return (
    <div
      className="fade-enter"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(27, 31, 29, 0.5)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={handleClose}
    >
      <div
        className="modal-enter"
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
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle)'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              Ask {mentorName || 'your mentor'}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Your mentor gets this chat and your project context, so you will not need to explain it again
            </p>
          </div>
          <button onClick={handleClose} style={{ padding: '6px', color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              What do you need help with? <span style={{ color: 'var(--color-accent)' }}>*</span>
            </label>
            <textarea
              required
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., The client wants to change the payment flow after we agreed the scope. How should I respond?"
              style={fieldStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              What did you try so far? (optional)
            </label>
            <textarea
              rows={2}
              value={triedSteps}
              onChange={(e) => setTriedSteps(e.target.value)}
              placeholder="Anything you already checked or attempted"
              style={fieldStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <Button type="button" variant="outline" onClick={handleClose} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button type="submit" variant="terracotta" icon={Send} disabled={!question.trim()} style={{ flex: 1 }}>
              Send to mentor
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
