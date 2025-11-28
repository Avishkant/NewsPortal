import asyncHandler from "express-async-handler";
import Category from "../models/Category.js";

export const listCategories = asyncHandler(async (req, res) => {
  // support pagination: page, limit
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, parseInt(req.query.limit, 10) || 25);
  const filter = {};
  const total = await Category.countDocuments(filter);
  const items = await Category.find(filter)
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(limit);
  res.json({ items, total, page, limit });
});

export const createCategory = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== "owner")
    return res.status(403).json({ message: "Forbidden" });
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Missing fields" });
  const cat = await Category.create({ name });
  res.status(201).json(cat);
});

export const updateCategory = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== "owner")
    return res.status(403).json({ message: "Forbidden" });
  const cat = await Category.findById(req.params.id);
  if (!cat) return res.status(404).json({ message: "Not found" });
  const { name } = req.body;
  if (name !== undefined) cat.name = name;
  await cat.save();
  res.json(cat);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== "owner")
    return res.status(403).json({ message: "Forbidden" });
  const cat = await Category.findByIdAndDelete(req.params.id);
  if (!cat) return res.status(404).json({ message: "Not found" });
  res.json({ message: "Deleted" });
});
