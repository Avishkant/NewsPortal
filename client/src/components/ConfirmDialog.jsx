import { useEffect } from "react";

export default function ConfirmDialog({
  open,
  title = "Confirm",
  message = "Are you sure?",
  confirmLabel = "Yes",
  cancelLabel = "Cancel",
  onConfirm = () => {},
  onCancel = () => {},
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        try {
          if (window && typeof window !== "undefined") {
            // analytics for cancel
            try {
              if (window.gtag) window.gtag("event", "logout_cancel", {});
              if (window.dataLayer)
                window.dataLayer.push({ event: "logout_cancel" });
            } catch (err) {
              // ignore analytics errors
            }
          }
        } catch (err) {}
        onCancel();
      }
      if (e.key === "Enter") {
        e.preventDefault();
        try {
          if (window && typeof window !== "undefined") {
            try {
              if (window.gtag) window.gtag("event", "logout_confirm", {});
              if (window.dataLayer)
                window.dataLayer.push({ event: "logout_confirm" });
            } catch (err) {}
          }
        } catch (err) {}
        onConfirm();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6"
      >
        <h3 id="confirm-title" className="text-lg font-semibold mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
            onClick={() => {
              try {
                if (window && typeof window !== "undefined") {
                  try {
                    if (window.gtag) window.gtag("event", "logout_cancel", {});
                    if (window.dataLayer)
                      window.dataLayer.push({ event: "logout_cancel" });
                  } catch (err) {}
                }
              } catch (err) {}
              onCancel();
            }}
          >
            {cancelLabel}
          </button>
          <button
            className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            onClick={() => {
              try {
                if (window && typeof window !== "undefined") {
                  try {
                    if (window.gtag) window.gtag("event", "logout_confirm", {});
                    if (window.dataLayer)
                      window.dataLayer.push({ event: "logout_confirm" });
                  } catch (err) {}
                }
              } catch (err) {}
              onConfirm();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
