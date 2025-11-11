import React from "react";
import { Users, FileText, Clock, Grid, Settings, Plus, LogOut, ChevronRight, BarChart3, ChevronDown } from "lucide-react";
import { motion } from "framer-motion"; // Assume framer-motion is available/imported in your actual file

// Define consistent primary color variable for theme cohesion
// In your global CSS or Tailwind config, ensure --primary is set (e.g., #14B8A6 - modern teal)
const PRIMARY_COLOR_CLASS = "text-teal-600";
const BG_ACCENT_CLASS = "bg-teal-50";

// Custom Motion Component for Button Hover/Tap Effects
const MotionButton = motion.button;

export default function Sidebar({ items = [], className = "" }) {
  return (
    <aside
      className={`w-64 bg-white border-r border-gray-200 min-h-screen p-4 flex flex-col shadow-lg transition-all duration-300 ${className}`}
    >
      
      {/* Top Padding / Placeholder for Logo/Title */}
      <div className="mb-4 pt-2">
        <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
             <BarChart3 className="w-6 h-6 text-gray-700" /> Dashboard
        </h1>
      </div>

      {/* --- Navigation Menu --- */}
      <nav className="space-y-2 flex-grow">
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
                it.onClick && it.onClick();
              }}
              // Motion Props for interaction effects
              whileHover={{ scale: it.isDanger ? 1.02 : 1.03, x: it.isPrimary ? 0 : 4 }}
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
  );
}