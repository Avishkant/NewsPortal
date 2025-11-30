import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useState } from "react";
import HeadlineMarquee from "./HeadlineMarquee.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search, LogOut, User } from "lucide-react";

// Define the custom primary and accent colors
const PRIMARY_VIVID_RED = "#1b0606ff"; // The requested background color
const SECONDARY_TEAL = "#14B8A6"; // Complementary accent color

// Custom Motion component for navigation links
const NavItem = ({ to, children, className = "" }) => (
  <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
    <Link
      to={to}
      className={`px-3 py-1 rounded hover:bg-white/20 transition duration-200 ${className}`}
    >
      {children}
    </Link>
  </motion.div>
);

export default function Header() {
  const { user, logout, promptLogout } = useAuth() || {};
  const [open, setOpen] = useState(false);

  // Determine dashboard link based on user role
  const dashboardLink = user?.role === "owner" ? "/owner" : "/reporter";

  return (
    <>
      {/* marquee sits just above the header/navbar */}
      <HeadlineMarquee />

      <header
        // Header BG uses the specified Vivid Red color
        className="sticky top-0 z-50 text-white shadow-xl transition-all duration-300 overflow-x-hidden"
        style={{ backgroundColor: PRIMARY_VIVID_RED }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* --- Logo & Desktop Nav --- */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              >
                <span className="font-extrabold text-xl text-white">N</span>
              </motion.div>
              <div className="text-xl font-extrabold tracking-tight">
                News<span style={{ color: SECONDARY_TEAL }}>Hub</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-3 ml-6 font-medium">
              <NavItem to="/news" className="hover:text-white">
                All News
              </NavItem>
              <NavItem to="/about" className="text-slate-200 hover:text-white">
                About
              </NavItem>
              <NavItem
                to="/about#contact"
                className="text-slate-200 hover:text-white"
              >
                Contact
              </NavItem>
            </nav>
          </div>

          {/* --- Actions & Auth --- */}
          <div className="flex items-center gap-4">
            {/* Search Input (Desktop) */}
            <div className="hidden sm:block">
              <input
                placeholder="Search news..."
                className="px-3 py-2 rounded-full bg-white/20 placeholder:text-white/70 text-white focus:bg-white/30 focus:ring-2"
                style={{ borderColor: SECONDARY_TEAL, color: SECONDARY_TEAL }}
              />
            </div>

            {/* Auth/User Actions */}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold text-white hidden lg:block">
                  {user.name}
                </div>
                <NavItem
                  to={dashboardLink}
                  className="bg-white/10 hover:bg-white/20"
                >
                  <User className="w-4 h-4 inline mr-1" /> Dashboard
                </NavItem>
                <motion.button
                  onClick={() => {
                    try {
                      if (promptLogout) promptLogout();
                      else if (logout) logout();
                    } catch (e) {
                      console.warn("Logout failed", e);
                    }
                  }}
                  className="px-3 py-2 rounded-lg font-medium transition shadow-md"
                  style={{ backgroundColor: SECONDARY_TEAL }} // Use Teal for contrast logout button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut className="w-4 h-4 inline mr-1" /> Logout
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Link
                    to="/login"
                    // Button primary: White text on Secondary Accent BG (Teal)
                    className="px-3 py-2 rounded-lg font-medium shadow-md"
                    style={{ backgroundColor: SECONDARY_TEAL, color: "white" }}
                  >
                    Sign in
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Link
                    to="/signup"
                    // Button secondary: White text on White border for subtlety
                    className="px-3 py-2 border border-white/30 text-white rounded-lg font-medium hover:bg-white/10"
                  >
                    Create account
                  </Link>
                </motion.div>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden ml-2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              {open ? (
                <X className="h-6 w-6 text-white" />
              ) : (
                <Menu className="h-6 w-6 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* --- Mobile menu --- */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-gray-900/90 backdrop-blur-sm overflow-hidden"
            >
              <div className="px-4 py-3 flex flex-col gap-2 text-white text-base font-medium">
                <Link
                  to="/news"
                  className="px-2 py-2 rounded hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  All News
                </Link>
                <Link
                  to="/about"
                  className="px-2 py-2 rounded hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  About
                </Link>
                <Link
                  to="/about#contact"
                  className="px-2 py-2 rounded hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  Contact
                </Link>

                {user && (
                  <>
                    <Link
                      to={dashboardLink}
                      className="px-2 py-2 rounded hover:bg-white/10"
                      onClick={() => setOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        try {
                          if (promptLogout) promptLogout();
                          else if (logout) logout();
                        } catch (e) {
                          console.warn("Logout failed", e);
                        }
                        setOpen(false);
                      }}
                      className="text-left px-2 py-2 rounded text-rose-400 hover:bg-white/10"
                    >
                      Logout
                    </button>
                  </>
                )}
                {!user && (
                  <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-700">
                    <Link
                      to="/login"
                      className="px-2 py-2 rounded font-semibold text-center"
                      style={{ backgroundColor: SECONDARY_TEAL }}
                      onClick={() => setOpen(false)}
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/signup"
                      className="px-2 py-2 rounded border border-white/20 hover:bg-white/10 text-center"
                      onClick={() => setOpen(false)}
                    >
                      Create account
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Global ConfirmDialog handled by AuthContext.promptLogout() */}
      </header>
    </>
  );
}
