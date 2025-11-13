import express from "express";
import asyncHandler from "express-async-handler";

import * as authController from "../controllers/authController.js";
import {
  loginValidator,
  registerValidator,
} from "../validators/authValidators.js";
import runValidation from "../middleware/validate.js";

const router = express.Router();

router.post(
  "/login",
  loginValidator,
  runValidation,
  asyncHandler(authController.login)
);

router.post(
  "/register",
  registerValidator,
  runValidation,
  asyncHandler(authController.register)
);

export default router;
