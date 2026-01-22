/**
 * Toast 气泡提示组件
 */

import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const getStyles = () => {
    const baseStyles = 'min-w-[300px] max-w-md px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 transform transition-all duration-300';

    const typeStyles = {
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white',
      info: 'bg-blue-500 text-white',
      warning: 'bg-yellow-500 text-white'
    };

    const icons = {
      success: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      error: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      info: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      warning: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    };

    return (
      <div
        className={`${baseStyles} ${typeStyles[toast.type]} ${
          isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
        }`}
      >
        {icons[toast.type]}
        <span className="flex-1 text-sm font-medium">{toast.message}</span>
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => onRemove(toast.id), 300);
          }}
          className="p-1 hover:bg-white/20 rounded transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  };

  return getStyles();
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
};

// Hook for using toast
let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toastState: Toast[] = [];

export const showToast = (type: ToastType, message: string, duration?: number) => {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const newToast: Toast = { id, type, message, duration };

  toastState = [...toastState, newToast];
  toastListeners.forEach(listener => listener(toastState));

  return id;
};

export const removeToast = (id: string) => {
  toastState = toastState.filter(t => t.id !== id);
  toastListeners.forEach(listener => listener(toastState));
};

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    toastListeners.push(setToasts);
    setToasts(toastState);

    return () => {
      toastListeners = toastListeners.filter(l => l !== setToasts);
    };
  }, []);

  const show = (type: ToastType, message: string, duration?: number) => {
    return showToast(type, message, duration);
  };

  const remove = (id: string) => {
    removeToast(id);
  };

  return {
    toasts,
    show,
    remove,
    success: (message: string, duration?: number) => show('success', message, duration),
    error: (message: string, duration?: number) => show('error', message, duration),
    info: (message: string, duration?: number) => show('info', message, duration),
    warning: (message: string, duration?: number) => show('warning', message, duration)
  };
};

export default ToastContainer;
