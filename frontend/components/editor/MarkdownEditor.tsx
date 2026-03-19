'use client';

import {
  useRef,
  useState,
  useCallback,
  type DragEvent,
  type ClipboardEvent,
  type ChangeEvent,
} from 'react';
import { Button, Flex, Segmented, Typography } from 'antd';
import { PictureOutlined, LoadingOutlined } from '@ant-design/icons';
import { uploadImage } from '@/lib/uploads';
import MarkdownRenderer from './MarkdownRenderer';
import styles from './MarkdownEditor.module.css';

const { Text } = Typography;

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

const TOOLBAR: { label: string; title: string; action: ToolbarAction; style?: React.CSSProperties }[] = [
  {
    label: 'B',
    title: '굵게 (Bold)',
    action: { type: 'wrap', before: '**', after: '**', placeholder: '굵은 텍스트' },
    style: { fontWeight: 700 },
  },
  {
    label: 'I',
    title: '기울임 (Italic)',
    action: { type: 'wrap', before: '*', after: '*', placeholder: '기울임 텍스트' },
    style: { fontStyle: 'italic' },
  },
  {
    label: '`코드`',
    title: '인라인 코드',
    action: { type: 'wrap', before: '`', after: '`', placeholder: '코드' },
    style: { fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11 },
  },
  {
    label: '```',
    title: '코드 블록',
    action: { type: 'codeblock' },
    style: { fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11 },
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
    <div className={styles.wrap}>
      {/* 탭 + 툴바 헤더 */}
      <div className={styles.editorHeader}>
        {/* 탭 */}
        <Segmented
          value={tab}
          onChange={v => setTab(v as Tab)}
          size="small"
          options={[
            { label: '작성', value: 'write' },
            { label: '미리보기', value: 'preview' },
          ]}
        />

        {/* 툴바 */}
        {tab === 'write' && (
          <Flex align="center" gap={2} wrap>
            {TOOLBAR.map(({ label, title, action, style }) => (
              <Button
                key={label}
                type="text"
                size="small"
                title={title}
                onClick={() => handleToolbar(action)}
                style={style}
              >
                {label}
              </Button>
            ))}

            <div className={styles.divider} />

            <Button
              type="text"
              size="small"
              title="이미지 첨부"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              icon={uploading ? <LoadingOutlined spin /> : <PictureOutlined />}
            >
              이미지
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
          </Flex>
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
          className={styles.textarea}
          style={isDragging ? { backgroundColor: 'var(--accent-subtle)' } : undefined}
        />
      ) : (
        <div
          className={styles.preview}
          style={{ minHeight: `calc(${minRows} * 1.7 * 13.5px + 28px)` }}
        >
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <Text type="secondary" style={{ fontSize: '13px' }}>미리볼 내용이 없습니다.</Text>
          )}
        </div>
      )}

      {/* 하단 힌트 */}
      {tab === 'write' && (
        <div className={styles.footer}>
          <Text type="secondary" style={{ fontSize: '11.5px' }}>
            마크다운 지원 · 이미지는 붙여넣기(Ctrl+V) 또는 드래그앤드롭으로 첨부
          </Text>
        </div>
      )}
    </div>
  );
}
