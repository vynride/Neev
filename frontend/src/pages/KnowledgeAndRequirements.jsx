import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Filter,
  Tag
} from 'lucide-react';
import { Card, Badge } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { mockProject, mockKnowledgeBaseArticles } from '../data/mockData';

export const KnowledgeAndRequirements = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'requirements', 'knowledge'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const requirements = mockProject.requirements;
  const articles = mockKnowledgeBaseArticles;

  const filteredRequirements = requirements.filter((req) => {
    const matchesSearch = req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          req.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredArticles = articles.filter((art) => {
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          art.snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          art.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || art.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: '#DCFCE7',
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
            Knowledge & Requirements Hub
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '4px', margin: 0 }}>
            Unified workspace for client specifications, engineering guides, and mentorship resolutions
          </p>
        </div>
      </div>

      {/* Search & Tabs Toolbar */}
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
        {/* Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-full)',
            padding: '8px 16px',
            width: '340px',
            border: '1px solid var(--color-border-subtle)'
          }}
        >
          <Search size={16} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search requirements, guides, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.85rem',
              width: '100%',
              color: 'var(--color-text-main)'
            }}
          />
        </div>

        {/* Unified Tab Filter Pill Switcher */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-subtle)', padding: '4px', borderRadius: 'var(--radius-full)' }}>
          {[
            { id: 'all', label: 'All Resources' },
            { id: 'knowledge', label: `Knowledge Base (${articles.length})` },
            { id: 'requirements', label: `Requirements (${requirements.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: activeTab === tab.id ? 700 : 500,
                background: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                color: activeTab === tab.id ? '#FFFFFF' : 'var(--color-text-muted)',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section 1: Knowledge Base & Solution Guides */}
      {(activeTab === 'all' || activeTab === 'knowledge') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="var(--color-primary)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                Knowledge Base & Mentorship Solutions ({filteredArticles.length})
              </h2>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              Curated from Barabari Collective mentor resolutions
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredArticles.map((art) => (
              <Card
                key={art.id}
                style={{
                  padding: '18px 22px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease'
                }}
                onClick={() => navigate(`/student/mentor`)}
              >
                <div style={{ flex: '1 1 400px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary)', background: '#F0FDF4', padding: '2px 8px', borderRadius: '4px' }}>
                      {art.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      · {art.readTime}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '4px' }}>
                    {art.title}
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    {art.snippet}
                  </p>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                    {art.tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          fontSize: '0.7rem',
                          background: '#F1F5F9',
                          color: '#475569',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 600
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/student/mentor');
                  }}
                  icon={Sparkles}
                >
                  Discuss with AI
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Project Requirements */}
      {(activeTab === 'all' || activeTab === 'requirements') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: activeTab === 'all' ? '12px' : '0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--color-primary)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                Project Requirements ({filteredRequirements.length})
              </h2>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              Project: <strong>{mockProject.name}</strong> ({mockProject.client})
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
            {filteredRequirements.map((req) => (
              <Card key={req.id} style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', background: '#DCFCE7', padding: '2px 8px', borderRadius: '4px' }}>
                      {req.id}
                    </span>
                    <Badge variant={req.status === 'Done' ? 'green' : req.status === 'In Progress' ? 'orange' : 'gray'}>
                      {req.status}
                    </Badge>
                  </div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '6px' }}>
                    {req.title}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    {req.description}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    Category: {req.category}
                  </span>
                  {req.status === 'Pending Review' ? (
                    <button
                      onClick={() => navigate('/student/guidance')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--color-accent)'
                      }}
                    >
                      Clarify Scope <ArrowRight size={13} />
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/student/mentor')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--color-primary)'
                      }}
                    >
                      Ask AI <Sparkles size={13} />
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
