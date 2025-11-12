import mongoose from "mongoose";

const SiteInfoSchema = new mongoose.Schema(
  {
    editorName: { type: String },
    editorTitle: { type: String },
    editorEmail: { type: String },
    editorImage: { type: String },
    mission: { type: String },
    aboutHtml: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("SiteInfo", SiteInfoSchema);
