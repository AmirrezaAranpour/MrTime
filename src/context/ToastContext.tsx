import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type ShowToast = (message: string) => void;

const ToastContext = createContext<ShowToast | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const showToast = useCallback<ShowToast>((msg) => {
    setMessage(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className={`toast ${message ? '' : 'hidden'}`}>{message}</div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ShowToast {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
