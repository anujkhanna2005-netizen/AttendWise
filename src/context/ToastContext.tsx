import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

interface Toast {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  type?: 'info' | 'success' | 'error' | 'warning';
}

interface ToastContextType {
  showToast: (message: string, options?: { actionLabel?: string; onAction?: () => void; type?: 'info' | 'success' | 'error' | 'warning' }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, options?: { actionLabel?: string; onAction?: () => void; type?: 'info' | 'success' | 'error' | 'warning' }) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      message,
      actionLabel: options?.actionLabel,
      onAction: options?.onAction,
      type: options?.type || 'info',
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-20 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

// Interactive Draggable Swipe-to-Dismiss Toast Item
const ToastItem: React.FC<{ toast: Toast; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0, 100], [0, 1, 0]);

  const handleDragEnd = (_event: any, info: any) => {
    if (Math.abs(info.offset.x) > 60) {
      onDismiss();
    }
  };

  const borderColors: Record<string, string> = {
    info: 'border-primary/40',
    success: 'border-[#059669]/40',
    error: 'border-red-500/40',
    warning: 'border-[#d97706]/40',
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      style={{ x, opacity }}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      className={`pointer-events-auto flex items-center justify-between gap-4 w-full max-w-md p-4 rounded-token-md border bg-background/95 backdrop-blur-md shadow-elevation-3 ${borderColors[toast.type || 'info']} cursor-grab active:cursor-grabbing`}
    >
      <div className="flex items-center gap-2.5">
        <span className="material-symbols-outlined text-[18px] shrink-0" style={{
          color: toast.type === 'success' ? 'var(--color-success)' : toast.type === 'error' ? 'var(--color-danger)' : toast.type === 'warning' ? 'var(--color-warning)' : 'var(--color-primary-light)'
        }}>
          {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : toast.type === 'warning' ? 'warning' : 'info'}
        </span>
        <p className="font-body-sm text-[11px] tracking-wide text-on-surface line-clamp-2">
          {toast.message}
        </p>
      </div>

      {toast.actionLabel && toast.onAction && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toast.onAction?.();
            onDismiss();
          }}
          className="shrink-0 font-body-sm text-xs text-primary hover:text-primary-hover tracking-wide border border-primary/30 px-2.5 py-1.5 hover:bg-primary/5 active:scale-95 transition-all rounded-token-sm"
        >
          {toast.actionLabel}
        </button>
      )}
    </motion.div>
  );
};
