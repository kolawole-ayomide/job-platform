import jwt from "jsonwebtoken";
import env from "../config/env.js";

/**
 * Signs a JWT for a given user id.
 */
export function generateToken(userId) {
  return jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

/**
 * Sets the JWT as an HttpOnly cookie on the response.
 * HttpOnly -> JS on the frontend can't read it (protects against XSS token theft).
 * sameSite "lax" by default; in production cross-site setups (frontend and backend
 * on different domains) you'd usually need sameSite:"none" + secure:true.
 */
export function setTokenCookie(res, token) {
  const isProd = env.isProduction;

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd, // only sent over HTTPS in production
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, in ms
    path: "/",
  });
}

export function clearTokenCookie(res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? "none" : "lax",
    path: "/",
  });
}
