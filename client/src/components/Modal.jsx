import { useEffect } from "react";

export default function Modal({ title, children, onClose, actions }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose && onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative bg-white dark:bg-slate-800 rounded-lg max-w-lg w-full p-4 shadow-lg z-10"
      >
        {title && (
          <div className="mb-2">
            <h3
              id="modal-title"
              className="text-lg font-semibold text-slate-900 dark:text-white"
            >
              {title}
            </h3>
          </div>
        )}

        <div className="mb-4 text-sm text-slate-700 dark:text-slate-300">
          {children}
        </div>

        {actions && <div className="flex justify-end gap-2">{actions}</div>}
      </div>
    </div>
  );
}
