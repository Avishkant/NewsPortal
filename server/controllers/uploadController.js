import { v2 as cloudinary } from "cloudinary";
import asyncHandler from "express-async-handler";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const mimetype = req.file.mimetype || "";
  if (!mimetype.startsWith("image/")) {
    return res
      .status(400)
      .json({ message: "Invalid file type. Only images are allowed." });
  }
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
    const msg = err?.message || "Upload failed";
    res.status(500).json({ message: `Upload failed: ${msg}` });
  }
});
