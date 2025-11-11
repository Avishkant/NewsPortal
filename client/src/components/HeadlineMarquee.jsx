import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api.js";

export default function HeadlineMarquee({
  speed = 12,
  stickyBelowNav = false,
}) {
  const [items, setItems] = useState([]);
  const [paused, setPaused] = useState(false);
  const mounted = useRef(true);
  const prefersReduced = useRef(false);

  useEffect(() => {
    // detect reduced motion
    try {
      prefersReduced.current = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
    } catch {
      prefersReduced.current = false;
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    apiFetch("/api/news/headlines")
      .then((data) => {
        if (!mounted.current) return;
        setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!mounted.current) return;
        setItems([]);
      });
    return () => {
      mounted.current = false;
    };
  }, []);

  // continuous marquee uses CSS animation; no index state needed

  if (!items || items.length === 0) return null;

  const duration = Math.max(8, speed); // seconds for a full loop

  const wrapperClass = `${
    stickyBelowNav ? "sticky top-[36px] z-40" : ""
  } w-full bg-white border-b border-gray-200`;

  return (
    <>
      <div className={wrapperClass}>
        <div className="max-w-6xl mx-auto overflow-hidden">
          <div
            className="relative h-9 flex items-center"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            role="region"
            aria-label="Latest headlines"
          >
            <style>{`
            /* continuous marquee: duplicate content and slide left by 50% */
            @keyframes marquee {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-50%); }
            }
            @keyframes bloom {
              0% { transform: scale(1); opacity: 1; }
              70% { transform: scale(2.2); opacity: 0; }
              100% { transform: scale(2.4); opacity: 0; }
            }
            .headline-label { min-width: 11rem; }
            .marquee-track { display: inline-flex; align-items: center; }
          `}</style>

            {/* Left label with target-like icon and blooming ring (grey background) */}
            <div className="flex items-center pl-4 pr-3 headline-label">
              <div className="bg-gray-100 px-3 py-1 rounded-md shadow-sm flex items-center gap-2">
                <div className="relative w-5 h-5 flex-shrink-0">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute inset-0"
                    aria-hidden
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="#e11d48"
                      strokeWidth="2"
                      fill="white"
                    />
                    <circle cx="12" cy="12" r="5" fill="#e11d48" />
                  </svg>
                  {/* bloom ring overlay inside the relative container */}
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "block",
                      borderRadius: 9999,
                      background: "rgba(225,29,72,0.18)",
                      transformOrigin: "center",
                      animation: `bloom ${1.6}s ease-out infinite`,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-800">
                  Headlines
                </span>
              </div>
            </div>

            {/* Scrolling area: duplicate items for seamless loop */}
            <div className="flex-1 overflow-hidden">
              <div
                className="marquee-track"
                style={{
                  willChange: "transform",
                  animationName: prefersReduced.current ? "none" : "marquee",
                  animationDuration: `${duration}s`,
                  animationTimingFunction: "linear",
                  animationPlayState:
                    paused || prefersReduced.current ? "paused" : "running",
                  gap: "3rem",
                  whiteSpace: "nowrap",
                }}
              >
                {/* content repeated twice for infinite effect */}
                {[...items, ...items].map((it, idx) => (
                  <Link
                    key={`${it._id}-${idx}`}
                    to={`/news/${it._id}`}
                    title={it.title}
                    className="inline-block text-slate-800 font-medium px-4 py-1 hover:shadow-md transition-transform transform hover:-translate-y-0.5 max-w-[60ch] truncate"
                  >
                    {it.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* spacer removed as requested */}
    </>
  );
}
