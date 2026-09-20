import React, { useState } from 'react';
import { Copy, Check, ThumbsUp, ThumbsDown, FileCode2, FileText, PhoneCall, ListChecks, GraduationCap, ArrowUpRight, Clock3 } from 'lucide-react';
import { Markdown } from '../ui/Markdown';
import { categoryLabel, describeCitation } from '../../services/format';

const CITATION_ICONS = { code: FileCode2, doc: FileText, meeting: PhoneCall, task: ListChecks, kb: GraduationCap };

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-subtle)', marginBottom: '8px' }}>
    {children}
  </div>
);

const Source = ({ citation, project }) => {
  const Icon = CITATION_ICONS[citation.type] || FileText;
  const { label, title, detail, quote, href, mono } = describeCitation(citation, project);
  const Wrapper = href ? 'a' : 'div';
  return (
    <Wrapper
      {...(href ? { href, target: '_blank', rel: 'noreferrer' } : {})}
      className={href ? 'hover-row' : undefined}
      style={{ display: 'flex', gap: '10px', padding: '8px 10px', borderRadius: 'var(--radius-md)', alignItems: 'flex-start' }}
    >
      <span
        title={label}
        style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'var(--bg-subtle)', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      >
        <Icon size={14} strokeWidth={1.8} />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: mono ? '0.78rem' : '0.83rem', fontWeight: 600, fontFamily: mono ? 'var(--font-mono)' : undefined, overflowWrap: 'anywhere' }}>
            {title}
          </span>
          {detail && <span style={{ fontSize: '0.74rem', color: 'var(--color-text-subtle)', overflowWrap: 'anywhere' }}>{detail}</span>}
        </div>
        {quote && (
          <div style={{ fontSize: '0.77rem', color: 'var(--color-text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {quote}
          </div>
        )}
      </div>
      {href && <ArrowUpRight size={14} color="var(--color-text-subtle)" style={{ flexShrink: 0, marginTop: '4px' }} />}
    </Wrapper>
  );
};

const REASONS = ['Too hard to follow', 'Not what I asked', 'I think it is wrong', 'I need an example'];

const feedbackButton = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '5px 12px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--color-border-strong)',
  fontSize: '0.78rem',
  fontWeight: 600
};

// One reply from the AI mentor, with its sources, links, client draft and feedback buttons
export const AiMessage = ({ msg, project, isLatest, mentorReplied, onFeedback, feedbackBusy }) => {
  const shared = msg.from_shared || !!msg.shared_id;
  const [copied, setCopied] = useState(false);
  // A saved answer that did not help goes to the mentor with her reason, so it gets fixed for everyone
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState('');
  // Only the newest reply can be rated; rating an older one would restart a finished thread
  const canGiveFeedback = isLatest && msg.next_action !== 'escalated' && msg.resolved == null && msg.message_id;

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.draft_client_message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Markdown>{msg.content}</Markdown>

      {msg.draft_client_message && (
        <div style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary-border)', background: 'var(--bg-accent-soft)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 8px 8px 14px', borderBottom: '1px solid var(--color-primary-border)' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-primary)' }}>A message you can send your client</span>
            <button className="hover-row" onClick={handleCopy} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', fontWeight: 600, color: 'var(--color-primary)', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div style={{ fontSize: '0.87rem', whiteSpace: 'pre-wrap', lineHeight: 1.65, padding: '12px 14px' }}>{msg.draft_client_message}</div>
        </div>
      )}

      {msg.citations?.length > 0 && (
        <div>
          <SectionTitle>Where this comes from</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2px 12px' }}>
            {msg.citations.map((c, idx) => <Source key={idx} citation={c} project={project} />)}
          </div>
        </div>
      )}

      {msg.resources?.length > 0 && (
        <div>
          <SectionTitle>Worth reading</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2px 12px' }}>
            {msg.resources.map((r, idx) => (
              <a key={idx} href={r.url} target="_blank" rel="noreferrer" className="hover-row" style={{ display: 'flex', gap: '10px', padding: '8px 10px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--color-primary)' }}>{r.title}</div>
                  {r.why && <div style={{ fontSize: '0.77rem', color: 'var(--color-text-muted)' }}>{r.why}</div>}
                </div>
                <ArrowUpRight size={14} color="var(--color-text-subtle)" style={{ flexShrink: 0, marginTop: '4px' }} />
              </a>
            ))}
          </div>
        </div>
      )}

      {msg.next_action === 'escalated' && !mentorReplied && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--color-accent-strong)', fontWeight: 600 }}>
          <Clock3 size={14} /> Waiting for your mentor. Their reply will appear here.
        </div>
      )}

      {(canGiveFeedback || msg.resolved === true || msg.category) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', paddingTop: canGiveFeedback ? '12px' : 0, borderTop: canGiveFeedback ? '1px solid var(--color-border-subtle)' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '28px' }}>
            {canGiveFeedback && !feedbackBusy && !asking && (
              <>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Did this solve it?</span>
                <button className="hover-row" onClick={() => onFeedback(msg, true)} style={feedbackButton}>
                  <ThumbsUp size={13} /> Yes
                </button>
                <button className="hover-row" onClick={() => (shared ? setAsking(true) : onFeedback(msg, false))} style={feedbackButton}>
                  <ThumbsDown size={13} /> {shared ? 'No' : msg.attempt >= 2 ? 'No, ask my mentor' : 'No, try again'}
                </button>
              </>
            )}
            {msg.resolved === true && (
              <span className="fade-enter" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                <Check size={14} /> Marked as solved
              </span>
            )}
          </div>
          {msg.category && !asking && (
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)' }}>{categoryLabel(msg.category)}</span>
          )}
          {canGiveFeedback && asking && !feedbackBusy && (
            <form
              className="fade-enter"
              onSubmit={(e) => {
                e.preventDefault();
                onFeedback(msg, false, reason.trim());
              }}
              style={{ width: 'min(640px, 100%)', display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>What was wrong with this answer?</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Your mentor will see your question, this answer and what you write here. Their reply comes to this chat and fixes the answer for other students too.
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {REASONS.map((r) => (
                  <button key={r} type="button" className="hover-row" onClick={() => setReason((prev) => (prev ? `${prev.replace(/\s+$/, '')} ${r}.` : `${r}.`))} style={{ ...feedbackButton, fontWeight: 500 }}>
                    {r}
                  </button>
                ))}
              </div>
              <textarea
                autoFocus
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="In your own words. For example: it uses words I do not know, or it does not cover what I asked."
                style={{ width: '100%', resize: 'vertical', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', background: 'var(--bg-surface)', fontSize: '0.88rem', lineHeight: 1.5, fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" disabled={!reason.trim()} style={{ padding: '7px 14px', fontSize: '0.82rem', opacity: reason.trim() ? 1 : 0.5 }}>
                  Send to my mentor
                </button>
                <button type="button" className="hover-row" onClick={() => setAsking(false)} style={feedbackButton}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
