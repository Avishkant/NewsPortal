import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    // Keep only the name for categories; slug removed to simplify i18n and management
    name: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model("Category", CategorySchema);
