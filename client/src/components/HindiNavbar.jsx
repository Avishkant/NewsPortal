import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.jpg";
import LazyImage from "./LazyImage.jsx";
import { Search, Menu, X, User, ChevronDown, Tag, MapPin } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { motion, AnimatePresence } from "framer-motion";
import HeadlineMarquee from "./HeadlineMarquee.jsx";
import { apiFetch } from "../api.js";

// Define the custom primary color
const PRIMARY_VIVID_RED = "#d40b0bff"; // The requested background color
const SECONDARY_TEAL = "#14B8A6"; // Secondary accent color (Teal)

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

export default function HindiNavbar() {
  const [categories, setCategories] = useState([
    // Default/Fallback data used before API load
    { key: "home", label: "होम" },
    { key: "bharat", label: "भारत" },
    { key: "madhya-pradesh", label: "मध्य प्रदेश" },
    { key: "jila", label: "जिला", hasDropdown: true },
    { key: "sports", label: "खेल" },
    { key: "entertainment", label: "मनोरंजन" },
    { key: "business", label: "व्यापार" },
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
  ]);

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [districtsOpen, setDistrictsOpen] = useState(false);
  const [mobileDistrictsOpen, setMobileDistrictsOpen] = useState(false);
  const { user, logout, promptLogout } = useAuth() || {};

  // Refs for DOM manipulation and focus management
  const navRef = useRef(null);
  const headerRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileToggleRef = useRef(null);
  const firstMenuLinkRef = useRef(null);
  const districtButtonRef = useRef(null);
  const districtMenuRefs = useRef([]);
  const districtWrapperRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const [navHeight, setNavHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [isFixed, setIsFixed] = useState(false);
  const [desktopSearch, setDesktopSearch] = useState("");
  const [mobileSearch, setMobileSearch] = useState("");

  // --- Helper Functions ---

  const submitSearch = (term) => {
    const q = String(term || "").trim();
    if (!q) return;
    try {
      const params = new URLSearchParams(location.search);
      if (q) params.set("q", q);
      const qs = params.toString();
      navigate(`/news${qs ? `?${qs}` : ""}`);
    } catch {
      navigate(`/news?q=${encodeURIComponent(q)}`);
    }
    setMobileSearchOpen(false);
    setMobileMenuOpen(false);

    // After navigating, ensure the results are visible below any sticky headers.
    // Use a small timeout to allow the new route to render and layout to settle.
    try {
      setTimeout(() => {
        try {
          const header = document.querySelector("header");
          // account for any additional fixed nav that may be positioned under header
          const nav = document.querySelector("nav");
          const headerH = header ? header.getBoundingClientRect().height : 0;
          const navH = nav ? nav.getBoundingClientRect().height : 0;
          const offset = Math.max(0, headerH + navH - 4); // small overlap guard
          if (typeof window !== "undefined" && window.scrollTo) {
            window.scrollTo({ top: offset, behavior: "smooth" });
          }
        } catch (e) {
          if (typeof window !== "undefined" && window.scrollTo) {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }
      }, 120);
    } catch {
      /* ignore */
    }
  };

  const toggleMobileSearch = () => {
    setMobileMenuOpen(false);
    setMobileSearchOpen((v) => !v);
  };
  const toggleMobileMenu = () => {
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

  // --- Effects ---

  // 1. Initial Data Fetch (Categories & Districts)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cats = await apiFetch("/api/categories");
        if (!mounted) return;
        if (Array.isArray(cats) && cats.length > 0) {
          setCategories(cats.map((c) => ({ key: c.name, label: c.name })));
        } else if (cats && Array.isArray(cats.items) && cats.items.length > 0) {
          setCategories(
            cats.items.map((c) => ({ key: c.name, label: c.name }))
          );
        }
      } catch (err) {
        console.warn("Failed to load categories", err.message || err);
      }

      try {
        const d = await apiFetch("/api/districts");
        if (mounted && Array.isArray(d) && d.length > 0) {
          // Map to use name as key
          setMpDistricts(d.map((x) => ({ key: x.name, label: x.name })));
        }
      } catch (err) {
        console.warn("Failed to load districts", err.message || err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Listen for global category updates (owner portal emits this event)
  useEffect(() => {
    const onUpdated = (e) => {
      try {
        const payload = e?.detail?.categories;
        if (!payload) return;
        if (Array.isArray(payload) && payload.length > 0) {
          setCategories(payload.map((c) => ({ key: c.name, label: c.name })));
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("categories-updated", onUpdated);
    return () => window.removeEventListener("categories-updated", onUpdated);
  }, []);

  // 2. Accessibility/State Management (ESC key, Scroll Lock, Focus Trap)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        closeMobilePanels();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    if (mobileMenuOpen || mobileSearchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = prev;
    }
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen, mobileSearchOpen]);

  useEffect(() => {
    if (mobileMenuOpen && mobileMenuRef.current) {
      // Focus trap logic (retained for completeness)
      const node = mobileMenuRef.current;
      const focusableSelector =
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
      const focusable = Array.from(node.querySelectorAll(focusableSelector));
      if (focusable.length) focusable[0].focus();

      function onKey(e) {
        /* ... focus trap logic ... */
        if (e.key === "Escape") {
          closeMobilePanels();
          mobileToggleRef.current?.focus();
          return;
        }
        if (e.key !== "Tab") return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
  }, [mobileMenuOpen]);

  // 3. Fixed Header Logic (Scroll Detection)
  useEffect(() => {
    function measure() {
      if (!navRef.current) return;
      setNavHeight(navRef.current.offsetHeight);
      if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
    }

    function onScroll() {
      const hdrH = headerRef.current ? headerRef.current.offsetHeight : 0;
      setIsFixed(window.scrollY >= hdrH);
    }

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <header ref={headerRef} className="relative w-full shadow-2xl z-50 lg:z-60">
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
              <LazyImage
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
                value={desktopSearch}
                onChange={(e) => setDesktopSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitSearch(desktopSearch);
                }}
                placeholder="समाचार खोजें..."
                aria-label="समाचार खोजें"
                className="px-3 py-2 rounded-l-md border border-r-0 border-white/50 w-64 focus:ring-white focus:border-white/50 bg-white/10 text-white placeholder-white/70 transition duration-200 ease-in-out text-sm"
              />
              <motion.button
                onClick={() => submitSearch(desktopSearch)}
                className="text-white px-4 py-2 rounded-r-md transition duration-200 ease-in-out flex items-center justify-center text-sm"
                style={{ backgroundColor: SECONDARY_TEAL }} // Teal search button
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
                  style={{ backgroundColor: SECONDARY_TEAL }} // Teal for login button contrast
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
                ref={mobileToggleRef}
                onClick={() => {
                  if (
                    user &&
                    (user.role === "owner" || user.role === "reporter")
                  ) {
                    window.dispatchEvent(new CustomEvent("toggleSidebar"));
                  } else {
                    toggleMobileMenu();
                  }
                }}
                aria-expanded={mobileMenuOpen}
                aria-label={
                  user && (user.role === "owner" || user.role === "reporter")
                    ? "Toggle dashboard menu"
                    : "Toggle menu"
                }
                className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition duration-200"
                whileTap={{ scale: 0.95 }}
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

      {/* Mobile search panel */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            key="mobile-search"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed left-0 right-0 overflow-hidden"
            style={{
              backgroundColor: PRIMARY_VIVID_RED,
              top: headerHeight,
              zIndex: 70,
            }}
            aria-hidden={!mobileSearchOpen}
          >
            <div className="px-4 py-3 flex items-center gap-2">
              <input
                type="search"
                value={mobileSearch}
                onChange={(e) => setMobileSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitSearch(mobileSearch);
                }}
                placeholder="समाचार खोजें..."
                aria-label="समाचार खोजें"
                className="flex-1 px-3 py-2 rounded-md border border-white/50 bg-white/10 text-white placeholder-white/70 text-sm focus:ring-white focus:border-white/50"
              />
              <motion.button
                onClick={() => submitSearch(mobileSearch)}
                className="text-white px-4 py-2 rounded-md transition duration-200"
                style={{ backgroundColor: SECONDARY_TEAL }}
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
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="lg:hidden fixed left-0 right-0 z-50 bg-white shadow-lg max-h-[75vh] overflow-y-auto"
            style={{ top: headerHeight }}
            aria-hidden={!mobileMenuOpen}
            ref={mobileMenuRef}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <LazyImage
                  src={logo}
                  alt="logo"
                  className="h-8 w-auto object-contain"
                />
                <div className="text-sm font-semibold">Menu</div>
              </div>
              <button
                aria-label="Close menu"
                className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
                onClick={closeMobilePanels}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col px-2 py-2">
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
                          <Link
                            key="mp-all"
                            to={`/news?district=${encodeURIComponent(
                              "madhya-pradesh"
                            )}`}
                            className="block px-6 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium"
                            onClick={closeMobilePanels}
                            tabIndex={-1}
                          >
                            मध्य प्रदेश — सभी जिले
                          </Link>

                          {mpDistricts.map((d) => (
                            <Link
                              key={d.key}
                              to={`/news?district=${encodeURIComponent(d.key)}`}
                              className="block px-6 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={closeMobilePanels}
                              tabIndex={-1}
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
                    className="text-gray-800 text-base font-medium py-2 border-b border-gray-100 hover:text-red-700 hover:bg-gray-50 transition duration-150 px-4"
                    onClick={closeMobilePanels}
                    role="menuitem"
                    tabIndex={0}
                  >
                    {c.label}
                  </Link>
                );
              })}
              {/* Static About link */}
              <Link
                to="/about"
                className="text-gray-800 text-base font-medium py-2 border-b border-gray-100 hover:text-red-700 hover:bg-gray-50 transition duration-150 px-4"
                onClick={closeMobilePanels}
                role="menuitem"
              >
                हमारे बारे में
              </Link>
              {/* Mobile Auth Links */}
              {!user && (
                <Link
                  to="/login"
                  className="mt-2 text-base font-medium py-2 rounded-md transition duration-150 flex items-center px-4"
                  style={{ color: PRIMARY_VIVID_RED }} // Use primary red for mobile login button text
                  onClick={closeMobilePanels}
                  role="menuitem"
                >
                  <User className="h-4 w-4 mr-2" /> लॉग इन करें
                </Link>
              )}
              {user && (
                <button
                  onClick={() => {
                    try {
                      if (promptLogout) promptLogout();
                      else if (logout) logout();
                    } catch (e) {
                      console.warn("Logout failed", e);
                    }
                  }}
                  className="mt-2 text-base font-medium py-2 rounded-md transition duration-150 flex items-center text-red-600 px-4"
                  role="menuitem"
                >
                  लॉग आउट
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🟢 Full-width Category Nav - USES WHITE BACKGROUND */}
      <nav
        ref={navRef}
        className={`${
          isFixed ? "fixed top-0 left-0 right-0 z-60" : "relative"
        } shadow-md bg-white border-b border-gray-200`}
      >
        <div className="max-w-screen-xl mx-auto px-4 block">
          <div className="flex items-center overflow-x-auto whitespace-nowrap py-2 no-scrollbar touch-scroll -mx-2 px-2">
            {/* Desktop Home button placed first to show all news */}
            <Link
              to="/news"
              className="text-white text-sm font-semibold px-4 py-1 rounded-full transition duration-150 ease-in-out mx-2 tracking-wider inline-flex items-center justify-center"
              style={{
                backgroundColor: SECONDARY_TEAL,
              }}
              onClick={closeMobilePanels}
              aria-label="होम - सभी समाचार"
            >
              होम
            </Link>
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
                      onClick={() => {
                        try {
                          navigate(
                            `/news?district=${encodeURIComponent(
                              "madhya-pradesh"
                            )}`
                          );
                        } catch (e) {
                          console.warn("navigate failed", e);
                        }
                        setDistrictsOpen(false);
                      }}
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
                          districtButtonRef.current?.focus();
                        }
                      }}
                      // Highlight active link with dark text and subtle gray background hover
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "rgba(0, 0, 0, 0.05)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <span>{c.label}</span>
                      <ChevronDown className="ml-2 w-3 h-3" />
                    </button>
                    {districtsOpen && (
                      <div
                        id="district-menu"
                        role="menu"
                        aria-labelledby="district-button"
                        className="absolute mt-2 left-0 w-56 bg-white border rounded-md shadow-lg z-50"
                      >
                        {/* Add top-level link to show all MP districts */}
                        <Link
                          role="menuitem"
                          tabIndex={-1}
                          to={`/news?district=${encodeURIComponent(
                            "madhya-pradesh"
                          )}`}
                          className="block px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                          onClick={() => setDistrictsOpen(false)}
                        >
                          मध्य प्रदेश — सभी जिले
                        </Link>

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
                  // Category links use dark text on white background, highlighted by hover
                  className="text-gray-800 text-sm font-semibold px-4 py-1 rounded-full transition duration-150 ease-in-out mx-2 tracking-wider inline-flex items-center justify-center"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(0, 0, 0, 0.05)")
                  } // Subtle gray hover
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  } // Reset
                  onClick={closeMobilePanels}
                >
                  {c.label}
                </Link>
              );
            })}
            {/* Add About link at the end of the desktop category nav */}
            <Link
              to="/about"
              className="text-gray-800 text-sm font-semibold px-4 py-1 rounded-full transition duration-150 ease-in-out mx-1 tracking-wider"
              onClick={closeMobilePanels}
            >
              हमारे बारे में
            </Link>
          </div>
        </div>
      </nav>
      {/* spacer inserted only when nav is fixed to prevent content jump */}
      {isFixed && <div style={{ height: navHeight }} aria-hidden />}
      {/* render marquee below the category nav so it appears under the navbar */}
      <HeadlineMarquee speed={22} />
      {/* Global ConfirmDialog handled by AuthContext.promptLogout() */}
    </header>
  );
}
