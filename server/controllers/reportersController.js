import bcrypt from "bcryptjs";
import asyncHandler from "express-async-handler";

import User from "../models/User.js";
import Counter from "../models/Counter.js";

export const listReporters = asyncHandler(async (req, res) => {
  // support pagination: page, limit
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, parseInt(req.query.limit, 10) || 25);
  const filter = { role: "reporter" };
  const total = await User.countDocuments(filter);
  const items = await User.find(filter)
    .select("-password")
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(limit);
  res.json({ items, total, page, limit });
});

export const createReporter = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "Missing fields" });
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email exists" });
  const hashed = await bcrypt.hash(password, 10);
  const u = await User.create({
    name,
    email,
    password: hashed,
    role: "reporter",
  });
  res.status(201).json({
    id: u._id,
    name: u.name,
    email: u.email,
    reporterId: u.reporterId || null,
  });
});

export const changeReporterId = asyncHandler(async (req, res) => {
  const { id } = req.params; // user id
  const { reporterId } = req.body;
  if (!reporterId)
    return res.status(400).json({ message: "reporterId is required" });
  // Only owners can call this (route protected by middleware)
  // Normalize input and basic validation
  const clean = String(reporterId).toUpperCase().trim();
  if (!/^[A-Z0-9\-]{5,30}$/.test(clean))
    return res.status(400).json({ message: "Invalid reporterId format" });
  // Ensure uniqueness
  const exists = await User.findOne({ reporterId: clean });
  if (exists && String(exists._id) !== String(id))
    return res.status(400).json({ message: "reporterId already in use" });

  const u = await User.findById(id);
  if (!u) return res.status(404).json({ message: "Reporter not found" });
  if (u.role !== "reporter")
    return res.status(400).json({ message: "User is not a reporter" });

  u.reporterId = clean;
  await u.save();
  // Ensure the global reporterId counter does not fall behind a manually-set ID.
  // Extract numeric sequence from the reporterId (last hyphen-separated segment).
  try {
    const parts = clean.split("-");
    const seqPart = parts[parts.length - 1];
    const seqNum = parseInt(seqPart, 10);
    if (!Number.isNaN(seqNum)) {
      // Use $max to ensure the stored seq is at least seqNum
      await Counter.findOneAndUpdate(
        { _id: "reporterId" },
        { $max: { seq: seqNum } },
        { upsert: true }
      );
    }
  } catch (err) {
    // Non-fatal: log and continue
    console.warn("Failed to sync reporterId counter:", err);
  }
  res.json({ message: "reporterId updated", reporterId: clean });
});

export const deleteReporter = asyncHandler(async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ message: "Not found" });
  await User.findByIdAndDelete(u._id);
  res.json({ message: "Removed" });
});
