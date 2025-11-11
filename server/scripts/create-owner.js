#!/usr/bin/env node
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

dotenv.config();

function usage() {
  console.log(
    "Usage: node scripts/create-owner.js --email EMAIL --password PASSWORD [--name 'Owner Name']"
  );
  console.log(
    "Alternatively set environment variables NEW_OWNER_EMAIL, NEW_OWNER_PASSWORD, NEW_OWNER_NAME or MONGO_URI in .env."
  );
}

function getArg(name) {
  const idx = process.argv.findIndex((a) => a === name);
  if (idx >= 0 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  return null;
}

async function main() {
  const envEmail = process.env.NEW_OWNER_EMAIL;
  const envPass = process.env.NEW_OWNER_PASSWORD;
  const envName = process.env.NEW_OWNER_NAME;
  const cliEmail = getArg("--email");
  const cliPass = getArg("--password");
  const cliName = getArg("--name");

  const email = cliEmail || envEmail;
  const password = cliPass || envPass;
  const name = cliName || envName || "owner";

  if (!email || !password) {
    console.error("Missing email or password.");
    usage();
    process.exit(2);
  }

  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error(
      "MONGO_URI not set. Put it in .env or export it in the environment."
    );
    process.exit(2);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const exists = await User.findOne({ email });
    if (exists) {
      console.log(`Owner with email ${email} already exists. No action taken.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 10);
    const u = await User.create({
      name,
      email,
      password: hashed,
      role: "owner",
    });
    console.log(`Created owner user: ${u.email} (id: ${u._id})`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error creating owner:", err);
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(1);
  }
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1].endsWith("create-owner.js")
) {
  main();
}
