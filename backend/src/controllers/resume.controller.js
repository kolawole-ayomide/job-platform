import Profile from "../models/Profile.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateResumePdf, RESUME_TEMPLATES } from "../services/resumePdf.service.js";
import { uploadBuffer } from "../services/cloudinary.service.js";

// GET /api/v1/resume/templates
export const listTemplates = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, { templates: RESUME_TEMPLATES }));
});

// GET /api/v1/resume
// Returns the profile data shaped for the resume builder UI.
export const getResumeData = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ userId: req.user._id });
  if (!profile) throw ApiError.notFound("Profile not found.");
  res.status(200).json(new ApiResponse(200, { profile }));
});

// PATCH /api/v1/resume
// Same underlying Profile document as onboarding - the builder is just a
// richer editor over the same fields, so we don't duplicate the data model.
export const updateResumeData = asyncHandler(async (req, res) => {
  const profile = await Profile.findOneAndUpdate(
    { userId: req.user._id },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!profile) throw ApiError.notFound("Profile not found.");
  res.status(200).json(new ApiResponse(200, { profile }, "Resume updated."));
});

// GET /api/v1/resume/preview?template=modern-blue
// Streams a generated PDF directly back - used for the "live printable PDF
// preview" in an <iframe> or new tab, no Cloudinary round-trip needed.
export const previewResumePdf = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ userId: req.user._id });
  if (!profile) throw ApiError.notFound("Profile not found.");

  const pdfBuffer = await generateResumePdf({
    profile,
    name: req.user.name,
    email: req.user.email,
    templateId: req.query.template,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=resume-preview.pdf");
  res.send(pdfBuffer);
});

// POST /api/v1/resume/export
// Generates the PDF, uploads it to Cloudinary, and returns a permanent URL
// (e.g. for the user to share or download later, or to attach to applications).
export const exportResumePdf = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ userId: req.user._id });
  if (!profile) throw ApiError.notFound("Profile not found.");

  const templateId = req.body.template;

  const pdfBuffer = await generateResumePdf({
    profile,
    name: req.user.name,
    email: req.user.email,
    templateId,
  });

  const { url } = await uploadBuffer(pdfBuffer, {
    folder: `resumes/${req.user._id}/exports`,
    resourceType: "raw",
    filename: `resume-${templateId || "classic"}-${Date.now()}`,
  });

  res.status(200).json(new ApiResponse(200, { url }, "Resume exported."));
});
