import { apiClient } from "./client";

// GET /api/v1/resume/templates (public)
export async function getTemplates() {
  const { data } = await apiClient.get("/resume/templates");
  return data;
}

// GET /api/v1/resume
export async function getResumeData() {
  const { data } = await apiClient.get("/resume");
  return data;
}

// PATCH /api/v1/resume
export async function updateResumeData(payload) {
  const { data } = await apiClient.patch("/resume", payload);
  return data;
}

// GET /api/v1/resume/preview?template=X - streams a PDF, so we just build the URL
// for a direct <a>/window.open() navigation rather than fetching it as JSON.
export function getPreviewUrl(templateId) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
  return `${base}/resume/preview?template=${encodeURIComponent(templateId)}`;
}

// POST /api/v1/resume/export
export async function exportResume(templateId) {
  const { data } = await apiClient.post("/resume/export", { template: templateId });
  return data;
}
