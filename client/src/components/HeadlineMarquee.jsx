import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api.js";

export default function HeadlineMarquee({ speed = 18 }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    apiFetch("/api/news/headlines").then((data) => {
      if (!mounted) return;
      setItems(Array.isArray(data) ? data : []);
    });
    return () => (mounted = false);
  }, []);

  if (!items || items.length === 0) return null;

  // Build a single long string of headlines separated by separators
  return (
    <div className="w-full bg-yellow-50 border-b border-yellow-100">
      <style>{`
        @keyframes marquee-${speed} {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
      <div className="max-w-6xl mx-auto overflow-hidden">
        <div
          aria-hidden
          className="whitespace-nowrap flex items-center gap-6 py-2 text-sm"
          style={{
            display: "inline-block",
            willChange: "transform",
            animation: `marquee-${speed} ${Math.max(
              8,
              speed
            )}s linear infinite`,
          }}
        >
          {items.map((it) => (
            <div key={it._id} className="flex items-center gap-3 px-4">
              <Link
                to={`/news/${it._id}`}
                className="text-slate-800 font-medium hover:underline"
              >
                {it.title}
              </Link>
              <span className="text-xs text-slate-500">•</span>
            </div>
          ))}
          {/* repeat items to create continuous feel */}
          {items.map((it) => (
            <div key={`r-${it._id}`} className="flex items-center gap-3 px-4">
              <Link
                to={`/news/${it._id}`}
                className="text-slate-800 font-medium hover:underline"
              >
                {it.title}
              </Link>
              <span className="text-xs text-slate-500">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
