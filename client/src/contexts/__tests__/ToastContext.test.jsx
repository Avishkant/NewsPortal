import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast } from "../ToastContext.jsx";

function TestTrigger() {
  const { showToast } = useToast();
  return (
    <div>
      <button
        onClick={() => showToast({ type: "success", message: "Hello Toast" })}
      >
        Trigger
      </button>
    </div>
  );
}

describe("ToastContext", () => {
  it("shows a toast when showToast is called", async () => {
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>
    );

    const btn = screen.getByText("Trigger");
    await userEvent.click(btn);

    const toast = await screen.findByText("Hello Toast");
    expect(toast).toBeInTheDocument();
  });
});
