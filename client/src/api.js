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
