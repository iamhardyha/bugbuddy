'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

// ── 타입 ────────────────────────────────────────────────────────────────────

type ModalVariant = 'danger' | 'warning' | 'info' | 'success';

export interface AlertOptions {
  title: string;
  message?: string;
  variant?: ModalVariant;
  confirmLabel?: string;
}

export interface ConfirmOptions {
  title: string;
  message?: string;
  variant?: ModalVariant;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface ModalContextValue {
  alert: (opts: AlertOptions) => Promise<void>;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

// ── Context ─────────────────────────────────────────────────────────────────

const ModalContext = createContext<ModalContextValue | null>(null);

// ── 아이콘 SVG ───────────────────────────────────────────────────────────────

const ICONS: Record<ModalVariant, ReactNode> = {
  danger: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  warning: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  info: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
  success: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// ── 내부 상태 타입 ────────────────────────────────────────────────────────────

interface ModalState {
  type: 'alert' | 'confirm';
  title: string;
  message?: string;
  variant: ModalVariant;
  confirmLabel: string;
  cancelLabel?: string;
  resolve: (value: boolean) => void;
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState | null>(null);
  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  const openModal = useCallback((state: ModalState) => {
    resolveRef.current = state.resolve;
    setModal(state);
  }, []);

  const close = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setModal(null);
  }, []);

  const alert = useCallback(
    (opts: AlertOptions): Promise<void> =>
      new Promise<void>(resolve => {
        openModal({
          type: 'alert',
          title: opts.title,
          message: opts.message,
          variant: opts.variant ?? 'info',
          confirmLabel: opts.confirmLabel ?? '확인',
          resolve: () => resolve(),
        });
      }),
    [openModal]
  );

  const confirm = useCallback(
    (opts: ConfirmOptions): Promise<boolean> =>
      new Promise<boolean>(resolve => {
        openModal({
          type: 'confirm',
          title: opts.title,
          message: opts.message,
          variant: opts.variant ?? 'info',
          confirmLabel: opts.confirmLabel ?? '확인',
          cancelLabel: opts.cancelLabel ?? '취소',
          resolve,
        });
      }),
    [openModal]
  );

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') close(false);
    if (e.key === 'Enter') close(true);
  }

  const confirmBtnStyle = modal
    ? modal.variant === 'danger'
      ? { background: 'var(--error-text)', color: '#fff', border: 'none' }
      : modal.variant === 'warning'
      ? { background: 'var(--warning-text)', color: '#fff', border: 'none' }
      : modal.variant === 'success'
      ? { background: 'var(--status-open)', color: '#fff', border: 'none' }
      : undefined
    : undefined;

  return (
    <ModalContext.Provider value={{ alert, confirm }}>
      {children}
      {modal && (
        <div
          className="modal-overlay"
          onClick={() => close(false)}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          tabIndex={-1}
        >
          <div
            className="modal-card"
            onClick={e => e.stopPropagation()}
          >
            {/* 아이콘 */}
            <div className={`modal-icon modal-icon-${modal.variant}`}>
              {ICONS[modal.variant]}
            </div>

            {/* 제목 */}
            <p id="modal-title" className="modal-title">
              {modal.title}
            </p>

            {/* 메시지 */}
            {modal.message && (
              <p className="modal-message">{modal.message}</p>
            )}

            {/* 버튼 */}
            <div className="modal-actions">
              {modal.type === 'confirm' && (
                <button
                  className="ghost-btn"
                  style={{ padding: '8px 18px' }}
                  onClick={() => close(false)}
                  autoFocus
                >
                  {modal.cancelLabel}
                </button>
              )}
              <button
                className="accent-btn"
                style={{ padding: '8px 18px', ...confirmBtnStyle }}
                onClick={() => close(true)}
                autoFocus={modal.type === 'alert'}
              >
                {modal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

// ── 훅 ──────────────────────────────────────────────────────────────────────

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error('useModal은 ModalProvider 하위에서만 사용할 수 있습니다.');
  }
  return ctx;
}
