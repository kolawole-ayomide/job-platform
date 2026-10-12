import Profile from "../models/Profile.model.js";
import User from "../models/User.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { parseResume } from "../services/resumeParser.service.js";
import { uploadBuffer, deleteAsset } from "../services/cloudinary.service.js";

// POST /api/v1/onboarding/parse-resume
// Accepts a multipart file ("resume" field, handled by upload.middleware.js),
// uploads it to Cloudinary, extracts text, and returns structured fields
// for the frontend to autofill via react-hook-form's reset()/setValue().
// This does NOT save anything to the Profile yet - that happens on
// POST /api/v1/onboarding/complete after the user reviews/edits the autofill.
export const parseResumeHandler = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest("No resume file uploaded. Attach it under the 'resume' field.");
  }

  // Upload first so we always have a permanent URL, even if parsing partially
  // fails - the user shouldn't have to re-upload just because our regex
  // parser couldn't find their phone number.
  const { url, publicId } = await uploadBuffer(req.file.buffer, {
    folder: `resumes/${req.user._id}`,
    resourceType: "raw",
    filename: `resume-${Date.now()}`,
  });

  const parsedFields = await parseResume(req.file.buffer, req.file.mimetype);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        resumeUrl: url,
        resumePublicId: publicId,
        ...parsedFields,
      },
      "Resume parsed successfully. Review the extracted details below."
    )
  );
});

// POST /api/v1/onboarding/complete
// Saves the (possibly user-edited) autofilled data as the user's Profile,
// and marks onboarding complete on the User document.
export const completeOnboarding = asyncHandler(async (req, res) => {
  const { resumeUrl, resumePublicId, ...profileData } = req.body;

  let profile = await Profile.findOne({ userId: req.user._id });
  if (!profile) {
    profile = new Profile({ userId: req.user._id });
  }

  // If a new resume replaced an old one, clean up the old Cloudinary asset.
  if (resumeUrl && profile.resumeUrl && resumeUrl !== profile.resumeUrl) {
    await deleteAsset(profile.resumePublicId, "raw");
  }

  Object.assign(profile, profileData);
  if (resumeUrl) profile.resumeUrl = resumeUrl;
  if (resumePublicId) profile.resumePublicId = resumePublicId;

  await profile.save();

  await User.findByIdAndUpdate(req.user._id, { onboardingComplete: true });

  res
    .status(200)
    .json(new ApiResponse(200, { profile }, "Onboarding complete. Welcome to Wizpace!"));
});

// GET /api/v1/onboarding/status
export const getOnboardingStatus = asyncHandler(async (req, res) => {
  res.status(200).json(
    new ApiResponse(200, {
      onboardingComplete: req.user.onboardingComplete,
      isVerified: req.user.isVerified,
    })
  );
});
