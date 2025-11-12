import express from "express";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

// owner-only: list reporters
router.get(
  "/",
  protect,
  requireRole("owner"),
  asyncHandler(async (req, res) => {
    const users = await User.find({ role: "reporter" }).select("-password");
    res.json(users);
  })
);

// owner-only: create reporter
router.post(
  "/",
  protect,
  requireRole("owner"),
  asyncHandler(async (req, res) => {
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
    res.status(201).json({ id: u._id, name: u.name, email: u.email });
  })
);

// owner-only: delete reporter
router.delete(
  "/:id",
  protect,
  requireRole("owner"),
  asyncHandler(async (req, res) => {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ message: "Not found" });
    // Use model-level deletion to ensure removal works even if `u` is not
    // a full Mongoose document (lean, cast, or other transformations).
    await User.findByIdAndDelete(u._id);
    res.json({ message: "Removed" });
  })
);

export default router;
