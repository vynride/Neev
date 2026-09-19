import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check } from 'lucide-react';
import { MermaidViewer } from '../architecture/MermaidViewer';

// Plain text of a highlighted code element (its children are nested <span>s)
const textOf = (node) => {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  return textOf(node.props?.children);
};

const CodeBlock = ({ language, children }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(textOf(children));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="code-block">
      <div className="code-block-bar">
        <span>{language || 'code'}</span>
        <button onClick={handleCopy}>
          {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre>{children}</pre>
    </div>
  );
};

// A ```mermaid block becomes a diagram; any other fenced block gets syntax highlighting
const Pre = ({ children }) => {
  const child = React.Children.toArray(children)[0];
  const language = /language-([\w-]+)/.exec(child?.props?.className || '')?.[1];
  if (language === 'mermaid') {
    return <MermaidViewer chartDefinition={textOf(child).trim()} />;
  }
  return <CodeBlock language={language}>{children}</CodeBlock>;
};

const ExternalLink = ({ href, children }) => (
  <a href={href} target="_blank" rel="noreferrer">{children}</a>
);

export const Markdown = ({ children }) => (
  <div className="md">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true, plainText: ['mermaid'] }]]}
      components={{ pre: Pre, a: ExternalLink }}
    >
      {children || ''}
    </ReactMarkdown>
  </div>
);
