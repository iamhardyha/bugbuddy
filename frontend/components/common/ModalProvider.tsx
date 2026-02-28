import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Modal, Button, Flex, Typography } from 'antd';
import {
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

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

// ── 아이콘 ───────────────────────────────────────────────────────────────────

const ICONS: Record<ModalVariant, ReactNode> = {
  danger:  <ExclamationCircleOutlined style={{ fontSize: 22 }} />,
  warning: <WarningOutlined style={{ fontSize: 22 }} />,
  info:    <InfoCircleOutlined style={{ fontSize: 22 }} />,
  success: <CheckCircleOutlined style={{ fontSize: 22 }} />,
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

  /* 확인 버튼 variant별 스타일 */
  const confirmBtnStyle =
    modal?.variant === 'warning'
      ? { background: 'var(--warning-text)', borderColor: 'var(--warning-text)' }
      : modal?.variant === 'success'
      ? { background: 'var(--status-open)', borderColor: 'var(--status-open)' }
      : undefined;

  return (
    <ModalContext.Provider value={{ alert, confirm }}>
      {children}

      <Modal
        open={!!modal}
        footer={null}
        closable={false}
        centered
        width={420}
        onCancel={() => close(false)}
        destroyOnHidden
        styles={{ body: { padding: 0 } }}
      >
        {modal && (
          <Flex vertical align="center" style={{ padding: '28px 24px 20px' }}>
            {/* 아이콘 */}
            <div className={`modal-icon modal-icon-${modal.variant}`}>
              {ICONS[modal.variant]}
            </div>

            {/* 제목 */}
            <Title level={5} style={{ margin: '0 0 4px', textAlign: 'center' }}>
              {modal.title}
            </Title>

            {/* 메시지 */}
            {modal.message && (
              <Text type="secondary" style={{ fontSize: 13, textAlign: 'center', marginBottom: 4 }}>
                {modal.message}
              </Text>
            )}

            {/* 버튼 */}
            <Flex gap={8} justify="center" style={{ marginTop: 20 }}>
              {modal.type === 'confirm' && (
                <Button onClick={() => close(false)}>
                  {modal.cancelLabel}
                </Button>
              )}
              <Button
                type="primary"
                danger={modal.variant === 'danger'}
                style={confirmBtnStyle}
                onClick={() => close(true)}
                autoFocus={modal.type === 'alert'}
              >
                {modal.confirmLabel}
              </Button>
            </Flex>
          </Flex>
        )}
      </Modal>
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
