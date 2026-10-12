import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as authController from "../../controllers/auth.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  signupSchema,
  signinSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../../validators/auth.validator.js";

const router = Router();

// Brute-force protection on the endpoints most attractive to attackers.
// 20 attempts / 15 min per IP is generous for real users, tight for scripted attacks.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Please try again later." },
});

router.post("/signup", authLimiter, validate(signupSchema), authController.signup);
router.post("/signin", authLimiter, validate(signinSchema), authController.signin);
router.post("/google", authLimiter, authController.googleAuth);
router.get("/linkedin/callback", authController.linkedinCallback);
router.get("/github/callback", authController.githubCallback);
router.post("/logout", authController.logout);
router.get("/me", protect, authController.getMe);

router.post("/verify-email", validate(verifyEmailSchema), authController.verifyEmail);
router.post("/resend-verification", protect, authController.resendVerification);

router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), authController.resetPassword);

export default router;
