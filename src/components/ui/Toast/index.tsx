import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './Toast.module.css';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id:      number;
  message: string;
  type:    ToastType;
}

interface ToastContextValue {
  success: (msg: string) => void;
  error:   (msg: string) => void;
  info:    (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let _id = 0;
const DURATION = 3500;

const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle size={16} />,
  error:   <XCircle    size={16} />,
  info:    <Info        size={16} />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const { t } = useTranslation('common');

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const push = useCallback(
    (message: string, type: ToastType) => {
      const id = ++_id;
      setToasts((prev) => [...prev, { id, message, type }]);
      timers.current[id] = setTimeout(() => dismiss(id), DURATION);
    },
    [dismiss],
  );

  const ctx: ToastContextValue = {
    success: (msg) => push(msg, 'success'),
    error:   (msg) => push(msg, 'error'),
    info:    (msg) => push(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className={styles.container} aria-live="polite" aria-label={t('aria.notifications')}>
        {toasts.map((toast) => (
          <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`} role="alert">
            <span className={styles.icon}>{ICONS[toast.type]}</span>
            <span className={styles.message}>{toast.message}</span>
            <button className={styles.close} onClick={() => dismiss(toast.id)} aria-label={t('actions.close')}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
