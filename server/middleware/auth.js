import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

export const protect = asyncHandler(async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized");
  }
  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Token invalid");
  }
});

// optionalProtect: if an Authorization header with a valid token is present,
// populate req.user. If no header is present, continue without error.
export const optionalProtect = asyncHandler(async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    // no token provided — proceed as unauthenticated
    return next();
  }
  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    return next();
  } catch (err) {
    // invalid token — treat as unauthenticated (do not throw)
    console.warn("optionalProtect: invalid token provided");
    return next();
  }
});

export const requireRole = (role) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authorized" });
  if (req.user.role !== role)
    return res.status(403).json({ message: "Forbidden" });
  next();
};
