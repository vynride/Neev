import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { RefreshCw, Maximize2, Download, Info, Check } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#1E5E3A',
    primaryTextColor: '#FFFFFF',
    primaryBorderColor: '#164E2E',
    lineColor: '#64748B',
    secondaryColor: '#DCFCE7',
    tertiaryColor: '#FEF3C7',
    fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
    fontSize: '13px'
  },
  securityLevel: 'loose',
  flowchart: {
    curve: 'basis',
    useMaxWidth: true,
    htmlLabels: true
  }
});

export const MermaidViewer = ({ chartDefinition, onRegenerate }) => {
  const containerRef = useRef(null);
  const [svgContent, setSvgContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState(null);

  const renderDiagram = async () => {
    if (!chartDefinition) return;
    setIsRendering(true);
    setRenderError(null);
    try {
      const id = `mermaid-saathi-${Math.random().toString(36).substring(2, 9)}`;
      const { svg } = await mermaid.render(id, chartDefinition);
      setSvgContent(svg);
    } catch (err) {
      console.warn('Mermaid rendering fallback', err);
      setRenderError('Could not render complex diagram graph. Showing structured flow.');
    } finally {
      setIsRendering(false);
    }
  };

  useEffect(() => {
    renderDiagram();
  }, [chartDefinition]);

  const handleDownload = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'project-saathi-architecture.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <div
      style={{
        marginTop: '16px',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        background: '#FFFFFF',
        overflow: 'hidden'
      }}
    >
      {/* Header Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: '#F8FAFC',
          borderBottom: '1px solid var(--color-border)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={15} color="var(--color-primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
            System Architecture
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                background: '#FFFFFF',
                border: '1px solid var(--color-border)'
              }}
              title="Regenerate Diagram"
            >
              <RefreshCw size={12} className={isRendering ? 'animate-spin' : ''} />
              Regenerate
            </button>
          )}

          <button
            onClick={() => setIsExpanded(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              background: '#FFFFFF',
              border: '1px solid var(--color-border)'
            }}
            title="Expand Diagram"
          >
            <Maximize2 size={12} />
            Expand
          </button>

          <button
            onClick={handleDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: downloaded ? '#166534' : 'var(--color-text-muted)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              background: downloaded ? '#DCFCE7' : '#FFFFFF',
              border: '1px solid var(--color-border)'
            }}
            title="Download SVG Diagram"
          >
            {downloaded ? <Check size={12} /> : <Download size={12} />}
            {downloaded ? 'Downloaded' : 'Download'}
          </button>
        </div>
      </div>

      {/* Diagram Canvas */}
      <div
        ref={containerRef}
        style={{
          padding: '24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '220px',
          overflowX: 'auto',
          background: '#FAFAFA'
        }}
      >
        {isRendering ? (
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} className="animate-spin" /> Rendering diagram...
          </div>
        ) : renderError ? (
          <div style={{ padding: '16px', background: '#FEF2F2', color: '#991B1B', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
            {renderError}
          </div>
        ) : svgContent ? (
          <div
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Diagram will appear here
          </div>
        )}
      </div>

      {/* Modal for Expanded View */}
      {isExpanded && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px'
          }}
          onClick={() => setIsExpanded(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '960px',
              width: '100%',
              padding: '24px',
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                System Architecture — Expanded View
              </h3>
              <button onClick={() => setIsExpanded(false)} style={{ padding: '6px' }}>
                ✕
              </button>
            </div>
            <div
              style={{ overflowX: 'auto', padding: '20px', background: '#FAFAFA', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'center' }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
