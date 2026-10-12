import { apiClient } from "./client";

// PATCH /api/v1/users/account - updates User.name / User.email. Changing
// email flips isVerified back to false and re-sends a verification email
// server-side (see users.controller.js `updateAccount`).
export async function updateAccount(payload) {
  const { data } = await apiClient.patch("/users/account", payload);
  return data;
}

// POST /api/v1/users/avatar (multipart, field name "avatar") - uploads a
// real image to Cloudinary and sets it as the user's profile picture.
export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append("avatar", file);
  const { data } = await apiClient.post("/users/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// GET /api/v1/users/profile
export async function getProfile() {
  const { data } = await apiClient.get("/users/profile");
  return data;
}

// PATCH /api/v1/users/profile
export async function updateProfile(payload) {
  const { data } = await apiClient.patch("/users/profile", payload);
  return data;
}

// GET /api/v1/users/dashboard
export async function getDashboardSummary() {
  const { data } = await apiClient.get("/users/dashboard");
  return data;
}
