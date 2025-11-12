import express from "express";
import asyncHandler from "express-async-handler";
import District from "../models/District.js";
import { protect, requireRole, optionalProtect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/districts - public list
router.get(
  "/",
  optionalProtect,
  asyncHandler(async (req, res) => {
    const list = await District.find({}).sort({ name: 1 }).lean();
    res.json(list);
  })
);

// POST /api/districts - owner only
router.post(
  "/",
  protect,
  requireRole("owner"),
  asyncHandler(async (req, res) => {
    const { name, state } = req.body || {};
    if (!name) return res.status(400).json({ message: "Name required" });

    // generate slug allowing unicode letters/numbers
    const base = String(name)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/(^-|-$)/g, "");
    let slug = base || `district-${Date.now()}`;

    // ensure unique
    let count = 0;
    while (await District.findOne({ slug })) {
      count += 1;
      slug = `${base}-${count}`;
    }

    const doc = await District.create({ name, slug, state });
    res.status(201).json(doc);
  })
);

// PUT /api/districts/:id - update (owner only)
router.put(
  "/:id",
  protect,
  requireRole("owner"),
  asyncHandler(async (req, res) => {
    const doc = await District.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    const { name, slug, state } = req.body || {};
    if (name !== undefined) doc.name = name;
    if (slug !== undefined) doc.slug = slug;
    if (state !== undefined) doc.state = state;
    await doc.save();
    res.json(doc);
  })
);

// DELETE /api/districts/:id - delete (owner only)
router.delete(
  "/:id",
  protect,
  requireRole("owner"),
  asyncHandler(async (req, res) => {
    const doc = await District.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    // Use model-level deletion to avoid errors when the retrieved object
    // is a plain object rather than a Mongoose document.
    await District.findByIdAndDelete(doc._id);
    res.json({ message: "Deleted" });
  })
);

export default router;
