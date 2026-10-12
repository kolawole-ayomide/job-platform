import { apiClient } from "./client";

// POST /api/v1/onboarding/parse-resume (multipart, field name must be "resume")
export async function parseResume(file) {
  const formData = new FormData();
  formData.append("resume", file);
  const { data } = await apiClient.post("/onboarding/parse-resume", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// POST /api/v1/onboarding/complete
export async function completeOnboarding(payload) {
  const { data } = await apiClient.post("/onboarding/complete", payload);
  return data;
}

// GET /api/v1/onboarding/status
export async function getOnboardingStatus() {
  const { data } = await apiClient.get("/onboarding/status");
  return data;
}
