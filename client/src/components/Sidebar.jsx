import React, { useEffect, useRef } from "react";
import {
  Users,
  FileText,
  Clock,
  Grid,
  Settings,
  Plus,
  LogOut,
  ChevronRight,
  BarChart3,
  ChevronDown,
} from "lucide-react";
import { motion } from "framer-motion"; // Assume framer-motion is available/imported in your actual file

// Define consistent primary color variable for theme cohesion
// In your global CSS or Tailwind config, ensure --primary is set (e.g., #14B8A6 - modern teal)
const PRIMARY_COLOR_CLASS = "text-teal-600";
const BG_ACCENT_CLASS = "bg-teal-50";

// Custom Motion Component for Button Hover/Tap Effects
const MotionButton = motion.button;

export default function Sidebar({
  items = [],
  className = "",
  open = false,
  onClose = () => {},
}) {
  // Responsive sidebar: on small screens it becomes an overlay controlled by `open`.
  const asideRef = useRef(null);

  useEffect(() => {
    if (!open || !asideRef.current) return;
    const node = asideRef.current;
    const focusable = node.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (first && typeof first.focus === "function") first.focus();

    function onKey(e) {
      if (e.key === "Escape") {
        onClose && onClose();
      }
      if (e.key === "Tab") {
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Overlay for mobile when sidebar open */}
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity lg:hidden ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!open}
        onClick={() => onClose && onClose()}
      />

      <aside
        className={`
          fixed z-60 lg:z-30 top-0 left-0 h-full w-64 bg-white border-r border-gray-200 p-4 flex flex-col shadow-lg transition-transform duration-300
          transform
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:shadow-none lg:w-64 lg:flex
          ${className}
        `}
        aria-hidden={
          !open && typeof window !== "undefined" && window.innerWidth < 1024
        }
        ref={asideRef}
      >
        {/* Mobile close control */}
        <div className="lg:hidden mb-4 flex items-center justify-between">
          <h1 className="text-lg font-bold">Dashboard</h1>
          <button
            aria-label="Close menu"
            className="p-2 rounded bg-gray-100"
            onClick={() => onClose && onClose()}
          >
            <ChevronDown className="w-5 h-5 rotate-90" />
          </button>
        </div>

        {/* Top Padding / Placeholder for Logo/Title */}
        <div className="mb-4 pt-2 hidden lg:block">
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-gray-700" /> Dashboard
          </h1>
        </div>

        {/* --- Navigation Menu --- */}
        <nav
          className="space-y-2 flex-grow"
          role="navigation"
          aria-label="Main Sidebar Navigation"
        >
          {items.map((it, index) => (
            <React.Fragment key={it.key}>
              {/* Conditional Separator for better grouping */}
              {it.separator && (
                <div className="border-t border-gray-200 pt-2 mt-4 mb-2"></div>
              )}

              <MotionButton
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  try {
                    it.onClick && it.onClick();
                  } catch (err) {
                    console.warn("Sidebar item handler error", err);
                  }
                  // Close the sidebar on item click (useful for mobile/hamburger behavior)
                  try {
                    onClose && onClose();
                  } catch (err) {
                    /* ignore */
                  }
                }}
                // Motion Props for interaction effects
                whileHover={{
                  scale: it.isDanger ? 1.02 : 1.03,
                  x: it.isPrimary ? 0 : 4,
                }}
                whileTap={{ scale: 0.98 }}
                // Styling Classes (Active, Danger, Primary)
                className={`
                w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-250 ease-in-out text-gray-700 font-medium
                
                ${
                  // ACTIVE STATE
                  it.active
                    ? `${BG_ACCENT_CLASS} ${PRIMARY_COLOR_CLASS} font-bold shadow-sm border-l-4 border-teal-600`
                    : "hover:bg-gray-100 hover:text-gray-900"
                }
                
                ${
                  // PRIMARY ACTION (e.g., Create News)
                  it.isPrimary
                    ? "bg-teal-600 text-white hover:bg-teal-700 font-bold shadow-lg w-[95%] mx-auto mb-2" // Make primary stand out
                    : ""
                }
                
                ${
                  // DANGER ACTION (e.g., Logout)
                  it.isDanger
                    ? "bg-red-600 text-white hover:bg-red-700 font-bold shadow-md mt-6"
                    : ""
                }
              `}
              >
                {/* Icon Slot */}
                <span
                  className={`transition duration-200 flex-shrink-0 ${
                    it.active && !it.isPrimary && !it.isDanger
                      ? PRIMARY_COLOR_CLASS
                      : it.isPrimary || it.isDanger
                      ? "text-white"
                      : "text-gray-500 group-hover:text-gray-700"
                  }`}
                >
                  {it.icon || null}
                </span>

                {/* Label */}
                <span className="flex-1 text-sm overflow-hidden whitespace-nowrap text-ellipsis">
                  {it.label}
                </span>

                {/* Badge/Count */}
                {it.badge ? (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold transition duration-200 ${
                      it.active
                        ? "bg-white border border-teal-300 text-teal-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {it.badge}
                  </span>
                ) : null}

                {/* Active indicator */}
                {it.active && !it.isPrimary && (
                  <ChevronRight
                    className={`h-4 w-4 ${PRIMARY_COLOR_CLASS} transition duration-200`}
                  />
                )}
              </MotionButton>
            </React.Fragment>
          ))}
        </nav>

        {/* Note: Logout button is expected to be part of the `items` array with isDanger: true */}
      </aside>
    </>
  );
}
