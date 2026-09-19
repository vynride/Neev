import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import { PageHeader, ProgressBar, EmptyState, Loading } from '../../components/ui/Bits';
import { Badge } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { mentorDeskService } from '../../services/mentorDeskService';
import { errorMessage } from '../../services/apiClient';

const Figure = ({ label, value }) => (
  <div>
    <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>{value ?? '–'}</div>
    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-subtle)' }}>{label}</div>
  </div>
);

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    mentorDeskService.listStudents().then(setStudents).catch((err) => setError(errorMessage(err)));
  }, []);

  const q = query.toLowerCase();
  const shown = (students || []).filter((s) => s.name.toLowerCase().includes(q) || s.project.name.toLowerCase().includes(q));

  return (
    <>
      <PageHeader title="Students" subtitle="Scores from CodeGuru and Samvad Saathi, live task progress, and how much each student leans on the AI mentor.">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', padding: '7px 14px', width: '260px' }}>
          <Search size={15} color="var(--color-text-subtle)" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search students or projects" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '100%' }} />
        </div>
      </PageHeader>

      {error && <div className="notice-error">{error}</div>}
      {!students && !error && <Loading />}
      {students && shown.length === 0 && <div className="card"><EmptyState icon={Users}>No students match.</EmptyState></div>}

      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
        {shown.map((s) => (
          <button key={`${s.id}-${s.project.id}`} className="card is-clickable" onClick={() => navigate(`/mentor/students/${s.id}`)} style={{ padding: '18px 20px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Avatar id={s.id} name={s.name} size={46} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.98rem', fontWeight: 700 }}>{s.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{s.project.name}</div>
              </div>
              {s.open_tickets > 0 && <Badge variant="orange">{s.open_tickets} open</Badge>}
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '5px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>
                  {s.tasks.done} of {s.tasks.total} tasks done
                  {s.tasks.overdue > 0 && <strong style={{ color: 'var(--color-accent-strong)' }}> · {s.tasks.overdue} overdue</strong>}
                </span>
                <strong>{s.tasks.progress}%</strong>
              </div>
              <ProgressBar value={s.tasks.progress} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--color-border-subtle)' }}>
              <Figure label="CodeGuru" value={s.scores?.codeguru_avg} />
              <Figure label="Speaking" value={s.scores?.speech_avg} />
              <Figure label="Questions" value={s.questions} />
              <Figure label="Escalated" value={s.escalated} />
            </div>

            {s.struggles.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {s.struggles.map((x) => <Badge key={x.topic} variant="gray">{x.topic} ×{x.count}</Badge>)}
              </div>
            )}
          </button>
        ))}
      </div>
    </>
  );
}
