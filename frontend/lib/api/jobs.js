import { apiClient } from "./client";

// GET /api/v1/jobs
export async function listJobs(params = {}) {
  const { data } = await apiClient.get("/jobs", { params });
  return data;
}

// GET /api/v1/jobs/recommended
export async function getRecommendedJobs() {
  const { data } = await apiClient.get("/jobs/recommended");
  return data;
}

// GET /api/v1/jobs/:id - includes real matchScore + isSaved for the caller
export async function getJobById(id) {
  const { data } = await apiClient.get(`/jobs/${id}`);
  return data;
}

// POST /api/v1/jobs/:id/apply
export async function applyToJob(id, coverNote) {
  const { data } = await apiClient.post(`/jobs/${id}/apply`, { coverNote });
  return data;
}

// GET /api/v1/jobs/applications/me
export async function getMyApplications() {
  const { data } = await apiClient.get("/jobs/applications/me");
  return data;
}

// PATCH /api/v1/jobs/applications/:id/status
export async function updateApplicationStatus(id, status) {
  const { data } = await apiClient.patch(`/jobs/applications/${id}/status`, { status });
  return data;
}

// GET /api/v1/jobs/saved/me
export async function getSavedJobs() {
  const { data } = await apiClient.get("/jobs/saved/me");
  return data;
}

// POST /api/v1/jobs/:id/save
export async function saveJob(id) {
  const { data } = await apiClient.post(`/jobs/${id}/save`);
  return data;
}

// DELETE /api/v1/jobs/:id/save
export async function unsaveJob(id) {
  const { data } = await apiClient.delete(`/jobs/${id}/save`);
  return data;
}

// POST /api/v1/jobs/:id/report
export async function reportJob(id, reason, details) {
  const { data } = await apiClient.post(`/jobs/${id}/report`, { reason, details });
  return data;
}
