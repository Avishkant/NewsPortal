import User from "../models/User.js";
import bcrypt from "bcryptjs";

export async function seedOwner() {
  try {
    const name = process.env.NEW_OWNER_NAME;
    const email = process.env.NEW_OWNER_EMAIL;
    const password = process.env.NEW_OWNER_PASSWORD;
    if (!email || !password) return;
    const exists = await User.findOne({ email });
    if (exists) return;
    const hashed = await bcrypt.hash(password, 10);
    await User.create({
      name: name || "owner",
      email,
      password: hashed,
      role: "owner",
    });
    console.log("Seeded owner user:", email);
  } catch (err) {
    console.error("seedOwner error", err);
  }
}
