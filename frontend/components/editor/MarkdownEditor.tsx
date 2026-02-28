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
  placeholder?: string;
  minRows?: number;
  required?: boolean;
}

type Tab = 'write' | 'preview';

// ── 툴바 액션 타입 ──────────────────────────────────────────────
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
  placeholder = '마크다운으로 작성하세요\n이미지는 붙여넣기, 드래그앤드롭, 또는 이미지 버튼으로 첨부할 수 있어요',
  minRows = 12,
  required = false,
}: Props) {
  const [tab, setTab] = useState<Tab>('write');
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 텍스트 삽입 헬퍼 ────────────────────────────────────────
  const insertText = useCallback(
    (insertFn: (current: string, selStart: number, selEnd: number) => [string, number, number]) => {
      const ta = textareaRef.current;
      if (!ta) return;

      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const [next, nextStart, nextEnd] = insertFn(value, start, end);

      onChange(next);

      // 커서 위치 복원 (다음 tick)
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(nextStart, nextEnd);
      });
    },
    [value, onChange]
  );

  // ── 툴바 버튼 클릭 ──────────────────────────────────────────
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

      // codeblock
      const lang = '';
      const inner = selected || '코드를 입력하세요';
      const block = `\`\`\`${lang}\n${inner}\n\`\`\``;
      const next = cur.slice(0, s) + block + cur.slice(e);
      const ns = s + 3; // ``` 다음 위치 (언어 입력 위치)
      const ne = ns + lang.length;
      return [next, ns, ne];
    });
  }

  // ── 이미지 업로드 & 마크다운 삽입 ──────────────────────────
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

      insertText((cur, s, _e) => {
        const markdown = `![${result.originalFilename}](${result.fileUrl})`;
        const next = cur.slice(0, s) + markdown + cur.slice(s);
        return [next, s + markdown.length, s + markdown.length];
      });
    },
    [insertText]
  );

  // ── 붙여넣기 이미지 감지 ────────────────────────────────────
  function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(i => i.type.startsWith('image/'));
    if (!imageItem) return;

    e.preventDefault();
    const file = imageItem.getAsFile();
    if (file) handleImageUpload(file);
  }

  // ── 드래그앤드롭 ────────────────────────────────────────────
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

  // ── 파일 input 변경 ─────────────────────────────────────────
  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
    e.target.value = '';
  }

  return (
    <div className="rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
      {/* 탭 + 툴바 헤더 */}
      <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-2 py-1.5 gap-2 flex-wrap">
        {/* 탭 */}
        <div className="flex">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={`px-3 py-1 text-xs rounded-md transition-colors font-medium ${
              tab === 'write'
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            작성
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`px-3 py-1 text-xs rounded-md transition-colors font-medium ${
              tab === 'preview'
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            미리보기
          </button>
        </div>

        {/* 툴바 (작성 탭에서만 표시) */}
        {tab === 'write' && (
          <div className="flex items-center gap-0.5 flex-wrap">
            {TOOLBAR.map(({ label, title, action }) => (
              <button
                key={label}
                type="button"
                title={title}
                onClick={() => handleToolbar(action)}
                className="px-2 py-1 text-xs font-mono text-gray-600 hover:bg-gray-200 rounded transition-colors"
              >
                {label}
              </button>
            ))}

            {/* 구분선 */}
            <span className="w-px h-4 bg-gray-300 mx-1" />

            {/* 이미지 업로드 버튼 */}
            <button
              type="button"
              title="이미지 첨부"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                  업로드 중
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="hidden"
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
          className={`w-full px-4 py-3 text-sm font-mono leading-relaxed resize-y outline-none bg-white text-gray-900 placeholder:text-gray-400 transition-colors ${
            isDragging ? 'bg-blue-50' : ''
          }`}
        />
      ) : (
        <div className="min-h-[calc(var(--min-rows,12)*1.625rem+1.5rem)] px-4 py-3 bg-white"
          style={{ '--min-rows': minRows } as React.CSSProperties}
        >
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-sm text-gray-400">미리볼 내용이 없습니다.</p>
          )}
        </div>
      )}

      {/* 하단 힌트 */}
      {tab === 'write' && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-1.5">
          <p className="text-xs text-gray-400">
            마크다운 지원 · 이미지는 붙여넣기(Ctrl+V) 또는 드래그앤드롭으로 첨부
          </p>
        </div>
      )}
    </div>
  );
}
