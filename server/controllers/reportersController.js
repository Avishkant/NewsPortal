import bcrypt from "bcryptjs";
import asyncHandler from "express-async-handler";

import User from "../models/User.js";

export const listReporters = asyncHandler(async (req, res) => {
  const users = await User.find({ role: "reporter" }).select("-password");
  res.json(users);
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
  res.status(201).json({ id: u._id, name: u.name, email: u.email });
});

export const deleteReporter = asyncHandler(async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ message: "Not found" });
  await User.findByIdAndDelete(u._id);
  res.json({ message: "Removed" });
});
