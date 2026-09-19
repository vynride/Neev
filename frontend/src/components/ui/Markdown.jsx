import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MermaidViewer } from '../architecture/MermaidViewer';

// Renders the AI mentor's markdown. A ```mermaid block becomes a diagram.
const Pre = ({ children }) => {
  const child = React.Children.toArray(children)[0];
  const className = child?.props?.className || '';
  if (className.includes('language-mermaid')) {
    return <MermaidViewer chartDefinition={String(child.props.children).trim()} />;
  }
  return <pre>{children}</pre>;
};

const ExternalLink = ({ href, children }) => (
  <a href={href} target="_blank" rel="noreferrer">{children}</a>
);

export const Markdown = ({ children }) => (
  <div className="md">
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ pre: Pre, a: ExternalLink }}>
      {children || ''}
    </ReactMarkdown>
  </div>
);
