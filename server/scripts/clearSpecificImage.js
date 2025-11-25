import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function run() {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) throw new Error("MONGO_URI not set");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");
    const News = (await import("../models/News.js")).default;
    const id = "69120ebb6592409a785e7f10";
    const res = await News.updateOne({ _id: id }, { $set: { image: null } });
    console.log("Update result:", res);
    const doc = await News.findById(id).lean();
    console.log("After update:", {
      _id: doc._id,
      image: doc.image,
      cloudinaryPublicId: doc.cloudinaryPublicId,
    });
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
