import { Router } from "express";
import authRoutes from "./auth.routes.js";
import usersRoutes from "./users.routes.js";
import onboardingRoutes from "./onboarding.routes.js";
import jobsRoutes from "./jobs.routes.js";
import resumeRoutes from "./resume.routes.js";
import wizbotRoutes from "./wizbot.routes.js";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Wizpace API v1",
    endpoints: ["/auth", "/users", "/onboarding", "/jobs", "/resume", "/wizbot"],
  });
});

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/onboarding", onboardingRoutes);
router.use("/jobs", jobsRoutes);
router.use("/resume", resumeRoutes);
router.use("/wizbot", wizbotRoutes);

export default router;
