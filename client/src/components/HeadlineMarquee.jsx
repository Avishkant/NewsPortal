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
  const lastGood = useRef([]); // keep last successful fetch so marquee can keep running on transient failures
  const retryTimer = useRef(null);
  const refreshInterval = useRef(null);

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
    const controller = new AbortController();

    let attempt = 0;

    const fetchHeadlines = async () => {
      attempt += 1;
      try {
        const data = await apiFetch("/api/news/headlines", {
          signal: controller.signal,
        });
        if (!mounted.current) return;
        const arr = Array.isArray(data) ? data : [];

        // Merge fetched headlines with lastGood queue and keep a FIFO of max 5 items.
        // Strategy:
        //  - Combine existing queue and newly fetched items.
        //  - Deduplicate by _id keeping the latest occurrence (fetched items override).
        //  - Sort by timestamp (createdAt or ObjectId timestamp) ascending (oldest first).
        //  - Keep the most recent `maxItems` (tail of array) but maintain FIFO ordering.

        const maxItems = 5;

        const combined = [...lastGood.current, ...arr];

        const byId = new Map();
        for (const it of combined) {
          if (!it || !it._id) continue;
          // later occurrences should overwrite earlier ones
          byId.set(it._id, it);
        }

        const unique = Array.from(byId.values());

        const getTs = (it) => {
          if (!it) return 0;
          if (it.createdAt) return new Date(it.createdAt).getTime();
          try {
            // ObjectId's first 8 hex chars are the timestamp in seconds
            if (it._id && it._id.length >= 8) {
              return parseInt(it._id.substring(0, 8), 16) * 1000;
            }
          } catch {
            /* ignore */
          }
          return 0;
        };

        unique.sort((a, b) => getTs(a) - getTs(b)); // oldest -> newest

        const trimmed = unique.slice(-maxItems);

        if (trimmed.length > 0) {
          lastGood.current = trimmed;
          setItems(trimmed);
        } else if (lastGood.current.length > 0) {
          setItems(lastGood.current);
        } else {
          setItems(trimmed);
        }

        // reset attempt on success
        attempt = 0;
      } catch {
        if (!mounted.current) return;
        // network issues or CORS failures: keep last good headlines and schedule a retry
        if (lastGood.current.length > 0) {
          setItems(lastGood.current);
        }
        // schedule retry with simple backoff: 5s, 15s, 60s
        const delays = [5000, 15000, 60000];
        const delay = delays[Math.min(attempt - 1, delays.length - 1)];
        clearTimeout(retryTimer.current);
        retryTimer.current = setTimeout(() => fetchHeadlines(), delay);
      }
    };

    // initial fetch
    fetchHeadlines();

    // periodic refresh (every 30s) to keep headlines fresh
    refreshInterval.current = setInterval(() => {
      fetchHeadlines();
    }, 30000);

    return () => {
      mounted.current = false;
      controller.abort();
      clearTimeout(retryTimer.current);
      clearInterval(refreshInterval.current);
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
