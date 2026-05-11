'use client';

import {
  createContext, useCallback, useContext, useEffect, useRef, useState
} from 'react';

// ===== Toast (kısa bildirim) =====
export type ToastType = 'success' | 'error' | 'info';
type Toast = { id: number; type: ToastType; message: string };

// ===== Confirm (onay modalı) =====
export type ConfirmOpts = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;     // tehlikeli işlem (sil vs.) → kırmızı buton
};

type UIContextType = {
  toast:   (message: string, type?: ToastType) => void;
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
};

const UIContext = createContext<UIContextType>({
  toast:   () => {},
  confirm: () => Promise.resolve(false)
});

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<{
    opts: ConfirmOpts;
    resolve: (v: boolean) => void;
  } | null>(null);

  const idRef = useRef(0);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const confirm = useCallback((opts: ConfirmOpts): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ opts, resolve });
    });
  }, []);

  function handleConfirm(value: boolean) {
    if (confirmState) {
      confirmState.resolve(value);
      setConfirmState(null);
    }
  }

  return (
    <UIContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast container — sağ üst */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t}
            onClose={() => setToasts((p) => p.filter((x) => x.id !== t.id))} />
        ))}
      </div>

      {/* Confirm modal */}
      {confirmState && (
        <ConfirmModal
          opts={confirmState.opts}
          onYes={() => handleConfirm(true)}
          onNo={() => handleConfirm(false)}
        />
      )}
    </UIContext.Provider>
  );
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const styles = {
    success: 'border-accent text-accent',
    error:   'border-red-500 text-red-300',
    info:    'border-accent2 text-accent2'
  } as const;
  const icons = { success: '✓', error: '✕', info: 'ℹ' } as const;

  return (
    <div className={`pointer-events-auto rounded-lg border-2 p-3 shadow-2xl
                     bg-panel/95 backdrop-blur flex items-center gap-3
                     animate-toast-in ${styles[toast.type]}`}>
      <span className="text-lg leading-none">{icons[toast.type]}</span>
      <div className="flex-1 text-sm text-text">{toast.message}</div>
      <button onClick={onClose}
        className="text-muted hover:text-text leading-none">✕</button>
    </div>
  );
}

function ConfirmModal({ opts, onYes, onNo }: {
  opts: ConfirmOpts;
  onYes: () => void;
  onNo: () => void;
}) {
  // ESC ile kapatma
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onNo();
      if (e.key === 'Enter')  onYes();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onYes, onNo]);

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center
                    bg-black/70 backdrop-blur-sm animate-modal-bg"
         onClick={onNo}>
      <div className="bg-panel border border-border rounded-2xl p-6 max-w-md w-full mx-4
                      shadow-2xl animate-modal-in"
           onClick={(e) => e.stopPropagation()}>
        {opts.title && (
          <h3 className="text-xl font-bold mb-2">{opts.title}</h3>
        )}
        <p className="text-muted leading-relaxed whitespace-pre-line">
          {opts.message}
        </p>
        <div className="mt-6 flex justify-end gap-2 flex-wrap">
          <button onClick={onNo}
            className="px-4 py-2 rounded-md border border-border hover:bg-card text-sm">
            {opts.cancelText ?? 'Vazgeç'}
          </button>
          <button onClick={onYes} autoFocus
            className={`px-4 py-2 rounded-md font-semibold text-sm
              ${opts.destructive
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-accent text-black hover:opacity-90'}`}>
            {opts.confirmText ?? 'Onayla'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useUI() {
  return useContext(UIContext);
}
