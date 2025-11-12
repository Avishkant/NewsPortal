import mongoose from "mongoose";

const DistrictSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    state: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("District", DistrictSchema);
