import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // Business-facing reporter identifier, e.g. REP-25-000123
    reporterId: { type: String, unique: true, sparse: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["owner", "reporter"], default: "reporter" },
  },
  { timestamps: true }
);

// Generate sequential reporterId for new reporter users
userSchema.pre("save", async function (next) {
  try {
    if (this.role !== "reporter") return next();
    if (this.reporterId) return next();
    // dynamic import of Counter to work with ESM environment
    const { default: Counter } = await import("./Counter.js");
    const year = new Date().getFullYear().toString().slice(-2);
    const ret = await Counter.findOneAndUpdate(
      { _id: "reporterId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const seq = ret.seq || 1;
    const padded = String(seq).padStart(6, "0");
    this.reporterId = `REP-${year}-${padded}`;
    return next();
  } catch (err) {
    return next(err);
  }
});

export default mongoose.model("User", userSchema);
