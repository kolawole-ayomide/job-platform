import Job from "../models/Job.model.js";
import Application from "../models/Application.model.js";
import Profile from "../models/Profile.model.js";
import SavedJob from "../models/SavedJob.model.js";
import JobReport from "../models/JobReport.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

/** Real overlap-based match score (0-100) between a job and a user's profile skills. */
function computeMatchScore(job, profileSkills) {
  const jobSkills = (job.skills || []).map((s) => s.toLowerCase());
  if (!jobSkills.length) return 0;
  const overlap = jobSkills.filter((s) => profileSkills.includes(s)).length;
  return Math.round((overlap / jobSkills.length) * 100);
}

// GET /api/v1/jobs
// Supports: keyword search, location, workMode, jobType, experienceLevel,
// salary range, and pagination - matches the "Job Discovery & Management" spec.
export const listJobs = asyncHandler(async (req, res) => {
  const {
    keyword,
    location,
    workMode,
    jobType,
    experienceLevel,
    salaryMin,
    salaryMax,
    companySize,
    sortBy,
    page,
    limit,
  } = req.query;

  const filter = { isActive: true };

  if (keyword) filter.$text = { $search: keyword };
  if (location) filter.location = { $regex: location, $options: "i" };
  if (workMode) filter.workMode = workMode;
  if (jobType) filter.jobType = jobType;
  // Same reasoning as buildScanFilter in wizbotAgent.service.js - a job with
  // an unknown experience level (most external/JSearch listings) shouldn't
  // be silently excluded just because we don't have that one data point.
  if (experienceLevel) filter.experienceLevel = { $in: [experienceLevel, null] };
  if (companySize) filter.companySize = companySize;
  if (salaryMin !== undefined) {
    filter.$and = (filter.$and || []).concat({
      $or: [
        { "salaryRange.max": { $gte: salaryMin } },
        { "salaryRange.max": { $exists: false } },
        { "salaryRange.max": null },
      ],
    });
  }
  if (salaryMax !== undefined) filter["salaryRange.min"] = { ...(filter["salaryRange.min"] || {}), $lte: salaryMax };

  const skip = (page - 1) * limit;

  // Real server-side sort across the full result set, not just the current page.
  let sort = { createdAt: -1 };
  let projection = undefined;
  if (sortBy === "salary-high") sort = { "salaryRange.max": -1, createdAt: -1 };
  else if (sortBy === "salary-low") sort = { "salaryRange.min": 1, createdAt: -1 };
  else if (sortBy === "relevance" && keyword) {
    projection = { score: { $meta: "textScore" } };
    sort = { score: { $meta: "textScore" }, createdAt: -1 };
  }

  const [jobs, total] = await Promise.all([
    Job.find(filter, projection).sort(sort).skip(skip).limit(limit),
    Job.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  );
});

// GET /api/v1/jobs/recommended
// Naive but real matching: scores active jobs by how many of the user's
// skills overlap with the job's required skills, and returns the top matches.
export const getRecommendedJobs = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ userId: req.user._id });
  const userSkills = (profile?.skills || []).map((s) => s.toLowerCase());

  if (userSkills.length === 0) {
    // No skills on file yet (e.g. onboarding incomplete) - fall back to most recent jobs
    const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 }).limit(10);
    return res.status(200).json(new ApiResponse(200, { jobs, matchedBySkills: false }));
  }

  const candidateJobs = await Job.find({ isActive: true }).limit(200); // cap for scoring cost

  const scored = candidateJobs
    .map((job) => {
      const jobSkills = job.skills.map((s) => s.toLowerCase());
      const overlap = jobSkills.filter((s) => userSkills.includes(s)).length;
      return { job, score: overlap };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  res.status(200).json(
    new ApiResponse(200, {
      jobs: scored.map((entry) => entry.job),
      matchedBySkills: true,
    })
  );
});

// GET /api/v1/jobs/:id
// Includes a real matchScore (skill overlap against the caller's profile)
// and whether the caller has already saved this job, when authenticated.
export const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    throw ApiError.notFound("Job not found.");
  }

  let matchScore = null;
  let isSaved = false;

  if (req.user) {
    const [profile, saved] = await Promise.all([
      Profile.findOne({ userId: req.user._id }),
      SavedJob.findOne({ userId: req.user._id, jobId: job._id }),
    ]);
    const profileSkills = (profile?.skills || []).map((s) => s.toLowerCase());
    matchScore = computeMatchScore(job, profileSkills);
    isSaved = Boolean(saved);
  }

  res.status(200).json(new ApiResponse(200, { job, matchScore, isSaved }));
});

// POST /api/v1/jobs
export const createJob = asyncHandler(async (req, res) => {
  const job = await Job.create({ ...req.body, postedBy: req.user._id });
  res.status(201).json(new ApiResponse(201, { job }, "Job posted successfully."));
});

// PATCH /api/v1/jobs/:id
export const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw ApiError.notFound("Job not found.");

  if (String(job.postedBy) !== String(req.user._id)) {
    throw ApiError.forbidden("You can only edit jobs you posted.");
  }

  Object.assign(job, req.body);
  await job.save();

  res.status(200).json(new ApiResponse(200, { job }, "Job updated."));
});

// DELETE /api/v1/jobs/:id
export const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw ApiError.notFound("Job not found.");

  if (String(job.postedBy) !== String(req.user._id)) {
    throw ApiError.forbidden("You can only delete jobs you posted.");
  }

  await job.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Job deleted."));
});

// POST /api/v1/jobs/:id/apply
export const applyToJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job || !job.isActive) {
    throw ApiError.notFound("Job not found or no longer accepting applications.");
  }

  // We have no ATS integration for externally-sourced (JSearch) listings -
  // there's nowhere for us to actually submit an application. Creating a
  // local Application record for one of these would just be a fake entry
  // that no real employer ever sees. The frontend should send the user to
  // job.applyUrl instead of calling this endpoint for external jobs; this
  // is the server-side guard in case that's ever bypassed.
  if (job.source === "jsearch") {
    throw ApiError.badRequest(
      "This is an external listing - apply directly on the original posting.",
      [{ field: "applyUrl", message: job.applyUrl }]
    );
  }

  const profile = await Profile.findOne({ userId: req.user._id });
  if (!profile?.resumeUrl) {
    throw ApiError.badRequest("Upload a resume before applying to jobs.");
  }

  const existing = await Application.findOne({ userId: req.user._id, jobId: job._id });
  if (existing) {
    throw ApiError.conflict("You have already applied to this job.");
  }

  const application = await Application.create({
    userId: req.user._id,
    jobId: job._id,
    resumeUrl: profile.resumeUrl,
    coverNote: req.body.coverNote,
  });

  job.applicantsCount += 1;
  await job.save();

  res.status(201).json(new ApiResponse(201, { application }, "Application submitted."));
});

// GET /api/v1/jobs/applications/me
export const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .populate("jobId", "title company location workMode jobType");

  res.status(200).json(new ApiResponse(200, { applications }));
});

// PATCH /api/v1/jobs/applications/:id/status
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  // Scoping the lookup to userId (not just _id) doubles as the ownership
  // check - a user can never update someone else's application, and a
  // wrong/missing id just looks like "not found" either way.
  const application = await Application.findOne({ _id: req.params.id, userId: req.user._id });
  if (!application) {
    throw ApiError.notFound("Application not found.");
  }

  application.status = req.body.status;
  await application.save(); // triggers the statusHistory pre-save hook

  const populated = await application.populate("jobId", "title company location workMode jobType");
  res.status(200).json(new ApiResponse(200, { application: populated }, "Application status updated."));
});

// GET /api/v1/jobs/saved/me
export const getSavedJobs = asyncHandler(async (req, res) => {
  const saved = await SavedJob.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .populate("jobId");

  // Filter out any saved rows whose job was since deleted, rather than 500ing.
  const jobs = saved.filter((s) => s.jobId).map((s) => s.jobId);
  res.status(200).json(new ApiResponse(200, { jobs }));
});

// POST /api/v1/jobs/:id/save
export const saveJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw ApiError.notFound("Job not found.");

  const saved = await SavedJob.findOneAndUpdate(
    { userId: req.user._id, jobId: job._id },
    { userId: req.user._id, jobId: job._id },
    { upsert: true, new: true }
  );

  res.status(200).json(new ApiResponse(200, { saved: true, savedJob: saved }, "Job saved."));
});

// DELETE /api/v1/jobs/:id/save
export const unsaveJob = asyncHandler(async (req, res) => {
  await SavedJob.findOneAndDelete({ userId: req.user._id, jobId: req.params.id });
  res.status(200).json(new ApiResponse(200, { saved: false }, "Job removed from saved list."));
});

// POST /api/v1/jobs/:id/report
export const reportJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw ApiError.notFound("Job not found.");

  const report = await JobReport.create({
    userId: req.user._id,
    jobId: job._id,
    reason: req.body.reason,
    details: req.body.details,
  });

  res.status(201).json(new ApiResponse(201, { report }, "Report submitted. Our team will review it."));
});
