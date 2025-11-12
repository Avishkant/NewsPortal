// Ensure dotenv runs as an ESM side-effect import so env vars are available
// to other modules that are imported below. Static import evaluation is
// hoisted in ESM, so calling dotenv.config() after imports may be too late.
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";

// Quick runtime check (non-sensitive): confirm Cloudinary vars are present.
console.log(
  "env check: CLOUDINARY_API_KEY present?",
  !!process.env.CLOUDINARY_API_KEY
);

import authRoutes from "./routes/auth.js";
import newsRoutes from "./routes/news.js";
import reporterRoutes from "./routes/reporters.js";
import uploadRoutes from "./routes/upload.js";
import categoriesRoutes from "./routes/categories.js";
import districtsRoutes from "./routes/districts.js";
import siteRoutes from "./routes/site.js";

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const app = express();

// CORS configuration: allow one or more frontend origins during development.
// You can set FRONTEND_URL to a single origin or FRONTEND_URLS to a comma-separated
// list (e.g. "http://localhost:5173,http://localhost:5174"). If neither is set,
// default to allowing any origin (not recommended for production).
const rawFrontend = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "";
const allowedOrigins = rawFrontend
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // If no origin (e.g., server-to-server or curl), allow it.
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) {
        // no configured frontends -> allow all (useful for quick local dev)
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // allow simple localhost port matching when developer provided only host
      // e.g. "http://localhost" will match any port on localhost origins
      try {
        const url = new URL(origin);
        for (const ao of allowedOrigins) {
          if (ao === url.origin) return callback(null, true);
          if (ao === `${url.protocol}//${url.hostname}`)
            return callback(null, true);
          // also allow when configured origin matches hostname only (different dev port)
          try {
            const aoUrl = new URL(ao);
            if (aoUrl.hostname === url.hostname) return callback(null, true);
          } catch (e) {
            // ignore parse errors for ao entries
          }
        }
      } catch (e) {
        // ignore parse errors
      }
      callback(new Error(`CORS policy: origin '${origin}' not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/reporters", reporterRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/districts", districtsRoutes);
app.use("/api/site", siteRoutes);

app.get("/", (req, res) => res.json({ ok: true }));

async function start() {
  if (!MONGO_URI) {
    console.error("MONGO_URI not set in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // optional: seed owner if env vars provided
    const { seedOwner } = await import("./utils/seedOwner.js");
    await seedOwner();

    app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}

start();
