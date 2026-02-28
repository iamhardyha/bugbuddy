'use client';

import {
  useRef,
  useState,
  useCallback,
  type DragEvent,
  type ClipboardEvent,
  type ChangeEvent,
} from 'react';
import { uploadImage } from '@/lib/uploads';
import MarkdownRenderer from './MarkdownRenderer';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onUpload?: (uploadId: number) => void;
  placeholder?: string;
  minRows?: number;
  required?: boolean;
}

type Tab = 'write' | 'preview';

type ToolbarAction =
  | { type: 'wrap'; before: string; after: string; placeholder: string }
  | { type: 'block'; prefix: string; placeholder: string }
  | { type: 'codeblock' };

const TOOLBAR: { label: string; title: string; action: ToolbarAction }[] = [
  {
    label: 'B',
    title: '굵게 (Bold)',
    action: { type: 'wrap', before: '**', after: '**', placeholder: '굵은 텍스트' },
  },
  {
    label: 'I',
    title: '기울임 (Italic)',
    action: { type: 'wrap', before: '*', after: '*', placeholder: '기울임 텍스트' },
  },
  {
    label: '`코드`',
    title: '인라인 코드',
    action: { type: 'wrap', before: '`', after: '`', placeholder: '코드' },
  },
  {
    label: '```',
    title: '코드 블록',
    action: { type: 'codeblock' },
  },
  {
    label: '링크',
    title: '링크 삽입',
    action: { type: 'wrap', before: '[', after: '](url)', placeholder: '링크 텍스트' },
  },
  {
    label: '인용',
    title: '인용 블록',
    action: { type: 'block', prefix: '> ', placeholder: '인용 텍스트' },
  },
];

export default function MarkdownEditor({
  value,
  onChange,
  onUpload,
  placeholder = '마크다운으로 작성하세요\n이미지는 붙여넣기, 드래그앤드롭, 또는 이미지 버튼으로 첨부할 수 있어요',
  minRows = 12,
  required = false,
}: Props) {
  const [tab, setTab] = useState<Tab>('write');
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertText = useCallback(
    (insertFn: (current: string, selStart: number, selEnd: number) => [string, number, number]) => {
      const ta = textareaRef.current;
      if (!ta) return;

      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const [next, nextStart, nextEnd] = insertFn(value, start, end);

      onChange(next);

      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(nextStart, nextEnd);
      });
    },
    [value, onChange]
  );

  function handleToolbar(action: ToolbarAction) {
    insertText((cur, s, e) => {
      const selected = cur.slice(s, e);

      if (action.type === 'wrap') {
        const inner = selected || action.placeholder;
        const next = cur.slice(0, s) + action.before + inner + action.after + cur.slice(e);
        const ns = s + action.before.length;
        const ne = ns + inner.length;
        return [next, ns, ne];
      }

      if (action.type === 'block') {
        const inner = selected || action.placeholder;
        const next = cur.slice(0, s) + action.prefix + inner + cur.slice(e);
        const ns = s + action.prefix.length;
        const ne = ns + inner.length;
        return [next, ns, ne];
      }

      const lang = '';
      const inner = selected || '코드를 입력하세요';
      const block = `\`\`\`${lang}\n${inner}\n\`\`\``;
      const next = cur.slice(0, s) + block + cur.slice(e);
      const ns = s + 3;
      const ne = ns + lang.length;
      return [next, ns, ne];
    });
  }

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;

      setUploading(true);
      const result = await uploadImage(file);
      setUploading(false);

      if (!result) {
        alert('이미지 업로드에 실패했습니다.');
        return;
      }

      onUpload?.(result.uploadId);

      insertText((cur, s, _e) => {
        const markdown = `![${result.originalFilename}](${result.fileUrl})`;
        const next = cur.slice(0, s) + markdown + cur.slice(s);
        return [next, s + markdown.length, s + markdown.length];
      });
    },
    [insertText, onUpload]
  );

  function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(i => i.type.startsWith('image/'));
    if (!imageItem) return;

    e.preventDefault();
    const file = imageItem.getAsFile();
    if (file) handleImageUpload(file);
  }

  function handleDragOver(e: DragEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    setIsDragging(true);
  }
  function handleDragLeave() {
    setIsDragging(false);
  }
  function handleDrop(e: DragEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleImageUpload(file);
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
    e.target.value = '';
  }

  return (
    <div className="editor-wrap">
      {/* 탭 + 툴바 헤더 */}
      <div className="editor-header">
        {/* 탭 */}
        <div style={{ display: 'flex', gap: '2px' }}>
          <button
            type="button"
            onClick={() => setTab('write')}
            className={`editor-tab ${tab === 'write' ? 'active' : ''}`}
          >
            작성
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`editor-tab ${tab === 'preview' ? 'active' : ''}`}
          >
            미리보기
          </button>
        </div>

        {/* 툴바 */}
        {tab === 'write' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'wrap' }}>
            {TOOLBAR.map(({ label, title, action }) => (
              <button
                key={label}
                type="button"
                title={title}
                onClick={() => handleToolbar(action)}
                className="editor-toolbar-btn"
              >
                {label}
              </button>
            ))}

            <span className="editor-divider" />

            <button
              type="button"
              title="이미지 첨부"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="editor-toolbar-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', opacity: uploading ? 0.5 : 1 }}
            >
              {uploading ? (
                <>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      border: '2px solid var(--border-strong)',
                      borderTopColor: 'var(--accent)',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                  업로드 중
                </>
              ) : (
                <>
                  <svg style={{ width: '13px', height: '13px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  이미지
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
          </div>
        )}
      </div>

      {/* 에디터 / 미리보기 영역 */}
      {tab === 'write' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onPaste={handlePaste}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          placeholder={placeholder}
          required={required}
          rows={minRows}
          className="editor-textarea"
          style={isDragging ? { backgroundColor: 'var(--accent-subtle)' } : undefined}
        />
      ) : (
        <div
          className="editor-preview"
          style={{ minHeight: `calc(${minRows} * 1.7 * 13.5px + 28px)` }}
        >
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>미리볼 내용이 없습니다.</p>
          )}
        </div>
      )}

      {/* 하단 힌트 */}
      {tab === 'write' && (
        <div className="editor-footer">
          <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
            마크다운 지원 · 이미지는 붙여넣기(Ctrl+V) 또는 드래그앤드롭으로 첨부
          </p>
        </div>
      )}
    </div>
  );
}
