'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

interface Props {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: Props) {
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 코드 블록
          pre({ children, ...props }) {
            return (
              <pre
                {...props}
                className="rounded-lg bg-gray-950 p-4 overflow-x-auto text-xs leading-relaxed"
              >
                {children}
              </pre>
            );
          },
          // 인라인 코드
          code({ children, className, ...props }) {
            const isBlock = className?.startsWith('language-');
            if (isBlock) {
              return <code className={`${className} text-gray-100`} {...props}>{children}</code>;
            }
            return (
              <code
                {...props}
                className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-rose-600"
              >
                {children}
              </code>
            );
          },
          // 이미지: 반응형
          img({ src, alt, ...props }) {
            return (
              <img
                src={src}
                alt={alt ?? ''}
                {...props}
                className="rounded-lg max-w-full border border-gray-200"
                loading="lazy"
              />
            );
          },
          // 링크: 새 탭
          a({ href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                {...props}
                className="text-blue-600 hover:underline"
              >
                {children}
              </a>
            );
          },
          // 인용
          blockquote({ children, ...props }) {
            return (
              <blockquote
                {...props}
                className="border-l-4 border-gray-300 pl-4 text-gray-500 italic my-4"
              >
                {children}
              </blockquote>
            );
          },
          // 테이블
          table({ children, ...props }) {
            return (
              <div className="overflow-x-auto my-4">
                <table {...props} className="min-w-full text-sm border border-gray-200 rounded-lg">
                  {children}
                </table>
              </div>
            );
          },
          th({ children, ...props }) {
            return (
              <th {...props} className="bg-gray-50 px-4 py-2 text-left font-medium text-gray-700 border-b border-gray-200">
                {children}
              </th>
            );
          },
          td({ children, ...props }) {
            return (
              <td {...props} className="px-4 py-2 border-b border-gray-100">
                {children}
              </td>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
