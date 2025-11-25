import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Ensure we load the server/.env explicitly (script may run from repo root)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env");
console.log("Loading env from", envPath);
dotenv.config({ path: envPath });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI not set in environment");
  process.exit(1);
}

// We'll import the News model inside run() to avoid top-level await issues
let News;

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    // dynamic import of model (respects server package.json type/module when imported from server dir)
    News = (await import("../models/News.js")).default;
    console.log("Connected to MongoDB");

    const pid = "lhnnkcziwc4fcxgwexzh";
    // Match either cloudinaryPublicId that contains the id, or image url containing it
    const docs = await News.find({
      $or: [
        { cloudinaryPublicId: { $regex: pid } },
        { image: { $regex: pid } },
      ],
    }).lean();

    if (!docs || docs.length === 0) {
      console.log("No news documents found matching public id:", pid);
    } else {
      console.log(`Found ${docs.length} document(s):`);
      docs.forEach((d, i) => {
        console.log("--- Document", i + 1, "---");
        console.log("id:", d._id);
        console.log("title:", d.title);
        console.log("cloudinaryPublicId:", d.cloudinaryPublicId);
        console.log("image:", d.image);
        console.log("approved:", d.approved, "status:", d.status);
        console.log("author:", d.author);
      });
    }
  } catch (err) {
    console.error("Error while inspecting DB:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
