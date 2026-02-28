'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark-dimmed.css';

interface Props {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: Props) {
  return (
    <div className={`md-prose ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          pre({ children, ...props }) {
            return (
              <pre {...props}>
                {children}
              </pre>
            );
          },
          code({ children, className: codeClass, ...props }) {
            const isBlock = codeClass?.startsWith('language-');
            if (isBlock) {
              return <code className={codeClass} {...props}>{children}</code>;
            }
            return <code {...props}>{children}</code>;
          },
          img({ src, alt, ...props }) {
            return (
              <img
                src={src}
                alt={alt ?? ''}
                {...props}
                loading="lazy"
              />
            );
          },
          a({ href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            );
          },
          blockquote({ children, ...props }) {
            return <blockquote {...props}>{children}</blockquote>;
          },
          table({ children, ...props }) {
            return (
              <div style={{ overflowX: 'auto' }}>
                <table {...props}>{children}</table>
              </div>
            );
          },
          th({ children, ...props }) {
            return <th {...props}>{children}</th>;
          },
          td({ children, ...props }) {
            return <td {...props}>{children}</td>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
