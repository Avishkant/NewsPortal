#!/usr/bin/env node
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

async function main() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error("MONGO_URI not set. Set it in .env or the environment.");
    process.exit(2);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const coll = db.collection("categories");

    // Case-insensitive removal of category named 'politics'
    const nameRegex = /^politics$/i;
    const existing = await coll.findOne({ name: nameRegex });
    if (!existing) {
      console.log("No category named 'politics' found. Nothing to remove.");
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log("Found category:", existing);
    const res = await coll.deleteOne({ _id: existing._id });
    if (res.deletedCount === 1) {
      console.log("Successfully removed category 'politics'.");
    } else {
      console.warn("Failed to remove category 'politics'.", res);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Operation failed:", err);
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(1);
  }
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1].endsWith("remove-politics-category.js")
) {
  main();
}
