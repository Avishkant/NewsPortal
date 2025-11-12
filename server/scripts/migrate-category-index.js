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

    // List indexes
    const indexes = await coll.indexes();
    console.log(
      "Existing indexes:",
      indexes.map((i) => i.name)
    );

    // If slug index exists, drop it to avoid duplicate null key errors
    const slugIndex = indexes.find(
      (i) => i.name === "slug_1" || (i.key && i.key.slug)
    );
    if (slugIndex) {
      try {
        console.log("Dropping index:", slugIndex.name);
        await coll.dropIndex(slugIndex.name);
        console.log("Dropped slug index.");
      } catch (err) {
        console.warn("Failed to drop slug index:", err.message || err);
      }
    } else {
      console.log("No slug index found; nothing to drop.");
    }

    // Ensure unique index on name
    try {
      console.log("Creating unique index on 'name'");
      await coll.createIndex({ name: 1 }, { unique: true });
      console.log("Created unique index on name.");
    } catch (err) {
      console.warn(
        "Failed to create unique index on name:",
        err.message || err
      );
    }

    await mongoose.disconnect();
    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(1);
  }
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1].endsWith("migrate-category-index.js")
) {
  main();
}
