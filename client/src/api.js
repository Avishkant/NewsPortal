const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export async function apiFetch(
  path,
  { method = "GET", body, token, headers = {} } = {}
) {
  const opts = { method, headers: { ...headers } };
  if (token) opts.headers["Authorization"] = `Bearer ${token}`;
  if (body) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, opts);
  } catch (err) {
    // Network-level error (server not reachable, DNS, CORS preflight failed, etc.)
    const msg = `Network request failed to ${API_BASE}${path}: ${err.message}`;
    // preserve original error for debugging
    const e = new Error(msg);
    e.original = err;
    throw e;
  }

  const txt = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(txt);
  } catch {
    parsed = txt;
    // If server returned an HTML error page (Express default error handler),
    // try to extract a useful message out of any <pre>...</pre> block or strip tags.
    if (typeof parsed === "string" && /<html|<!doctype html>/i.test(parsed)) {
      // try to extract content inside <pre> tags first
      const preMatch = parsed.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
      if (preMatch && preMatch[1]) {
        // remove any tags inside pre and trim
        parsed = preMatch[1].replace(/<[^>]+>/g, "").trim();
      } else {
        // fallback: strip all HTML tags
        parsed = parsed.replace(/<[^>]+>/g, "").trim();
      }
    }
  }

  if (!res.ok) {
    const errMsg =
      (parsed && parsed.message) ||
      parsed ||
      res.statusText ||
      `HTTP ${res.status}`;
    const e = new Error(errMsg);
    e.status = res.status;
    e.response = parsed;
    throw e;
  }

  return parsed;
}

export default API_BASE;
