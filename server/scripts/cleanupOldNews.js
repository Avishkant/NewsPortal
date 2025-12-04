import "dotenv/config";
import mongoose from "mongoose";
import News from "../models/News.js";
import { v2 as cloudinary } from "cloudinary";

const DAYS = Number(process.env.NEWS_RETENTION_DAYS || 35);

async function configureCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
    });
    return true;
  }
  return false;
}

async function run() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error("cleanupOldNews: MONGO_URI not set");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);

  const cutoff = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
  console.log(
    `Deleting news older than ${DAYS} days (createdAt < ${cutoff.toISOString()})`
  );

  const canDeleteCloudinary = await configureCloudinary();

  const cursor = News.find({ createdAt: { $lt: cutoff } }).cursor();
  let deletedCount = 0;
  let imageDeleteCount = 0;
  for await (const doc of cursor) {
    try {
      if (canDeleteCloudinary && doc.cloudinaryPublicId) {
        try {
          const res = await cloudinary.uploader.destroy(doc.cloudinaryPublicId);
          if (res && (res.result === "ok" || res.result === "not found")) {
            imageDeleteCount++;
          }
        } catch (e) {
          console.warn(
            "Failed to delete Cloudinary image",
            doc.cloudinaryPublicId,
            e?.message || e
          );
        }
      }
      await News.deleteOne({ _id: doc._id });
      deletedCount++;
    } catch (e) {
      console.error("Failed to delete old news", doc._id, e?.message || e);
    }
  }

  console.log(
    `cleanupOldNews: deleted ${deletedCount} news documents, removed ${imageDeleteCount} Cloudinary images`
  );
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("cleanupOldNews: fatal error", err);
  process.exit(1);
});
