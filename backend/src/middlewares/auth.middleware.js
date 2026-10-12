import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../models/User.model.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * Reads the JWT from the HttpOnly cookie (falls back to Authorization header
 * for non-browser clients like Postman/mobile), verifies it, and attaches
 * the authenticated user to req.user.
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw ApiError.unauthorized("Not authenticated. Please sign in.");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw ApiError.unauthorized("Session expired. Please sign in again.");
    }
    throw ApiError.unauthorized("Invalid authentication token.");
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw ApiError.unauthorized("User belonging to this token no longer exists.");
  }

  req.user = user;
  next();
});

/**
 * Guards routes that require a verified email (e.g. posting a job, applying).
 * Use AFTER `protect`.
 */
export const requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    throw ApiError.forbidden("Please verify your email to continue.");
  }
  next();
};

/**
 * Guards routes that require onboarding to be complete (e.g. job discovery, applying).
 * Use AFTER `protect`.
 */
export const requireOnboarded = (req, res, next) => {
  if (!req.user.onboardingComplete) {
    throw ApiError.forbidden("Please complete onboarding to continue.");
  }
  next();
};
