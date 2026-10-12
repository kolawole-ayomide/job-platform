import { Router } from "express";
import * as jobsController from "../../controllers/jobs.controller.js";
import { protect, requireOnboarded } from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createJobSchema,
  updateJobSchema,
  jobQuerySchema,
  applyToJobSchema,
  reportJobSchema,
  updateApplicationStatusSchema,
} from "../../validators/job.validator.js";

const router = Router();

// Public browsing - jobs are discoverable without an account.
router.get("/", validate(jobQuerySchema, "query"), jobsController.listJobs);

// Everything below requires auth.
router.use(protect);

router.get("/recommended", jobsController.getRecommendedJobs);
router.get("/applications/me", jobsController.getMyApplications);
router.patch(
  "/applications/:id/status",
  validate(updateApplicationStatusSchema),
  jobsController.updateApplicationStatus
);
router.get("/saved/me", jobsController.getSavedJobs);

router.get("/:id", jobsController.getJobById);
router.post("/:id/save", jobsController.saveJob);
router.delete("/:id/save", jobsController.unsaveJob);
router.post("/:id/report", validate(reportJobSchema), jobsController.reportJob);
router.post("/", validate(createJobSchema), jobsController.createJob);
router.patch("/:id", validate(updateJobSchema), jobsController.updateJob);
router.delete("/:id", jobsController.deleteJob);

router.post(
  "/:id/apply",
  requireOnboarded,
  validate(applyToJobSchema),
  jobsController.applyToJob
);

export default router;
