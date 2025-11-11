import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const containerRef = useRef(null);

  const showToast = useCallback(({ type = "success", message = "" }) => {
    const id = Date.now() + Math.random();
    const t = { id, type, message };
    setToasts((s) => [t, ...s]);
    setTimeout(() => {
      setToasts((s) => s.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((s) => s.filter((t) => t.id !== id));
  }, []);

  // keyboard handling: Escape clears the newest toast or closes all toasts when Shift+Esc
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (e.shiftKey) setToasts([]);
        else setToasts((s) => (s.length ? s.slice(1) : s));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        ref={containerRef}
        aria-live="polite"
        aria-atomic="true"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            tabIndex={0}
            className={`shadow-lg rounded px-4 py-2 text-white flex justify-between items-start gap-4 ${
              t.type === "error" ? "bg-red-600" : "bg-green-600"
            }`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="flex-1 text-sm">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="opacity-80 hover:opacity-100 ml-2 text-xs"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export default ToastContext;
