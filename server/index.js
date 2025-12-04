// Ensure dotenv runs as an ESM side-effect import so env vars are available
// to other modules that are imported below. Static import evaluation is
// hoisted in ESM, so calling dotenv.config() after imports may be too late.
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
// logger removed: use console.* directly
import errorHandler from "./middleware/errorHandler.js";
import path from "path";

// Avoid noisy env checks in production
if (process.env.NODE_ENV !== "production") {
  // Quick runtime check (non-sensitive): confirm Cloudinary vars are present.
  console.debug(
    "env check: CLOUDINARY_API_KEY present?",
    !!process.env.CLOUDINARY_API_KEY
  );
}

import authRoutes from "./routes/auth.js";
import newsRoutes from "./routes/news.js";
import reporterRoutes from "./routes/reporters.js";
import uploadRoutes from "./routes/upload.js";
import categoriesRoutes from "./routes/categories.js";
import districtsRoutes from "./routes/districts.js";
import siteRoutes from "./routes/site.js";
import { v2 as cloudinary } from "cloudinary";

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

// In production require at least one allowed frontend origin to be configured
if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
  console.error(
    "FRONTEND_URL or FRONTEND_URLS must be set in production to restrict CORS"
  );
  process.exit(1);
}

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
// Basic security headers
app.use(helmet());

// Rate limiting: apply to all requests to mitigate brute-force and excessive traffic
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // limit each IP to 120 requests per windowMs
});
app.use(limiter);

// Limit JSON body size to avoid large payload abuse
app.use(express.json({ limit: "100kb" }));

app.use("/api/auth", authRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/reporters", reporterRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/districts", districtsRoutes);
app.use("/api/site", siteRoutes);

app.get("/", (req, res) => res.json({ ok: true }));

// Daily cleanup scheduler: deletes news older than NEWS_RETENTION_DAYS (default 35)
function initCleanupScheduler() {
  try {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
      process.env;
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
      });
    }

    const DAYS = Number(process.env.NEWS_RETENTION_DAYS || 35);
    const millisInDay = 24 * 60 * 60 * 1000;

    const runCleanup = async () => {
      try {
        const cutoff = new Date(Date.now() - DAYS * millisInDay);
        const News = (await import("./models/News.js")).default;
        const docs = await News.find({ createdAt: { $lt: cutoff } });
        let deleted = 0;
        let removedImages = 0;
        for (const doc of docs) {
          try {
            if (doc.cloudinaryPublicId && cloudinary.config().cloud_name) {
              try {
                const res = await cloudinary.uploader.destroy(
                  doc.cloudinaryPublicId
                );
                if (res && (res.result === "ok" || res.result === "not found"))
                  removedImages++;
              } catch {}
            }
            await News.deleteOne({ _id: doc._id });
            deleted++;
          } catch {}
        }
        console.log(
          `Daily cleanup: deleted ${deleted} old news, removed ${removedImages} images`
        );
      } catch (e) {
        console.warn("Daily cleanup failed", e?.message || e);
      } finally {
        scheduleNextRun();
      }
    };

    const nextRunTime = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(2, 30, 0, 0); // 02:30 server time
      if (next <= now) next.setTime(next.getTime() + millisInDay);
      return next;
    };

    const scheduleNextRun = () => {
      const next = nextRunTime();
      const delay = next.getTime() - Date.now();
      console.log(`Daily cleanup scheduled at ${next.toISOString()}`);
      setTimeout(runCleanup, delay);
    };

    // optional immediate run on startup
    if (
      String(process.env.NEWS_CLEANUP_RUN_ON_START).toLowerCase() === "true"
    ) {
      runCleanup();
    } else {
      scheduleNextRun();
    }
  } catch (e) {
    // scheduler is optional; do not crash app
  }
}

async function start() {
  if (!MONGO_URI) {
    console.error("MONGO_URI not set in environment");
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET not set in environment");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // optional: seed owner if env vars provided
    const { seedOwner } = await import("./utils/seedOwner.js");
    await seedOwner();
    // start daily cleanup scheduler after DB is connected
    initCleanupScheduler();
    app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}

start();

// Attach generic error handler after all routes
app.use(errorHandler);
