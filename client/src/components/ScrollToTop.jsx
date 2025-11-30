import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    try {
      const { hash, pathname } = location;
      // If there's a hash (anchor), try to scroll to the element with that id
      if (hash) {
        // Give the new route a tick to render its DOM
        setTimeout(() => {
          try {
            const id = hash.startsWith("#") ? hash.slice(1) : hash;
            const el =
              document.getElementById(id) || document.querySelector(hash);
            if (el && typeof el.scrollIntoView === "function") {
              el.scrollIntoView({ behavior: "auto", block: "start" });
              return;
            }
          } catch (e) {
            // ignore and fall back to top
          }
          window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        }, 0);
      } else {
        // No hash — always scroll to top on pathname change
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
    } catch (e) {
      try {
        window.scrollTo(0, 0);
      } catch (err) {
        /* ignore */
      }
    }
  }, [location.pathname, location.hash]);

  return null;
}
