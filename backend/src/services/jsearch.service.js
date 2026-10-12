import env from "../config/env.js";
import { extractSkills } from "./resumeParser.service.js";

function getHost() {
  return env.jsearch.apiHost || "jsearch.p.rapidapi.com";
}

// Built from the configured host (not hardcoded) so the URL and the
// X-RapidAPI-Host header always agree. The path is "/search-v2", not
// "/search" - confirmed against a live, working request in RapidAPI's own
// Playground (the plain "/search" path returns RapidAPI's gateway-level
// "Endpoint does not exist" error for this particular listing).
function getBaseUrl() {
  return `https://${getHost()}/search-v2`;
}

function getHeaders() {
  if (!env.jsearch.apiKey) {
    throw new Error(
      "JSEARCH_API_KEY is not set - job syncing is disabled until it's configured in .env."
    );
  }
  return {
    "X-RapidAPI-Key": env.jsearch.apiKey,
    "X-RapidAPI-Host": getHost(),
  };
}

// Maps JSearch's employment type strings to our own jobType enum.
const EMPLOYMENT_TYPE_MAP = {
  FULLTIME: "full-time",
  PARTTIME: "part-time",
  CONTRACTOR: "contract",
  INTERN: "internship",
};

function normalizeJobType(raw) {
  return EMPLOYMENT_TYPE_MAP[raw] ?? "full-time";
}

function normalizeLocation(job) {
  if (job.job_is_remote) return job.job_country ? `Remote (${job.job_country})` : "Remote";
  return [job.job_city, job.job_state, job.job_country].filter(Boolean).join(", ") || "Not specified";
}

/**
 * Converts one raw JSearch result into the shape our Job model expects.
 * Nothing here is fabricated - every field either maps directly to a real
 * JSearch field or is left null/default when JSearch doesn't provide it
 * (e.g. companySize, which JSearch has no equivalent for).
 */
export function normalizeJSearchJob(job) {
  return {
    title: job.job_title || "Untitled role",
    company: job.employer_name || "Unknown company",
    companyLogoUrl: job.employer_logo || null,
    companyWebsite: job.employer_website || null,
    location: normalizeLocation(job),
    workMode: job.job_is_remote ? "remote" : "onsite",
    jobType: normalizeJobType(job.job_employment_type),
    // JSearch has no experience-level field - explicitly null (genuinely
    // unknown), not guessed. See Job.model.js for why this matters: a
    // wrong guess here would silently make this job invisible to anyone
    // filtering by a specific level.
    experienceLevel: null,
    description: job.job_description || "",
    requirements: job.job_highlights?.Qualifications ?? [],
    responsibilities: job.job_highlights?.Responsibilities ?? [],
    // JSearch doesn't return a structured skills field, but the listing's
    // own description/qualifications/responsibilities text almost always
    // names real skills explicitly ("Required Skills: React, Node.js...").
    // This extracts only skills genuinely stated in that real text (same
    // dictionary-matching approach already used for resumes in
    // resumeParser.service.js) - it's extraction, not a guess.
    skills: extractSkills(
      [job.job_description, ...(job.job_highlights?.Qualifications ?? []), ...(job.job_highlights?.Responsibilities ?? [])]
        .filter(Boolean)
        .join(" ")
    ),
    salaryRange: {
      currency: job.job_salary_currency || "USD",
      min: job.job_min_salary ?? undefined,
      max: job.job_max_salary ?? undefined,
    },
    isActive: true,
    source: "jsearch",
    externalId: job.job_id,
    applyUrl: job.job_apply_link || null,
    externalPostedAt: job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc) : null,
  };
}

/**
 * Searches JSearch for a free-text query (e.g. "software engineer in Lagos",
 * or just "software engineer" for a broad/remote-friendly search) and
 * returns normalized job objects ready to upsert into our Job collection.
 */
export async function searchJSearch(query, { page = 1 } = {}) {
  const url = new URL(getBaseUrl());
  url.searchParams.set("query", query);
  url.searchParams.set("page", String(page));
  url.searchParams.set("num_pages", "1");

  const res = await fetch(url, { headers: getHeaders() });

  if (!res.ok) {
    // Surface the real HTTP status *and the exact URL hit* so callers (the
    // sync service, the Wizbot scan cycle) can log something actionable
    // instead of a bare "failed" - a host/path mismatch is invisible
    // without seeing exactly what was requested.
    const body = await res.text().catch(() => "");
    throw new Error(`JSearch request failed (${res.status}) at ${url}: ${body.slice(0, 300)}`);
  }

  const payload = await res.json();
  // JSearch's actual response shape is { data: { jobs: [...] } }, not a
  // bare array at `data` - confirmed against a live response from RapidAPI's
  // own Playground. Falling back to payload.data if it's already an array
  // covers either shape without guessing wrong either way.
  const results = Array.isArray(payload.data?.jobs)
    ? payload.data.jobs
    : Array.isArray(payload.data)
      ? payload.data
      : [];
  return results.map(normalizeJSearchJob);
}