import Job from "../models/Job.model.js";
import { searchJSearch } from "./jsearch.service.js";

/**
 * Upserts a batch of normalized JSearch jobs into our Job collection.
 * Keyed on (source, externalId) so repeated syncs update existing listings
 * (e.g. if a job goes stale) rather than duplicating them.
 */
export async function upsertJSearchJobs(normalizedJobs) {
  let upserted = 0;
  for (const job of normalizedJobs) {
    if (!job.externalId) continue; // can't dedupe without an id - skip rather than risk duplicates
    await Job.findOneAndUpdate(
      { source: "jsearch", externalId: job.externalId },
      { $set: job },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    upserted += 1;
  }
  return upserted;
}

/** Runs one JSearch query and upserts whatever comes back. Never throws -
 * syncing is best-effort background work, so a failed sync (rate limit, no
 * credits, network hiccup) should be logged, not crash whatever triggered it. */
export async function syncQuery(query) {
  try {
    const jobs = await searchJSearch(query);
    const upserted = await upsertJSearchJobs(jobs);
    console.log(`[jobSync] "${query}" -> ${upserted} listings synced.`);
    return upserted;
  } catch (err) {
    console.error(`[jobSync] Failed to sync "${query}":`, err.message);
    return 0;
  }
}

// A broad, diverse rotation so the general "Discover Jobs" search page has
// real listings across common roles, not just whatever a Wizbot agent
// happens to be scanning for. One query per scheduled run (see server.js)
// to stay well within JSearch's free-tier request budget.
const BROAD_QUERIES = [
  "software engineer",
  "product manager",
  "data analyst",
  "marketing",
  "customer support",
  "graphic designer",
  "accountant",
  "sales representative",
  "project manager",
  "nurse",
];

let broadQueryIndex = 0;

/** Called on a timer (server.js) - syncs the next query in the rotation. */
export async function runBroadSyncCycle() {
  const query = BROAD_QUERIES[broadQueryIndex % BROAD_QUERIES.length];
  broadQueryIndex += 1;
  return syncQuery(query);
}

/**
 * Called from a Wizbot agent's scan cycle - syncs fresh listings matching
 * that specific agent's own keywords/locations before it scores the local
 * pool, so "scanning" pulls in genuinely current external results for what
 * this bot actually cares about, not just the broad rotation above.
 */
export async function syncForAgent(agent) {
  const keywords = agent.criteria?.keywords ?? [];
  if (!keywords.length) return 0;

  const location = agent.criteria?.locations?.[0];
  const query = location ? `${keywords.join(" ")} in ${location}` : keywords.join(" ");

  return syncQuery(query);
}