'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ToastVariant = 'success' | 'info' | 'error';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastApi {
  showToast: (message: string, variant?: ToastVariant) => void;
}

export const TOAST_DURATION_MS = 3000;
export const MAX_VISIBLE_TOASTS = 3;

const ToastContext = createContext<ToastApi | null>(null);

const VARIANT_MARKER: Record<ToastVariant, { glyph: string; className: string }> = {
  success: { glyph: '✓', className: 'bg-success text-success-ink' },
  info: { glyph: 'i', className: 'bg-accent text-accent-ink' },
  error: { glyph: '!', className: 'bg-danger text-danger-ink' },
};

function ToastMessage({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const marker = VARIANT_MARKER[toast.variant];
  return (
    <div className="animate-toast-in pointer-events-auto flex max-w-[min(26rem,calc(100vw-2rem))] items-center gap-3 rounded-xl bg-toast px-4 py-3 text-sm font-medium text-toast-ink shadow-lg shadow-black/20">
      <span
        aria-hidden="true"
        className={`flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${marker.className}`}
      >
        {marker.glyph}
      </span>
      <span className="min-w-0 [overflow-wrap:anywhere]">{toast.message}</span>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = nextId.current;
      nextId.current += 1;
      // A repeat of a message already on screen replaces it (fresh timer)
      // instead of stacking, so rapid identical actions don't flood the stack.
      setToasts((current) =>
        [
          ...current.filter((toast) => toast.message !== message),
          { id, message, variant },
        ].slice(-MAX_VISIBLE_TOASTS),
      );
    },
    [],
  );

  const api = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => (
          <ToastMessage key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast must be used inside ToastProvider');
  return api;
}
