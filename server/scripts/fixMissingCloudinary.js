import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function run() {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) throw new Error("MONGO_URI not set");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const News = (await import("../models/News.js")).default;
    const docs = await News.find({
      cloudinaryPublicId: { $exists: true, $ne: null },
    }).lean();
    console.log("Found", docs.length, "news with cloudinaryPublicId");

    for (const d of docs) {
      const pid = d.cloudinaryPublicId;
      if (!pid) continue;
      try {
        const info = await cloudinary.api.resource(pid);
        if (info && info.secure_url) {
          await News.updateOne(
            { _id: d._id },
            { $set: { image: info.secure_url } }
          );
          console.log("Updated", d._id, "-> secure_url");
        } else {
          await News.updateOne({ _id: d._id }, { $set: { image: null } });
          console.log("Cleared image for", d._id, "(no secure_url)");
        }
      } catch (err) {
        const isNotFound =
          err &&
          (err.http_code === 404 || /not found/i.test(err.message || ""));
        if (isNotFound) {
          await News.updateOne({ _id: d._id }, { $set: { image: null } });
          console.log("Cleared image for", d._id, "(resource missing)");
        } else {
          console.error(
            "Error checking",
            pid,
            err && err.message ? err.message : err
          );
        }
      }
    }

    console.log("Done.");
  } catch (err) {
    console.error("Script error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
