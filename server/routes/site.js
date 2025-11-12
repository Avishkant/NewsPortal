import express from "express";
import asyncHandler from "express-async-handler";
import SiteInfo from "../models/SiteInfo.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// public: get site info (about page)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    // return the single SiteInfo doc if present
    const info = await SiteInfo.findOne({}).lean();
    res.json(info || {});
  })
);

// owner only: create or update site info
router.put(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== "owner")
      return res.status(403).json({ message: "Forbidden" });
    const body = req.body || {};
    // upsert single document
    const updated = await SiteInfo.findOneAndUpdate({}, body, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    res.json(updated);
  })
);

export default router;
