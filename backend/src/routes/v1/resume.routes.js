import { Router } from "express";
import * as resumeController from "../../controllers/resume.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { completeOnboardingSchema } from "../../validators/onboarding.validator.js";

const router = Router();

router.get("/templates", resumeController.listTemplates); // public - lets the template chooser render before login if needed

router.use(protect);

router.get("/", resumeController.getResumeData);
// Reuses the onboarding schema since it's the same underlying Profile shape -
// the resume builder is a superset editor over the same fields.
router.patch("/", validate(completeOnboardingSchema), resumeController.updateResumeData);

router.get("/preview", resumeController.previewResumePdf);
router.post("/export", resumeController.exportResumePdf);

export default router;
