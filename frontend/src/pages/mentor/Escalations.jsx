import React, { useCallback, useEffect, useState } from 'react';
import { Search, Inbox } from 'lucide-react';
import { PageHeader, EmptyState, Loading } from '../../components/ui/Bits';
import { TicketRow } from '../../components/mentor/TicketRow';
import { mentorDeskService } from '../../services/mentorDeskService';
import { errorMessage } from '../../services/apiClient';
import { CATEGORY_LABELS } from '../../services/format';

const POLL_MS = 15000;
const VIEWS = [
  { id: 'open', label: 'Needs answer', status: 'open', kind: 'ticket' },
  { id: 'fyi', label: 'FYI', status: 'open', kind: 'fyi' },
  { id: 'resolved', label: 'Resolved', status: 'resolved', kind: null }
];

export default function Escalations() {
  const [viewId, setViewId] = useState('open');
  const [tickets, setTickets] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [error, setError] = useState('');
  const view = VIEWS.find((v) => v.id === viewId);

  const load = useCallback(() => {
    mentorDeskService
      .listTickets(view.status)
      .then(setTickets)
      .catch((err) => setError(errorMessage(err)));
  }, [view.status]);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const q = query.toLowerCase();
  const shown = (tickets || []).filter(
    (t) =>
      (!view.kind || t.kind === view.kind) &&
      (category === 'all' || t.category === category) &&
      (t.question.toLowerCase().includes(q) || (t.student_name || '').toLowerCase().includes(q))
  );

  return (
    <>
      <PageHeader title="Escalations" subtitle="Questions the AI mentor could not resolve, each with its context and a draft answer." />

      <div className="card" style={{ padding: '12px 14px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-subtle)', padding: '4px', borderRadius: 'var(--radius-full)' }}>
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => { setViewId(v.id); setTickets(null); }}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: viewId === v.id ? 'var(--bg-surface)' : 'transparent',
                color: viewId === v.id ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                boxShadow: viewId === v.id ? 'var(--shadow-sm)' : 'none'
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', padding: '7px 14px' }}>
          <Search size={15} color="var(--color-text-subtle)" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by student or question" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '100%' }} />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '7px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.83rem', background: 'var(--bg-surface)' }}>
          <option value="all">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
      </div>

      {error && <div className="notice-error">{error}</div>}
      {!tickets && !error && <Loading />}
      {tickets && shown.length === 0 && (
        <div className="card"><EmptyState icon={Inbox}>{viewId === 'open' ? 'Nothing is waiting for you.' : 'Nothing here.'}</EmptyState></div>
      )}
      {shown.length > 0 && (
        <div key={viewId} className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '12px' }}>
          {shown.map((t) => (
            <div key={t.id} className="card is-clickable" style={{ padding: '4px' }}>
              <TicketRow ticket={t} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
