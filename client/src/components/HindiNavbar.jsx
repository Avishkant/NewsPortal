import { Link } from "react-router-dom";
import logo from "../assets/logo.jpg";
import { Search, Menu, X, User, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { motion, AnimatePresence } from "framer-motion";
import HeadlineMarquee from "./HeadlineMarquee.jsx";
import { apiFetch } from "../api.js";

// Define the custom primary color
const PRIMARY_VIVID_RED = "#a61616ff"; // The requested background color
const SECONDARY_TEAL = "#0a6358ff"; // Secondary accent color for links/buttons

// Custom Motion component for navigation links (retained for motion)
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

export default function HindiNavbar() {
  const [categories, setCategories] = useState([
    { key: "home", label: "होम" },
    { key: "bharat", label: "भारत" },
    { key: "madhya-pradesh", label: "मध्य प्रदेश" },
    { key: "jila", label: "जिला", hasDropdown: true },
    { key: "sports", label: "खेल" },
    { key: "entertainment", label: "मनोरंजन" },
    { key: "business", label: "व्यापार" },
    { key: "politics", label: "राजनीति" },
    { key: "health", label: "स्वास्थ्य" },
    { key: "education", label: "शिक्षा" },
  ]);

  const [mpDistricts, setMpDistricts] = useState([
    { key: "indore", label: "इंदौर" },
    { key: "bhopal", label: "भोपाल" },
    { key: "ujjain", label: "उज्जैन" },
    { key: "gwalior", label: "ग्वालियर" },
    { key: "jabalpur", label: "जबलपुर" },
    { key: "satna", label: "सतना" },
    { key: "rewa", label: "रीवा" },
    { key: "hoshangabad", label: "होशंगाबाद" },
    { key: "shivpuri", label: "शिवपुरी" },
    { key: "sagar", label: "सागर" },
  ]);

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [districtsOpen, setDistrictsOpen] = useState(false); // desktop hover
  const [mobileDistrictsOpen, setMobileDistrictsOpen] = useState(false); // mobile toggle
  const navRef = useRef(null);
  const headerRef = useRef(null);
  const [navHeight, setNavHeight] = useState(0);
  const [isFixed, setIsFixed] = useState(false);
  const firstMenuLinkRef = useRef(null);
  const { user } = useAuth() || {};
  // refs and state for accessibility of district dropdown
  const districtButtonRef = useRef(null);
  const districtMenuRefs = useRef([]);
  const districtWrapperRef = useRef(null);

  // Close panels with Escape and focus management (Logic retained)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMobileSearchOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close district dropdown when clicking outside (desktop)
  useEffect(() => {
    function onDocClick(e) {
      if (!districtsOpen) return;
      const wrap = districtWrapperRef.current;
      if (!wrap) return;
      if (!wrap.contains(e.target)) {
        setDistrictsOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [districtsOpen]);

  useEffect(() => {
    if (mobileMenuOpen && firstMenuLinkRef.current) {
      setTimeout(() => firstMenuLinkRef.current.focus(), 50);
    }
  }, [mobileMenuOpen]);

  // measure nav position and height and toggle fixed state on scroll
  useEffect(() => {
    function measure() {
      if (!navRef.current) return;
      const navRect = navRef.current.getBoundingClientRect();
      setNavHeight(navRef.current.offsetHeight || navRect.height || 0);
    }

    function onScroll() {
      const hdrH = headerRef.current ? headerRef.current.offsetHeight : 0;
      setIsFixed(window.scrollY >= hdrH);
    }

    // initial measure
    measure();
    // measure on resize
    window.addEventListener("resize", measure);
    // update fixed state on scroll
    window.addEventListener("scroll", onScroll, { passive: true });

    // also run on load in case user refreshed mid-page
    onScroll();

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Fetch categories and districts from the server (data-driven)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cats = await apiFetch("/api/categories");
        if (mounted && Array.isArray(cats) && cats.length > 0) {
          setCategories(
            cats.map((c) => ({ key: c.slug || c._id || c.name, label: c.name }))
          );
        }
      } catch (err) {
        // ignore and keep fallback categories
        console.warn("Failed to load categories", err.message || err);
      }

      try {
        const d = await apiFetch("/api/districts");
        if (mounted && Array.isArray(d) && d.length > 0) {
          setMpDistricts(
            d.map((x) => ({ key: x.slug || x._id || x.name, label: x.name }))
          );
        }
      } catch (err) {
        console.warn("Failed to load districts", err.message || err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleMobileSearch = () => {
    setMobileMenuOpen(false);
    setMobileSearchOpen((v) => !v);
  };
  const toggleMobileMenu = () => {
    setMobileSearchOpen(false);
    setMobileSearchOpen(false);
    setMobileMenuOpen((v) => !v);
  };
  const closeMobilePanels = () => {
    setMobileSearchOpen(false);
    setMobileMenuOpen(false);
  };

  const dashboardLink = user
    ? user.role === "owner"
      ? "/owner"
      : user.role === "reporter"
      ? "/reporter"
      : "/"
    : "/";

  return (
    <header ref={headerRef} className="relative w-full shadow-2xl z-50">
      {/* 🚀 Top Strip: Logo, Search, and Auth Status - Uses Vivid Red */}
      <div
        className="border-b border-white/20"
        style={{ backgroundColor: PRIMARY_VIVID_RED }}
      >
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to={dashboardLink}>
              <img
                src={logo}
                alt="लोगो"
                className="h-12 md:h-16 w-auto object-contain transition duration-300 hover:scale-[1.05] transform"
              />
            </Link>
          </motion.div>

          {/* Search, Auth, and Mobile Toggles */}
          <div className="flex items-center gap-3">
            {/* Desktop search */}
            <div className="hidden lg:flex items-stretch">
              <input
                type="search"
                placeholder="समाचार खोजें..."
                aria-label="समाचार खोजें"
                className="px-3 py-2 rounded-l-md border border-r-0 border-white/50 w-64 focus:ring-white focus:border-white/50 bg-white/10 text-white placeholder-white/70 transition duration-200 ease-in-out text-sm"
              />
              <motion.button
                className="text-white px-4 py-2 rounded-r-md transition duration-200 ease-in-out flex items-center justify-center text-sm"
                style={{ backgroundColor: SECONDARY_TEAL }} // Use Teal for search button contrast
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Search className="h-4 w-4 mr-2" />
                <span>खोजें</span>
              </motion.button>
            </div>

            {/* Auth/Dashboard Link */}
            {user ? (
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link
                  to={dashboardLink}
                  aria-label={`Go to ${user.role} dashboard`}
                  className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition duration-200 ease-in-out flex items-center justify-center shadow-md"
                >
                  <User className="h-5 w-5" />
                </Link>
              </motion.div>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link
                  to="/login"
                  aria-label="Login"
                  className="hidden sm:flex items-center text-white px-3 py-1.5 rounded-md text-sm font-medium transition duration-200 shadow-md"
                  style={{ backgroundColor: SECONDARY_TEAL }} // Use Teal for login button contrast
                >
                  <User className="h-4 w-4 mr-1" /> लॉग इन करें
                </Link>
              </motion.div>
            )}

            {/* Mobile Toggles */}
            <div className="flex items-center gap-2 lg:hidden">
              <motion.button
                onClick={toggleMobileSearch}
                aria-expanded={mobileSearchOpen}
                aria-label="Toggle search"
                className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition duration-200"
                whileTap={{ scale: 0.9 }}
              >
                {mobileSearchOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </motion.button>

              <motion.button
                onClick={toggleMobileMenu}
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle menu"
                className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition duration-200"
                whileTap={{ scale: 0.9 }}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
      {/* Headline marquee will be shown below the category nav to keep header compact */}

      {/* Mobile search panel */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            key="mobile-search"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden absolute w-full border-b border-gray-700 overflow-hidden"
            style={{ backgroundColor: PRIMARY_VIVID_RED }} // Use Vivid Red BG for consistency
            aria-hidden={!mobileSearchOpen}
          >
            <div className="px-4 py-3 flex items-center gap-2">
              <input
                type="search"
                placeholder="समाचार खोजें..."
                aria-label="समाचार खोजें"
                className="flex-1 px-3 py-2 rounded-md border border-white/50 bg-white/10 text-white placeholder-white/70 text-sm focus:ring-white focus:border-white/50"
              />
              <motion.button
                className="text-white px-4 py-2 rounded-md transition duration-200"
                style={{ backgroundColor: SECONDARY_TEAL }} // Teal search button
                whileHover={{ scale: 1.05 }}
              >
                खोजें
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden absolute w-full bg-white shadow-lg overflow-hidden"
            aria-hidden={!mobileMenuOpen}
          >
            <div className="flex flex-col px-4 py-2">
              {categories.map((c, index) => {
                if (c.hasDropdown) {
                  return (
                    <div key={c.key} className="w-full">
                      <button
                        className="w-full text-left text-gray-800 text-base font-medium py-2 border-b border-gray-100 hover:text-red-700 hover:bg-gray-50 transition duration-150 flex items-center justify-between px-4"
                        onClick={() => setMobileDistrictsOpen((v) => !v)}
                        aria-expanded={mobileDistrictsOpen}
                      >
                        <span>{c.label}</span>
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      {mobileDistrictsOpen && (
                        <div className="bg-white/50">
                          {mpDistricts.map((d) => (
                            <Link
                              key={d.key}
                              to={`/news?district=${encodeURIComponent(d.key)}`}
                              className="block px-6 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={closeMobilePanels}
                            >
                              {d.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={c.key}
                    to={
                      c.key === "home"
                        ? "/news"
                        : `/news?category=${encodeURIComponent(c.key)}`
                    }
                    ref={index === 0 ? firstMenuLinkRef : undefined}
                    className="text-gray-800 text-base font-medium py-2 border-b border-gray-100 hover:text-red-700 hover:bg-gray-50 transition duration-150"
                    onClick={closeMobilePanels}
                    role="menuitem"
                    tabIndex={0}
                  >
                    {c.label}
                  </Link>
                );
              })}
              {/* Mobile Auth Links */}
              {!user && (
                <Link
                  to="/login"
                  className="mt-2 text-base font-medium py-2 rounded-md transition duration-150 flex items-center"
                  style={{ color: PRIMARY_VIVID_RED }} // Use primary red for mobile login button text
                  onClick={closeMobilePanels}
                  role="menuitem"
                >
                  <User className="h-4 w-4 mr-2" /> लॉग इन करें
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🟢 Full-width Category Nav - USES WHITE BACKGROUND */}
      <nav
        ref={navRef}
        className={`${
          isFixed ? "fixed top-0 left-0 right-0 z-40" : "relative"
        } shadow-md bg-white border-b border-gray-200`}
      >
        <div className="max-w-screen-xl mx-auto px-4 hidden lg:block">
          <div className="flex items-center overflow-x-auto whitespace-nowrap py-2">
            {categories.map((c) => {
              if (c.hasDropdown) {
                return (
                  <div
                    key={c.key}
                    ref={districtWrapperRef}
                    className="relative inline-block mx-1"
                    onMouseEnter={() => setDistrictsOpen(true)}
                    onMouseLeave={() => setDistrictsOpen(false)}
                  >
                    <button
                      ref={districtButtonRef}
                      id="district-button"
                      aria-haspopup="true"
                      aria-expanded={districtsOpen}
                      aria-controls="district-menu"
                      className="flex items-center text-gray-800 text-sm font-semibold px-4 py-1 rounded-full transition duration-150 ease-in-out tracking-wider"
                      onKeyDown={(e) => {
                        // open with Enter/Space/ArrowDown and focus first item
                        if (
                          e.key === "Enter" ||
                          e.key === " " ||
                          e.key === "ArrowDown"
                        ) {
                          e.preventDefault();
                          setDistrictsOpen(true);
                          setTimeout(
                            () => districtMenuRefs.current?.[0]?.focus(),
                            0
                          );
                        }
                        if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setDistrictsOpen(true);
                          setTimeout(() => {
                            const len = districtMenuRefs.current?.length || 0;
                            if (len) districtMenuRefs.current[len - 1]?.focus();
                          }, 0);
                        }
                        if (e.key === "Escape") {
                          setDistrictsOpen(false);
                        }
                      }}
                    >
                      <span>{c.label}</span>
                      <ChevronDown className="ml-2" />
                    </button>
                    {districtsOpen && (
                      <div
                        id="district-menu"
                        role="menu"
                        aria-labelledby="district-button"
                        className="absolute mt-2 left-0 w-56 bg-white border rounded-md shadow-lg z-50"
                      >
                        {mpDistricts.map((d, idx) => (
                          <Link
                            key={d.key}
                            ref={(el) => (districtMenuRefs.current[idx] = el)}
                            role="menuitem"
                            tabIndex={-1}
                            to={`/news?district=${encodeURIComponent(d.key)}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onKeyDown={(e) => {
                              const len = districtMenuRefs.current.length;
                              if (e.key === "ArrowDown") {
                                e.preventDefault();
                                const next = (idx + 1) % len;
                                districtMenuRefs.current[next]?.focus();
                              } else if (e.key === "ArrowUp") {
                                e.preventDefault();
                                const prev = (idx - 1 + len) % len;
                                districtMenuRefs.current[prev]?.focus();
                              } else if (e.key === "Home") {
                                e.preventDefault();
                                districtMenuRefs.current[0]?.focus();
                              } else if (e.key === "End") {
                                e.preventDefault();
                                districtMenuRefs.current[len - 1]?.focus();
                              } else if (e.key === "Escape") {
                                setDistrictsOpen(false);
                                districtButtonRef.current?.focus();
                              }
                            }}
                            onClick={() => setDistrictsOpen(false)}
                          >
                            {d.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={c.key}
                  to={
                    c.key === "home"
                      ? "/news"
                      : `/news?category=${encodeURIComponent(c.key)}`
                  }
                  // Category links use dark text on white background
                  className="text-gray-800 text-sm font-semibold px-4 py-1 rounded-full transition duration-150 ease-in-out mx-1 tracking-wider"
                  style={{
                    // Highlight the active/home link with the secondary accent (Teal)
                    backgroundColor:
                      c.key === "home" ? SECONDARY_TEAL : "transparent",
                    color: c.key === "home" ? "white" : "black",
                  }}
                  onClick={closeMobilePanels}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      c.key === "home" ? SECONDARY_TEAL : "rgba(0, 0, 0, 0.05)")
                  } // Subtle gray hover on non-home
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      c.key === "home" ? SECONDARY_TEAL : "transparent")
                  } // Reset
                >
                  {c.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      {/* spacer inserted only when nav is fixed to prevent content jump */}
      {isFixed && <div style={{ height: navHeight }} aria-hidden />}
      {/* render marquee below the category nav so it appears under the navbar */}
      <HeadlineMarquee speed={22} />
    </header>
  );
}
