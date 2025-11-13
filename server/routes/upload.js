import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.js";
import * as uploadController from "../controllers/uploadController.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post(
  "/",
  protect,
  (req, res, next) => {
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
  uploadController.uploadImage
);

export default router;
