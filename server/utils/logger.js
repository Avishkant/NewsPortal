// Lightweight console-based logger fallback
// Winston removed by request — keep a small wrapper so existing imports work.
const isProd = process.env.NODE_ENV === "production";

const logger = {
  debug: (...args) => console.debug(...args),
  info: (...args) => console.log(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};

export default logger;
