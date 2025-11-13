import express from "express";
import asyncHandler from "express-async-handler";

import * as reportersController from "../controllers/reportersController.js";
import { protect, requireRole } from "../middleware/auth.js";
import { createReporterValidator } from "../validators/reportersValidators.js";
import runValidation from "../middleware/validate.js";

const router = express.Router();

router.get(
  "/",
  protect,
  requireRole("owner"),
  asyncHandler(reportersController.listReporters)
);

router.post(
  "/",
  protect,
  requireRole("owner"),
  createReporterValidator,
  runValidation,
  asyncHandler(reportersController.createReporter)
);

router.delete(
  "/:id",
  protect,
  requireRole("owner"),
  asyncHandler(reportersController.deleteReporter)
);

export default router;
