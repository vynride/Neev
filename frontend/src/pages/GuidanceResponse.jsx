import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  HelpCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  MessageCircle,
  BookOpen,
  FolderCheck,
  LifeBuoy,
  ChevronLeft
} from 'lucide-react';
import { Card, Badge } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EscalationModal } from '../components/escalation/EscalationModal';
import { guidanceService } from '../services/guidanceService';

export const GuidanceResponse = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showClientDraft, setShowClientDraft] = useState(false);
  const [escalationOpen, setEscalationOpen] = useState(false);

  useEffect(() => {
    const fetchGuidance = async () => {
      const res = await guidanceService.getGuidanceDetails();
      setData(res);
    };
    fetchGuidance();
  }, []);

  if (!data) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading guidance...</div>;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(data.clientMessageDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1180px', margin: '0 auto' }}>
      {/* Back to Chat Link */}
      <button
        onClick={() => navigate('/student/mentor')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'var(--color-primary)',
          width: 'fit-content'
        }}
      >
        <ChevronLeft size={16} /> Back to AI Mentor Chat
      </button>

      {/* Top Question Banner */}
      <Card style={{ background: '#FAFBF8', border: '1.5px solid #E2E8F0', padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Badge variant="orange">Ambiguous Requirement</Badge>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Student Query</span>
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', lineHeight: 1.4 }}>
          “{data.question}”
        </h2>
      </Card>

      {/* 2-Column Grid: Analysis on Left, Sources & Botanical Quote on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1.1fr)', gap: '28px' }}>
        {/* Left Column: Understanding, What's Unclear, Next Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Understanding Card */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Sparkles size={18} color="var(--color-primary)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                Understanding
              </h3>
            </div>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              {data.understanding}
            </p>
          </Card>

          {/* What's Unclear Card */}
          <Card>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#C2410C', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={18} color="#C2410C" />
              What's Unclear?
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.unclearPoints.map((pt, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem' }}>
                  <span style={{ color: '#E06D53', fontWeight: 800 }}>•</span>
                  <span style={{ color: 'var(--color-text-main)', fontWeight: 500 }}>{pt}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recommended Next Steps Card */}
          <Card>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} color="var(--color-primary)" />
              Recommended Next Steps
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.recommendedSteps.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: '#F8FAFC',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--color-primary)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      flexShrink: 0
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: '0.88rem', color: 'var(--color-text-main)', fontWeight: 500, paddingTop: '2px' }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
              <Button
                variant="primary"
                onClick={() => setShowClientDraft(!showClientDraft)}
              >
                {showClientDraft ? 'Hide Client Message' : 'Generate Client Message'}
              </Button>
              <Button
                variant="outline"
                onClick={() => alert('Found 3 past student threads resolving similar ambiguous analytics dashboards!')}
              >
                View Similar Questions
              </Button>
            </div>

            {/* Expandable Client Message Draft Box */}
            {showClientDraft && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '18px',
                  borderRadius: 'var(--radius-md)',
                  background: '#FAFBF8',
                  border: '1.5px solid #BBF7D0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    Draft Client Email / Slack Message
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCopyMessage} icon={copied ? Check : Copy}>
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </Button>
                </div>
                <pre
                  style={{
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                    whiteSpace: 'pre-wrap',
                    color: 'var(--color-text-main)',
                    lineHeight: 1.6,
                    background: '#FFFFFF',
                    padding: '14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  {data.clientMessageDraft}
                </pre>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Sources Used, Clarity Quote, Escalation Trigger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Sources Used Card */}
          <Card>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '14px' }}>
              Sources Used
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.sources.map((src, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: '#F8FAFC',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--color-text-main)'
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }} />
                  {src.title}
                </div>
              ))}
            </div>
          </Card>

          {/* Organic Botanical Quote Card (as seen in the reference) */}
          <div
            style={{
              background: '#FEF9F5',
              border: '1.5px solid #FED7AA',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 24px',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            <div className="handwriting" style={{ fontSize: '1.8rem', color: '#9A3412', lineHeight: 1.25, fontWeight: 700 }}>
              “Clarity today.<br />Less rework tomorrow!”
            </div>
            <div style={{ fontSize: '0.75rem', color: '#C2410C', fontWeight: 600, marginTop: '8px' }}>
              — Barabari Project Mentorship
            </div>
          </div>

          {/* Escalation Prompt */}
          <Card style={{ background: '#FFF5F5', border: '1.5px solid #FECACA', textAlign: 'center', padding: '24px 20px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#991B1B', marginBottom: '8px' }}>
              Still need human guidance?
            </div>
            <p style={{ fontSize: '0.8rem', color: '#7F1D1D', marginBottom: '16px' }}>
              If client answers are conflicting or you need code architecture review, your mentor is here.
            </p>
            <Button
              variant="terracotta"
              icon={LifeBuoy}
              onClick={() => setEscalationOpen(true)}
              style={{ width: '100%' }}
            >
              Escalate to Mentor
            </Button>
          </Card>
        </div>
      </div>

      {/* Escalation Modal */}
      <EscalationModal
        isOpen={escalationOpen}
        onClose={() => setEscalationOpen(false)}
        defaultCategory="Requirements Clarification"
      />
    </div>
  );
};
