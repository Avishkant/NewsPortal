import express from "express";
import asyncHandler from "express-async-handler";
import Category from "../models/Category.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// list categories (public)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const items = await Category.find({}).sort({ name: 1 });
    res.json(items);
  })
);

// create category (owner only)
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== "owner")
      return res.status(403).json({ message: "Forbidden" });
    const { name, slug } = req.body;
    if (!name) return res.status(400).json({ message: "Missing fields" });
    // Create a category by name only. Name is unique in the schema.
    const cat = await Category.create({ name });
    res.status(201).json(cat);
  })
);

// update (owner only)
router.put(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== "owner")
      return res.status(403).json({ message: "Forbidden" });
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ message: "Not found" });
    const { name, slug } = req.body;
    if (name !== undefined) cat.name = name;
    await cat.save();
    res.json(cat);
  })
);

// delete (owner only)
router.delete(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== "owner")
      return res.status(403).json({ message: "Forbidden" });
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ message: "Not found" });
    await cat.remove();
    res.json({ message: "Deleted" });
  })
);

export default router;
