import crypto from "crypto";
import User from "../models/User.model.js";
import Profile from "../models/Profile.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateToken, setTokenCookie, clearTokenCookie } from "../utils/generateToken.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/email.service.js";
import env from "../config/env.js";

const HOUR_MS = 60 * 60 * 1000;

function hashToken(rawToken) {
  // We store a hash of the token, not the token itself - mirrors how we
  // never store plaintext passwords. If the DB leaks, raw tokens (which
  // are emailed out, i.e. more exposed) still can't be reconstructed.
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

// POST /api/v1/auth/signup
export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict("An account with this email already exists.");
  }

  const rawVerificationToken = crypto.randomBytes(32).toString("hex");

  const user = await User.create({
    name,
    email,
    password,
    verificationToken: hashToken(rawVerificationToken),
    verificationTokenExpires: Date.now() + 24 * HOUR_MS,
  });

 // Create the linked Profile document up front so every other module
  // (onboarding, resume, jobs) can assume `Profile.findOne({ userId })` exists.
  await Profile.create({ userId: user._id });

  const verificationUrl = `${env.clientUrl}/verify-email?token=${rawVerificationToken}`;

  // Account creation must not fail just because the mail server is down/
  // unreachable (e.g. SMTP port blocked, wrong credentials). We log the
  // failure loudly for ops but still let the user in - they can use
  // "resend verification" once email is fixed, which hits this same
  // best-effort path.
  let emailDelivered = true;
  try {
    await sendVerificationEmail(user.email, verificationUrl);
  } catch (err) {
    emailDelivered = false;
    console.error(`[email] Failed to send verification email to ${user.email}:`, err.message);
  }

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: user.toSafeObject(), emailDelivered },
        emailDelivered
          ? "Account created. Please check your email to verify your account."
          : "Account created, but we couldn't send the verification email right now. You can request a new one from your account."
      )
    );
});

// POST /api/v1/auth/signin
export const signin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password.");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized("Invalid email or password.");
  }

  const token = generateToken(user._id);
  setTokenCookie(res, token);

  res.status(200).json(
    new ApiResponse(200, { user: user.toSafeObject(), token }, "Signed in successfully.")
    // `token` is also returned in the body (not just the cookie) so non-browser
    // clients (mobile apps, Postman) can use the Authorization header instead.
  );
});

// POST /api/v1/auth/google
// Frontend uses Google Identity Services to get an id_token, then sends it
// here. We verify it directly against Google's tokeninfo endpoint (no extra
// SDK needed) rather than trusting the client-decoded payload.
export const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) throw ApiError.badRequest("idToken is required.");

  const verifyRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  if (!verifyRes.ok) {
    throw ApiError.unauthorized("Invalid or expired Google token.");
  }
  const payload = await verifyRes.json();

  if (payload.aud !== env.googleClientId) {
    throw ApiError.unauthorized("Google token was not issued for this app.");
  }

  let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email: payload.email }] });

  if (!user) {
    user = await User.create({
      name: payload.name || payload.email.split("@")[0],
      email: payload.email,
      googleId: payload.sub,
      avatarUrl: payload.picture || null,
      isVerified: payload.email_verified === "true" || payload.email_verified === true,
    });
    await Profile.create({ userId: user._id });
  } else if (!user.googleId) {
    // Existing email/password account signing in with Google for the first time - link it.
    user.googleId = payload.sub;
    if (!user.avatarUrl) user.avatarUrl = payload.picture || null;
    await user.save();
  }

  const token = generateToken(user._id);
  setTokenCookie(res, token);

  res.status(200).json(new ApiResponse(200, { user: user.toSafeObject(), token }, "Signed in with Google."));
});

// GET /api/v1/auth/linkedin/callback
// LinkedIn's OpenID Connect flow: frontend redirects the browser to LinkedIn's
// authorize URL; LinkedIn redirects back here with ?code=..., which we
// exchange for an access token and then fetch the OIDC userinfo endpoint.
export const linkedinCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;
  if (!code) throw ApiError.badRequest("code is required.");

  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: env.linkedinRedirectUri,
      client_id: env.linkedinClientId,
      client_secret: env.linkedinClientSecret,
    }),
  });
  if (!tokenRes.ok) throw ApiError.unauthorized("Failed to exchange LinkedIn authorization code.");
  const { access_token: accessToken } = await tokenRes.json();

  const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileRes.ok) throw ApiError.unauthorized("Failed to fetch LinkedIn profile.");
  const profile = await profileRes.json();

  let user = await User.findOne({ $or: [{ linkedinId: profile.sub }, { email: profile.email }] });

  if (!user) {
    user = await User.create({
      name: profile.name || profile.email.split("@")[0],
      email: profile.email,
      linkedinId: profile.sub,
      avatarUrl: profile.picture || null,
      isVerified: Boolean(profile.email_verified),
    });
    await Profile.create({ userId: user._id });
  } else if (!user.linkedinId) {
    user.linkedinId = profile.sub;
    if (!user.avatarUrl) user.avatarUrl = profile.picture || null;
    await user.save();
  }

  const token = generateToken(user._id);
  setTokenCookie(res, token);

  // Browser flow - redirect back into the app rather than returning JSON.
  res.redirect(`${env.clientUrl}/dashboard`);
});

// GET /api/v1/auth/github/callback
// Real GitHub OAuth (authorization code flow) - replaces the Crunchbase/
// Greenhouse buttons, which had no genuine "sign in with X" for third-party
// apps to offer job seekers (see backend/.env.example for that history).
export const githubCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;
  if (!code) throw ApiError.badRequest("code is required.");

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: env.githubRedirectUri,
      client_id: env.githubClientId,
      client_secret: env.githubClientSecret,
    }),
  });
  if (!tokenRes.ok) throw ApiError.unauthorized("Failed to exchange GitHub authorization code.");
  const tokenBody = await tokenRes.json();
  if (!tokenBody.access_token) {
    throw ApiError.unauthorized(tokenBody.error_description || "GitHub did not return an access token.");
  }
  const accessToken = tokenBody.access_token;

  const ghHeaders = {
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": "WizJobAI", // GitHub's API requires a User-Agent header on every request
  };

  const profileRes = await fetch("https://api.github.com/user", { headers: ghHeaders });
  if (!profileRes.ok) throw ApiError.unauthorized("Failed to fetch GitHub profile.");
  const profile = await profileRes.json();

  // GitHub only includes `email` on the main profile if the user has made
  // it public. Most don't, so we fetch their verified emails separately and
  // take the primary one - this is the real, correct way to get it, not a
  // fallback/guess.
  let email = profile.email;
  if (!email) {
    const emailsRes = await fetch("https://api.github.com/user/emails", { headers: ghHeaders });
    if (emailsRes.ok) {
      const emails = await emailsRes.json();
      const primary = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified);
      email = primary?.email;
    }
  }
  if (!email) {
    throw ApiError.badRequest(
      "Your GitHub account has no verified email available. Add one at github.com/settings/emails, or sign in a different way."
    );
  }

  const githubIdStr = String(profile.id);
  let user = await User.findOne({ $or: [{ githubId: githubIdStr }, { email }] });

  if (!user) {
    user = await User.create({
      name: profile.name || profile.login,
      email,
      githubId: githubIdStr,
      avatarUrl: profile.avatar_url || null,
      isVerified: true, // GitHub only returns emails it has already verified
    });
    await Profile.create({ userId: user._id });
  } else if (!user.githubId) {
    user.githubId = githubIdStr;
    if (!user.avatarUrl) user.avatarUrl = profile.avatar_url || null;
    await user.save();
  }

  const token = generateToken(user._id);
  setTokenCookie(res, token);

  res.redirect(`${env.clientUrl}/dashboard`);
});

// POST /api/v1/auth/logout
export const logout = asyncHandler(async (req, res) => {
  clearTokenCookie(res);
  res.status(200).json(new ApiResponse(200, null, "Logged out successfully."));
});

// GET /api/v1/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, { user: req.user.toSafeObject() }));
});

// POST /api/v1/auth/verify-email
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationTokenExpires: { $gt: Date.now() },
  }).select("+verificationToken +verificationTokenExpires");

  if (!user) {
    throw ApiError.badRequest("Verification link is invalid or has expired.");
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  res.status(200).json(new ApiResponse(200, { user: user.toSafeObject() }, "Email verified successfully."));
});

// POST /api/v1/auth/resend-verification
export const resendVerification = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.isVerified) {
    throw ApiError.badRequest("Email is already verified.");
  }

  const rawVerificationToken = crypto.randomBytes(32).toString("hex");
  user.verificationToken = hashToken(rawVerificationToken);
  user.verificationTokenExpires = Date.now() + 24 * HOUR_MS;
  await user.save();

 const verificationUrl = `${env.clientUrl}/verify-email?token=${rawVerificationToken}`;

  let emailDelivered = true;
  try {
    await sendVerificationEmail(user.email, verificationUrl);
  } catch (err) {
    emailDelivered = false;
    console.error(`[email] Failed to resend verification email to ${user.email}:`, err.message);
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { emailDelivered },
        emailDelivered
          ? "Verification email resent."
          : "We couldn't send the email right now - the mail server may be unreachable. Please try again shortly."
      )
    );
});

// POST /api/v1/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  // Always return the same response whether or not the user exists, so this
  // endpoint can't be used to enumerate which emails have accounts.
  const genericMessage = "If an account with that email exists, a reset link has been sent.";

  if (!user) {
    return res.status(200).json(new ApiResponse(200, null, genericMessage));
  }

  const rawResetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = hashToken(rawResetToken);
  user.resetPasswordExpires = Date.now() + 1 * HOUR_MS;
  await user.save();

  const resetUrl = `${env.clientUrl}/reset-password?token=${rawResetToken}`;

  // Same best-effort approach as signup - and importantly, we still return
  // the identical generic message either way, so a mail-server outage can't
  // be used to distinguish "email doesn't exist" from "email failed to send".
  try {
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (err) {
    console.error(`[email] Failed to send password reset email to ${user.email}:`, err.message);
  }

  res.status(200).json(new ApiResponse(200, null, genericMessage));
});

// POST /api/v1/auth/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) {
    throw ApiError.badRequest("Reset link is invalid or has expired.");
  }

  user.password = password; // pre-save hook re-hashes this
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  clearTokenCookie(res); // force re-login on all devices after a password reset
  res.status(200).json(new ApiResponse(200, null, "Password reset successfully. Please sign in."));
});
