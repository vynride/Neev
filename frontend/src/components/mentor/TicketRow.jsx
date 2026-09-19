import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Card';
import { categoryLabel, relativeDay } from '../../services/format';

// One escalated question in a list. Clicking opens the ticket.
export const TicketRow = ({ ticket, compact = false }) => {
  const navigate = useNavigate();
  const isFyi = ticket.kind === 'fyi';
  return (
    <button
      className="hover-row"
      onClick={() => navigate(`/mentor/escalations/${ticket.id}`)}
      style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', width: '100%', textAlign: 'left', padding: compact ? '10px 8px' : '14px 16px', borderRadius: 'var(--radius-md)' }}
    >
      <Avatar id={ticket.student_id} name={ticket.student_name || ticket.student_id} size={compact ? 32 : 38} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.86rem', fontWeight: 700 }}>{ticket.student_name || ticket.student_id}</span>
          {isFyi && <Badge variant="blue">FYI</Badge>}
          {ticket.status === 'resolved' && <Badge variant="green">Resolved</Badge>}
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)' }}>{relativeDay(ticket.created_at)}</span>
        </div>
        <div style={{ fontSize: '0.86rem', color: 'var(--color-text-main)', lineHeight: 1.45, marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {ticket.question}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)', marginTop: '4px' }}>
          {[ticket.project_name, categoryLabel(ticket.category)].filter(Boolean).join(' · ')}
        </div>
      </div>
      <ChevronRight size={16} color="var(--color-text-subtle)" style={{ flexShrink: 0, marginTop: '10px' }} />
    </button>
  );
};
