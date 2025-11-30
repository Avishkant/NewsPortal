export default function errorHandler(err, req, res, next) {
  // Log full error server-side
  console.error(err && err.stack ? err.stack : err);

  const status = err && err.status ? err.status : 500;
  const payload = {
    message: err && err.message ? err.message : "Internal Server Error",
  };
  // Include stack in non-production for debugging
  if (process.env.NODE_ENV !== "production" && err && err.stack)
    payload.stack = err.stack;

  res.status(status).json(payload);
}
