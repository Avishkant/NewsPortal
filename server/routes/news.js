import express from "express";
import asyncHandler from "express-async-handler";
import { protect, optionalProtect } from "../middleware/auth.js";
import * as newsController from "../controllers/newsController.js";

const router = express.Router();

// list news, optional category
router.get("/", optionalProtect, asyncHandler(newsController.listNews));

// headlines
router.get(
  "/headlines",
  optionalProtect,
  asyncHandler(newsController.headlines)
);

// create
router.post("/", protect, asyncHandler(newsController.createNews));

// mine
router.get("/mine", protect, asyncHandler(newsController.listMine));
// deletion requests (specific static path - must be defined before parameterized routes)
router.get(
  "/deletion-requests",
  protect,
  asyncHandler(newsController.listDeletionRequests)
);

// request-delete (specific action routes before generic :id)
router.post(
  "/:id/request-delete",
  protect,
  asyncHandler(newsController.requestDelete)
);

// handle deletion
router.put(
  "/:id/handle-deletion",
  protect,
  asyncHandler(newsController.handleDeletion)
);

// get by id
router.get("/:id", optionalProtect, asyncHandler(newsController.getNewsById));

// update
router.put("/:id", protect, asyncHandler(newsController.updateNews));

// delete
router.delete("/:id", protect, asyncHandler(newsController.deleteNews));

export default router;
