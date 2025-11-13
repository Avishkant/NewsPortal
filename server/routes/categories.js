import express from "express";
import asyncHandler from "express-async-handler";
import { protect, requireRole } from "../middleware/auth.js";
import * as categoriesController from "../controllers/categoriesController.js";
import {
  createCategoryValidator,
  updateCategoryValidator,
} from "../validators/categoryValidators.js";
import runValidation from "../middleware/validate.js";

const router = express.Router();

router.get("/", asyncHandler(categoriesController.listCategories));

router.post(
  "/",
  protect,
  requireRole("owner"),
  createCategoryValidator,
  runValidation,
  asyncHandler(categoriesController.createCategory)
);

router.put(
  "/:id",
  protect,
  requireRole("owner"),
  updateCategoryValidator,
  runValidation,
  asyncHandler(categoriesController.updateCategory)
);

router.delete(
  "/:id",
  protect,
  requireRole("owner"),
  asyncHandler(categoriesController.deleteCategory)
);

export default router;
