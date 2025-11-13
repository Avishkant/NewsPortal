import { body } from "express-validator";

export const createCategoryValidator = [
  body("name")
    .notEmpty()
    .withMessage("Name required")
    .isLength({ max: 100 })
    .withMessage("Name too long"),
];

export const updateCategoryValidator = [
  body("name").optional().isLength({ max: 100 }).withMessage("Name too long"),
];
