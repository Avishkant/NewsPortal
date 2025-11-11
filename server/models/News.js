import mongoose from "mongoose";

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    // category is optional now; allow uncategorized articles
    category: { type: String },
    // optional district for region-specific filtering
    district: { type: String },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    views: { type: Number, default: 0 },
    image: { type: String },
    cloudinaryPublicId: { type: String },
    // optional YouTube link for video version of the news
    youtubeLink: { type: String },
    // whether this article is selected as a site headline by the owner
    headline: { type: Boolean, default: false },
    // moderation fields
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    approved: { type: Boolean, default: true },
    // if this document is a reporter-created draft that replaces an
    // already-published article, `replaces` points to the original News _id.
    replaces: { type: mongoose.Schema.Types.ObjectId, ref: "News" },
    // Deletion request workflow: if a reporter requests deletion of an already
    // approved article, `deletionRequested` is set and owner must confirm.
    deletionRequested: { type: Boolean, default: false },
    deletionRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deletionRequestedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("News", newsSchema);
