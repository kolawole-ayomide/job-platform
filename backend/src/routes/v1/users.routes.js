import { Router } from "express";
import * as usersController from "../../controllers/users.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { uploadAvatar, handleMulterError } from "../../middlewares/upload.middleware.js";
import { updateAccountSchema } from "../../validators/users.validator.js";
import { completeOnboardingSchema } from "../../validators/onboarding.validator.js";

const router = Router();

router.use(protect);

router.patch("/account", validate(updateAccountSchema), usersController.updateAccount);
router.post("/avatar", uploadAvatar, handleMulterError, usersController.uploadAvatar);
router.get("/profile", usersController.getProfile);
router.patch("/profile", validate(completeOnboardingSchema), usersController.updateProfile);
router.get("/dashboard", usersController.getDashboardSummary);

export default router;