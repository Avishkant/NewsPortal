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

// public: simple subscribe endpoint (mocked)
router.post(
  "/subscribe",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const email = String(body.email || "").trim();
    if (!email) return res.status(400).json({ message: "Missing email" });
    // In a real app, you'd persist this to a subscribers collection or
    // forward to an email provider. For now we log and return success.
    console.log("New subscription:", email);
    res.json({ success: true, email });
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
