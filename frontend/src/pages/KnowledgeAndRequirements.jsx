import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Sparkles, UserCheck } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Markdown } from '../components/ui/Markdown';
import { projectService } from '../services/projectService';
import { errorMessage } from '../services/apiClient';
import { CATEGORY_LABELS, categoryLabel, formatDate } from '../services/format';

export const KnowledgeAndRequirements = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    projectService
      .getKnowledgeBase()
      .then(setEntries)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const q = searchQuery.toLowerCase();
  const filtered = (entries || []).filter(
    (e) =>
      (category === 'all' || e.category === category) &&
      (e.question.toLowerCase().includes(q) || e.answer.toLowerCase().includes(q))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'var(--color-primary-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
            flexShrink: 0
          }}
        >
          <BookOpen size={22} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            Knowledge Hub
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: 0 }}>
            Answers your mentors have already given. The AI mentor checks these before it sends a new question to a mentor.
          </p>
        </div>
      </div>

      {/* Search & Category Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '16px 20px',
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-full)',
            padding: '8px 16px',
            width: '340px',
            maxWidth: '100%',
            border: '1px solid var(--color-border-subtle)'
          }}
        >
          <Search size={16} color="var(--color-text-subtle)" />
          <input
            type="text"
            placeholder="Search questions and answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '100%' }}
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.85rem', background: '#FFFFFF' }}
        >
          <option value="all">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {error && <div className="notice-error">{error}</div>}
      {!entries && !error && <div style={{ color: 'var(--color-text-muted)' }}>Loading answers...</div>}
      {entries && filtered.length === 0 && (
        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No answers match.</div>
      )}

      <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map((entry) => {
          const isOpen = openId === entry.id;
          return (
            <Card
              key={entry.id}
              className="is-clickable"
              style={{ padding: '18px 22px', cursor: 'pointer' }}
              onClick={() => setOpenId(isOpen ? null : entry.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary)', background: 'var(--bg-accent-soft)', padding: '2px 8px', borderRadius: '4px' }}>
                  {categoryLabel(entry.category)}
                </span>
                {entry.from_ticket && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-accent-strong)', background: 'var(--color-accent-subtle)', padding: '2px 8px', borderRadius: '4px' }}>
                    <UserCheck size={12} /> From a student's ticket
                  </span>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>· {formatDate(entry.created_at)}</span>
              </div>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                {entry.question}
              </h3>

              {isOpen ? (
                <div className="tab-enter" style={{ marginTop: '12px' }} onClick={(e) => e.stopPropagation()}>
                  <Markdown>{entry.answer}</Markdown>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Sparkles}
                    style={{ marginTop: '14px' }}
                    onClick={() => navigate('/student/mentor', { state: { prefill: entry.question } })}
                  >
                    Ask the AI mentor about this
                  </Button>
                </div>
              ) : (
                <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginTop: '4px' }}>
                  {entry.answer.slice(0, 180)}{entry.answer.length > 180 ? '…' : ''}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
