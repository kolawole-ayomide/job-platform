import { Router } from "express";
import * as onboardingController from "../../controllers/onboarding.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { uploadResume, handleMulterError } from "../../middlewares/upload.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { completeOnboardingSchema } from "../../validators/onboarding.validator.js";

const router = Router();

router.use(protect); // every onboarding route requires a signed-in user

router.get("/status", onboardingController.getOnboardingStatus);

router.post(
  "/parse-resume",
  uploadResume,
  handleMulterError,
  onboardingController.parseResumeHandler
);

router.post(
  "/complete",
  validate(completeOnboardingSchema),
  onboardingController.completeOnboarding
);

export default router;
