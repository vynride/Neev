import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';
import { Maximize2, Download, Check, X, Loader2 } from 'lucide-react';

// Light nodes with dark text, in the app's palette
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    background: '#FFFFFF',
    primaryColor: '#E3EDE6',
    primaryTextColor: '#1B1F1D',
    primaryBorderColor: '#1F4D3A',
    secondaryColor: '#F6E9E2',
    secondaryTextColor: '#1B1F1D',
    secondaryBorderColor: '#B8563C',
    tertiaryColor: '#F2EFE8',
    tertiaryTextColor: '#1B1F1D',
    tertiaryBorderColor: '#CFCABD',
    textColor: '#1B1F1D',
    nodeTextColor: '#1B1F1D',
    titleColor: '#1B1F1D',
    lineColor: '#66706A',
    edgeLabelBackground: '#FFFFFF',
    clusterBkg: '#FBFAF6',
    clusterBorder: '#CFCABD',
    actorBkg: '#E3EDE6',
    actorBorder: '#1F4D3A',
    actorTextColor: '#1B1F1D',
    signalColor: '#66706A',
    signalTextColor: '#1B1F1D',
    labelBoxBkgColor: '#F2EFE8',
    labelTextColor: '#1B1F1D',
    noteBkgColor: '#F6E9E2',
    noteBorderColor: '#E6C6B7',
    noteTextColor: '#1B1F1D',
    fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
    fontSize: '13px'
  },
  securityLevel: 'strict',
  flowchart: { curve: 'basis', useMaxWidth: true, htmlLabels: true, padding: 14 }
});

// The model often styles nodes itself (dark fills, white text). Dropping those lines keeps every
// diagram in one readable theme: dark text on light nodes.
const withoutInlineStyles = (definition) =>
  definition
    .split('\n')
    .filter((line) => !/^\s*(classDef|style|linkStyle)\s/.test(line))
    .map((line) => line.replace(/:::[\w-]+/g, ''))
    .join('\n');

const toolButton = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  fontSize: '0.72rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  padding: '4px 8px',
  borderRadius: 'var(--radius-sm)'
};

export const MermaidViewer = ({ chartDefinition }) => {
  const [svgContent, setSvgContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [renderError, setRenderError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      if (!chartDefinition) return;
      try {
        const id = `mermaid-saathi-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, withoutInlineStyles(chartDefinition));
        if (!cancelled) {
          setSvgContent(svg);
          setRenderError(false);
        }
      } catch {
        if (!cancelled) setRenderError(true);
      }
    };
    render();
    return () => {
      cancelled = true;
    };
  }, [chartDefinition]);

  const handleDownload = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diagram.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  // A diagram the model got wrong is still useful as text
  if (renderError) {
    return (
      <div className="code-block">
        <div className="code-block-bar"><span>diagram (could not be drawn)</span></div>
        <pre><code>{chartDefinition}</code></pre>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: '#FFFFFF', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px 6px 14px', borderBottom: '1px solid var(--color-border-subtle)' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-subtle)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Diagram
        </span>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button className="hover-row" onClick={() => setIsExpanded(true)} style={toolButton} title="Expand">
            <Maximize2 size={12} /> Expand
          </button>
          <button className="hover-row" onClick={handleDownload} style={toolButton} title="Download as SVG">
            {downloaded ? <Check size={12} /> : <Download size={12} />} {downloaded ? 'Saved' : 'Download'}
          </button>
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '160px', overflowX: 'auto' }}>
        {svgContent ? (
          <div className="fade-enter" style={{ width: '100%', display: 'flex', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: svgContent }} />
        ) : (
          <Loader2 size={18} className="animate-spin" color="var(--color-text-subtle)" />
        )}
      </div>

      {isExpanded && (
        <div
          className="fade-enter"
          style={{ position: 'fixed', inset: 0, background: 'rgba(27, 31, 29, 0.55)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px' }}
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="modal-enter"
            style={{ background: '#FFFFFF', borderRadius: 'var(--radius-lg)', maxWidth: '1200px', width: '100%', maxHeight: '90vh', overflow: 'auto', padding: '20px', boxShadow: 'var(--shadow-lg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button className="hover-row" onClick={() => setIsExpanded(false)} style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: svgContent }} />
          </div>
        </div>
      )}
    </div>
  );
};
