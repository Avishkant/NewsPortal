import { createContext, useContext, useRef, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    title: "Confirm",
    message: "Are you sure?",
    confirmLabel: "Yes",
    cancelLabel: "Cancel",
  });
  const resolverRef = useRef(null);

  const promptConfirm = (opts = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({ open: true, ...opts });
    });
  };

  const handleConfirm = () => {
    try {
      resolverRef.current && resolverRef.current(true);
    } finally {
      resolverRef.current = null;
      setState((s) => ({ ...s, open: false }));
    }
  };

  const handleCancel = () => {
    try {
      resolverRef.current && resolverRef.current(false);
    } finally {
      resolverRef.current = null;
      setState((s) => ({ ...s, open: false }));
    }
  };

  return (
    <ConfirmContext.Provider value={{ promptConfirm }}>
      {children}
      <ConfirmDialog
        open={state.open}
        title={state.title}
        message={state.message}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.promptConfirm;
};
