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

    // generate a URL-friendly slug from name if not provided
    const slugify = (s) =>
      String(s)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

    const baseSlug =
      slug && String(slug).trim() ? slugify(slug) : slugify(name);
    let uniqueSlug = baseSlug;
    let counter = 1;
    // ensure uniqueness by appending a counter when needed
    while (await Category.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    const cat = await Category.create({ name, slug: uniqueSlug });
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
    if (slug !== undefined) cat.slug = slug;
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
