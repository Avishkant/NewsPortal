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
  const trackRef = useRef(null);
  const animRef = useRef(null);
  const posRef = useRef({ value: 0, __last: null });
  const measuredWidth = useRef(0);
  const stepRef = useRef(null);

  useEffect(() => {
    // detect reduced motion
    try {
      prefersReduced.current = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
    } catch {
      prefersReduced.current = false;
    }

    // ensure track is visually reset on mount to avoid being off-screen
    if (trackRef.current) {
      try {
        trackRef.current.style.transform = `translateX(0px)`;
      } catch (e) {
        /* ignore */
      }
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

  // JavaScript-driven animation using requestAnimationFrame for robustness
  useEffect(() => {
    // start animation loop
    const step = () => {
      if (!trackRef.current) {
        animRef.current = requestAnimationFrame(step);
        return;
      }

      const prefers = prefersReduced.current;
      if (prefers || paused) {
        // keep loop alive but don't advance
        animRef.current = requestAnimationFrame(step);
        return;
      }

      const el = trackRef.current;
      // measure width (total width of the rendered repeated content)
      const total = el.scrollWidth || measuredWidth.current || 0;
      // determine how many repeated sets are present so we can compute
      // the width of a single logical copy (unitWidth). We cannot assume
      // it's exactly 2 copies anymore because displayItems may repeat
      // items 3x or 8x when there are few headlines.
      let unitWidth = 0;
      try {
        const childCount = el.children ? el.children.length : 0;
        const origCount = items && items.length ? items.length : 1;
        const copies =
          origCount > 0 ? Math.max(1, Math.round(childCount / origCount)) : 1;
        unitWidth = copies > 0 ? total / copies : total;
      } catch (e) {
        unitWidth = total;
      }
      if (!unitWidth) {
        animRef.current = requestAnimationFrame(step);
        return;
      }

      // duration (seconds for a full loop) - keep previous semantics
      const duration = Math.max(8, speed);
      const pxPerSec = unitWidth / duration;

      const now = performance.now();
      if (!posRef.current.__last) posRef.current.__last = now;
      const dt = (now - posRef.current.__last) / 1000;
      posRef.current.__last = now;

      let pos = posRef.current.value || 0;
      pos -= pxPerSec * dt;
      // wrap around keeping continuity; handle large negative offsets (e.g., after tab inactive)
      while (pos <= -unitWidth) pos += unitWidth;
      while (pos > 0) pos -= unitWidth;
      posRef.current.value = pos;
      // apply transform
      el.style.transform = `translateX(${pos}px)`;

      measuredWidth.current = total;
      animRef.current = requestAnimationFrame(step);
    };

    // reset position when items change so animation restarts smoothly
    posRef.current.value = 0;
    posRef.current.__last = null;
    stepRef.current = step;
    // reset visual transform to avoid the track being stuck at a negative
    // offset when items update. Measure the track after a paint so unit
    // width calculations are accurate.
    if (trackRef.current) {
      try {
        trackRef.current.style.transform = `translateX(0px)`;
      } catch (e) {
        /* ignore DOM access errors */
      }
      // measure on next frame
      requestAnimationFrame(() => {
        try {
          measuredWidth.current = trackRef.current.scrollWidth || 0;
        } catch (e) {
          measuredWidth.current = 0;
        }
        // start the animation loop after measurement
        animRef.current = requestAnimationFrame(stepRef.current);
      });
    } else {
      animRef.current = requestAnimationFrame(stepRef.current);
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = null;
    };
    // re-run when items or paused or speed changes
  }, [items, paused, speed]);

  // Pause rAF when page is hidden to save CPU, resume and reset timing on visibility change
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        if (animRef.current) {
          cancelAnimationFrame(animRef.current);
          animRef.current = null;
        }
      } else {
        // reset time anchor so dt is small and smooth when resuming
        if (posRef.current) posRef.current.__last = null;
        // don't resume if user has paused marquee or prefers reduced motion
        if ((prefersReduced.current || paused) && animRef.current) return;
        if (!animRef.current && stepRef.current) {
          animRef.current = requestAnimationFrame(stepRef.current);
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [paused]);

  if (!items || items.length === 0) return null;

  const duration = Math.max(8, speed); // seconds for a full loop (kept for semantic parity)

  // Create displayItems that ensure the marquee track is long enough
  // even when there are very few headlines. This prevents the single
  // headline from being scrolled completely out of view and never
  // returning.
  const displayItems = (() => {
    if (!items || items.length === 0) return [];
    if (items.length === 1) return Array(8).fill(items[0]);
    // For all other cases render exactly two copies of the sequence.
    // This makes the unitWidth calculation stable and ensures a seamless loop.
    return [...items, ...items];
  })();

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
            /* bloom animation only; JS drives marquee transform now */
            @keyframes bloom {
              0% { transform: scale(1); opacity: 1; }
              70% { transform: scale(2.2); opacity: 0; }
              100% { transform: scale(2.4); opacity: 0; }
            }
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
                ref={trackRef}
                style={{
                  willChange: "transform",
                  gap: "3rem",
                  whiteSpace: "nowrap",
                  minWidth: "max-content",
                }}
              >
                {/* render the prepared displayItems to guarantee sufficient length */}
                {displayItems.map((it, idx) => (
                  <Link
                    key={`${it._id || idx}-${idx}`}
                    to={it._id ? `/news/${it._id}` : "#"}
                    title={it.title}
                    className="inline-block text-slate-800 font-medium px-4 py-1 hover:shadow-md transition-transform transform hover:-translate-y-0.5 whitespace-nowrap"
                    style={{ marginRight: "3rem", display: "inline-block" }}
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
