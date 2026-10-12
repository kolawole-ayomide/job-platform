import crypto from "crypto";
import User from "../models/User.model.js";
import Profile from "../models/Profile.model.js";
import Application from "../models/Application.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendVerificationEmail } from "../services/email.service.js";
import { uploadBuffer, deleteAsset } from "../services/cloudinary.service.js";
import env from "../config/env.js";

const HOUR_MS = 60 * 60 * 1000;

// Mirrors the private hashToken() in auth.controller.js - same approach
// (store a hash, email out the raw token) so a DB leak can't be used to
// forge verification links.
function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

// GET /api/v1/users/profile
export const getProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ userId: req.user._id });
  if (!profile) {
    throw ApiError.notFound("Profile not found.");
  }
  res.status(200).json(new ApiResponse(200, { profile }));
});

// PATCH /api/v1/users/account - updates User.name / User.email (previously
// there was no way to change these at all after signup). Changing email
// re-triggers verification, exactly like a fresh signup would, since the
// new address hasn't been confirmed to belong to this person yet.
export const updateAccount = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw ApiError.notFound("User not found.");
  }

  let emailChanged = false;

  if (email && email !== user.email) {
    const existing = await User.findOne({ email, _id: { $ne: user._id } });
    if (existing) {
      throw ApiError.conflict("That email is already in use by another account.");
    }
    user.email = email;
    user.isVerified = false;
    emailChanged = true;
  }

  if (name) {
    user.name = name;
  }

  let emailDelivered = true;

  if (emailChanged) {
    const rawVerificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = hashToken(rawVerificationToken);
    user.verificationTokenExpires = Date.now() + 24 * HOUR_MS;
    await user.save();

    const verificationUrl = `${env.clientUrl}/verify-email?token=${rawVerificationToken}`;
    try {
      await sendVerificationEmail(user.email, verificationUrl);
    } catch (err) {
      emailDelivered = false;
      console.error(`[email] Failed to send re-verification email to ${user.email}:`, err.message);
    }
  } else {
    await user.save();
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: user.toSafeObject(), emailDelivered },
        emailChanged
          ? emailDelivered
            ? "Account updated. Please check your new email to verify it."
            : "Account updated, but we couldn't send a verification email to your new address right now."
          : "Account updated."
      )
    );
});

// POST /api/v1/users/avatar (multipart, field name "avatar")
// Uploads a real image to Cloudinary and sets it as the user's profile
// picture. Cleans up the previous upload (if any) so we don't accumulate
// orphaned Cloudinary assets every time someone changes their photo.
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest("No image file was provided.");
  }

  const user = await User.findById(req.user._id).select("+avatarPublicId");
  if (!user) {
    throw ApiError.notFound("User not found.");
  }

  const previousPublicId = user.avatarPublicId;

  const { url, publicId } = await uploadBuffer(req.file.buffer, {
    folder: "wizjobai/avatars",
    resourceType: "image",
  });

  user.avatarUrl = url;
  user.avatarPublicId = publicId;
  await user.save();

  // Only delete the previous asset if we're the ones who uploaded it
  // (never touches a Google/LinkedIn-hosted photo).
  if (previousPublicId) {
    await deleteAsset(previousPublicId, "image");
  }

  res.status(200).json(new ApiResponse(200, { user: user.toSafeObject() }, "Profile picture updated."));
});

// PATCH /api/v1/users/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findOneAndUpdate(
    { userId: req.user._id },
    { $set: req.body },
    { returnDocument: 'after', runValidators: true }
  );

  if (!profile) {
    throw ApiError.notFound("Profile not found.");
  }

  res.status(200).json(new ApiResponse(200, { profile }, "Profile updated."));
});

// GET /api/v1/users/dashboard
// Powers the "Home & Discovery" dashboard: profile completeness, application
// metrics, and recent activity - all derived from real data, not placeholders.
export const getDashboardSummary = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ userId: req.user._id });

  const profileCompleteness = computeProfileCompleteness(profile);

  // 14 days of real daily counts, so the frontend can render genuine
  // sparklines (last 7 days) and a genuine week-over-week % change (this 7
  // days vs the 7 before) - no fabricated or approximated numbers. Total
  // is grouped by real creation date; interview/rejected/offer are grouped
  // by their real statusHistory transition date (see Application.model.js).
  const DAYS = 14;
  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - (DAYS - 1));
  rangeStart.setHours(0, 0, 0, 0);

  const [applications, statusCounts, totalRaw, statusEventsRaw] = await Promise.all([
    Application.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("jobId", "title company location"),
    Application.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    // "All Applications Sent" per day - genuine creation dates.
    Application.aggregate([
      { $match: { userId: req.user._id, createdAt: { $gte: rangeStart } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]),
    // Interviews/Rejections/Offers per day - genuine status-transition
    // dates from statusHistory, not approximated from createdAt anymore.
    Application.aggregate([
      { $match: { userId: req.user._id } },
      { $unwind: "$statusHistory" },
      {
        $match: {
          "statusHistory.changedAt": { $gte: rangeStart },
          "statusHistory.status": { $in: ["interview", "rejected", "offer"] },
        },
      },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$statusHistory.changedAt" } },
            status: "$statusHistory.status",
          },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const applicationsByStatus = statusCounts.reduce((acc, { _id, count }) => {
    acc[_id] = count;
    return acc;
  }, {});

  // Zero-fill every day in the 14-day window so gaps (no applications that
  // day) show as a real 0, not a missing data point.
  const dayKeys = [];
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + i);
    dayKeys.push(d.toISOString().slice(0, 10));
  }
  const byDay = Object.fromEntries(
    dayKeys.map((k) => [k, { total: 0, interview: 0, rejected: 0, offer: 0 }])
  );
  for (const row of totalRaw) {
    if (byDay[row._id]) byDay[row._id].total += row.count;
  }
  for (const row of statusEventsRaw) {
    const { day, status } = row._id;
    if (byDay[day]) byDay[day][status] += row.count;
  }

  const last7Days = dayKeys.slice(7);
  const prev7Days = dayKeys.slice(0, 7);
  const sumField = (days, field) => days.reduce((sum, d) => sum + byDay[d][field], 0);

  // Omits the % rather than showing a misleading "∞% up" or a fabricated
  // number when there's nothing in the prior week to compare against.
  const pctChange = (current, previous) => {
    if (previous === 0) return null;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  };

  res.status(200).json(
    new ApiResponse(200, {
      profileCompleteness,
      totalApplications: applications.length > 0 ? await Application.countDocuments({ userId: req.user._id }) : 0,
      applicationsByStatus,
      recentApplications: applications,
      weeklyApplicationsCount: sumField(last7Days, "total"),
      dailyTrend: last7Days.map((d) => ({ date: d, ...byDay[d] })),
      trends: {
        total: pctChange(sumField(last7Days, "total"), sumField(prev7Days, "total")),
        interview: pctChange(sumField(last7Days, "interview"), sumField(prev7Days, "interview")),
        rejected: pctChange(sumField(last7Days, "rejected"), sumField(prev7Days, "rejected")),
        offer: pctChange(sumField(last7Days, "offer"), sumField(prev7Days, "offer")),
      },
    })
  );
});

function computeProfileCompleteness(profile) {
  if (!profile) return 0;

  const checks = [
    !!profile.resumeUrl,
    !!profile.headline,
    !!profile.summary,
    profile.skills?.length > 0,
    profile.experience?.length > 0,
    profile.education?.length > 0,
    profile.jobPreferences?.desiredRoles?.length > 0,
    !!profile.phone,
  ];

  const completedCount = checks.filter(Boolean).length;
  return Math.round((completedCount / checks.length) * 100);
}
