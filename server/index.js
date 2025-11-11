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

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/reporters", reporterRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/categories", categoriesRoutes);

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
