import express from "express";
import asyncHandler from "express-async-handler";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const storage = multer.memoryStorage();
// limit file size to 5MB and accept only single file; we'll also validate mimetype
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post(
  "/",
  protect,
  (req, res, next) => {
    // run multer and capture errors (file too large, invalid multipart, etc.)
    upload.single("image")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE")
          return res.status(400).json({ message: "File too large (max 5MB)" });
        return res
          .status(400)
          .json({ message: `Upload error: ${err.message}` });
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // validate mimetype
    const mimetype = req.file.mimetype || "";
    if (!mimetype.startsWith("image/")) {
      return res
        .status(400)
        .json({ message: "Invalid file type. Only images are allowed." });
    }

    const streamUpload = (fileBuffer) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "newsapp" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        stream.end(fileBuffer);
      });

    try {
      const result = await streamUpload(req.file.buffer);
      if (!result || !result.secure_url) {
        return res
          .status(500)
          .json({ message: "Upload failed (no result returned)" });
      }
      res.json({ url: result.secure_url, public_id: result.public_id });
    } catch (err) {
      console.error("Cloudinary upload error", err);
      // surface more specific errors when possible
      const msg = err?.message || "Upload failed";
      res.status(500).json({ message: `Upload failed: ${msg}` });
    }
  })
);

export default router;
