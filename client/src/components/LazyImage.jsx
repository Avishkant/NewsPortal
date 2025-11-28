import { useEffect, useRef, useState } from "react";

export default function LazyImage({
  src,
  alt = "",
  className = "",
  style = {},
  placeholder,
  fallback = "/vite.svg",
  ...rest
}) {
  const imgRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    setLoaded(false);
    setCurrent(null);
    if (!src) return;
    let mounted = true;
    const node = imgRef.current;

    if (typeof IntersectionObserver === "undefined" || !node) {
      // fallback: load immediately
      setVisible(true);
      setCurrent(src);
      return () => (mounted = false);
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!mounted) return;
            setVisible(true);
            setCurrent(src);
            obs.disconnect();
          }
        });
      },
      { rootMargin: "200px" }
    );
    obs.observe(node);
    return () => {
      mounted = false;
      try {
        obs.disconnect();
      } catch (e) {
        /* ignore */
      }
    };
  }, [src]);

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ display: "inline-block", ...style }}
    >
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gray-100 animate-pulse"
          style={{
            background: placeholder
              ? `url(${placeholder}) center/cover no-repeat`
              : undefined,
          }}
        />
      )}

      {visible && (
        <img
          src={current || fallback}
          alt={alt}
          className={`block w-full h-full object-cover transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setLoaded(true)}
          onError={(e) => {
            try {
              e.currentTarget.onerror = null;
              e.currentTarget.src = fallback;
            } catch (err) {
              /* ignore */
            }
          }}
          {...rest}
        />
      )}
    </div>
  );
}
