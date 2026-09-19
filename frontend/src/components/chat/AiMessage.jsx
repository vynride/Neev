import React, { useState } from 'react';
import { Copy, Check, ThumbsUp, ThumbsDown, FileCode, FileText, Phone, CheckSquare, BookOpen, ExternalLink, LifeBuoy, Loader2 } from 'lucide-react';
import { Markdown } from '../ui/Markdown';
import { Badge } from '../ui/Card';
import { categoryLabel } from '../../services/format';

const CITATION_ICONS = { code: FileCode, doc: FileText, meeting: Phone, task: CheckSquare, kb: BookOpen };
const CITATION_LABELS = { code: 'Code', doc: 'Document', meeting: 'Client call', task: 'Task', kb: 'Mentor answer' };

const ACTION_BADGES = {
  clarify: { label: 'Needs a little more detail', variant: 'blue' },
  ask_client: { label: 'A question for your client', variant: 'orange' },
  escalated: { label: 'Sent to your mentor', variant: 'orange' }
};

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
    {children}
  </div>
);

// One reply from the AI mentor, with its sources, links, client draft and feedback buttons
export const AiMessage = ({ msg, isLatest, onFeedback, feedbackBusy }) => {
  const [copied, setCopied] = useState(false);
  const action = ACTION_BADGES[msg.next_action];
  // Only the newest reply can be rated; rating an older one would restart a finished thread
  const canGiveFeedback = isLatest && msg.next_action !== 'escalated' && msg.resolved == null && msg.message_id;

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.draft_client_message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {msg.category && <Badge variant="green">{categoryLabel(msg.category)}</Badge>}
        {action && <Badge variant={action.variant}>{action.label}</Badge>}
        {msg.attempt === 2 && <Badge variant="blue">Second attempt</Badge>}
      </div>

      <Markdown>{msg.content}</Markdown>

      {msg.draft_client_message && (
        <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: '#FAFBF8', border: '1.5px solid #BBF7D0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              Draft message to your client
            </span>
            <button
              onClick={handleCopy}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)' }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div style={{ fontSize: '0.86rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{msg.draft_client_message}</div>
        </div>
      )}

      {msg.citations?.length > 0 && (
        <div>
          <SectionTitle>Based on your project</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {msg.citations.map((c, idx) => {
              const Icon = CITATION_ICONS[c.type] || FileText;
              return (
                <div key={idx} style={{ display: 'flex', gap: '10px', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: '#F8FAFC', border: '1px solid var(--color-border)' }}>
                  <Icon size={15} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, overflowWrap: 'anywhere' }}>
                      {CITATION_LABELS[c.type] || c.type}: {c.ref}
                    </div>
                    {c.snippet && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', overflowWrap: 'anywhere' }}>{c.snippet}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {msg.resources?.length > 0 && (
        <div>
          <SectionTitle>Learn more</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {msg.resources.map((r, idx) => (
              <a
                key={idx}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'flex', gap: '10px', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
              >
                <ExternalLink size={14} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '3px' }} />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)' }}>{r.title}</div>
                  {r.why && <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{r.why}</div>}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {msg.next_action === 'escalated' && msg.ticket_id && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#C2410C', fontWeight: 600 }}>
          <LifeBuoy size={15} /> Ticket {msg.ticket_id.slice(0, 8)} is with your mentor. Their reply will appear here.
        </div>
      )}

      {canGiveFeedback && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Did this solve it?</span>
          {feedbackBusy ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <Loader2 size={14} className="animate-spin" /> Working on it...
            </span>
          ) : (
            <>
              <button
                onClick={() => onFeedback(msg, true)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: 'var(--radius-full)', border: '1.5px solid #BBF7D0', color: '#166534', fontSize: '0.8rem', fontWeight: 700 }}
              >
                <ThumbsUp size={13} /> Yes
              </button>
              <button
                onClick={() => onFeedback(msg, false)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: 'var(--radius-full)', border: '1.5px solid #FED7AA', color: '#C2410C', fontSize: '0.8rem', fontWeight: 700 }}
              >
                <ThumbsDown size={13} /> {msg.attempt >= 2 ? 'No, ask my mentor' : 'No, try again'}
              </button>
            </>
          )}
        </div>
      )}
      {msg.resolved === true && (
        <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>✓ You marked this as solved</div>
      )}
    </div>
  );
};
