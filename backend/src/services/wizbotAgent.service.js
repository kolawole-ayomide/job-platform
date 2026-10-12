import Job from "../models/Job.model.js";
import Application from "../models/Application.model.js";
import Profile from "../models/Profile.model.js";
import WizbotAgent from "../models/WizbotAgent.model.js";
import WizbotActivity from "../models/WizbotActivity.model.js";
import { syncForAgent } from "./jobSync.service.js";

const log = (agentId, userId, type, message, extra = {}) =>
  WizbotActivity.create({ agentId, userId, type, message, ...extra });

/**
 * Scores a job against the agent's keyword criteria + the user's profile
 * skills. Real overlap-based scoring, 0-100 - same idea as the jobs
 * "recommended" endpoint, just also weighted by the agent's own keywords.
 */
function scoreJob(job, agent, profileSkills) {
  const jobSkills = (job.skills || []).map((s) => s.toLowerCase());
  const jobText = `${job.title} ${job.description}`.toLowerCase();

  const keywords = (agent.criteria.keywords || []).map((k) => k.toLowerCase()).filter(Boolean);
  const keywordHits = keywords.filter(
    (k) => jobText.includes(k) || jobSkills.includes(k)
  ).length;
  const keywordScore = keywords.length ? (keywordHits / keywords.length) * 60 : 30;

  const skillHits = jobSkills.filter((s) => profileSkills.includes(s)).length;
  const skillScore = jobSkills.length
    ? (skillHits / jobSkills.length) * 40
    : 0;

  return Math.round(Math.min(100, keywordScore + skillScore));
}

function buildScanFilter(agent) {
  const filter = { isActive: true, _id: { $nin: agent.seenJobIds } };
  const { locations, workMode, jobType, experienceLevel, salaryMin } = agent.criteria;

  if (workMode) filter.workMode = workMode;
  if (jobType) filter.jobType = jobType;
  // "Unknown" (null) should stay eligible, not get silently excluded - most
  // JSearch listings have no experience level or salary data at all (see
  // Job.model.js), so a strict-only-exact-match here would quietly hide
  // every external job the moment an agent specifies either criterion,
  // which looks like "the bot isn't finding anything" when really it's
  // just filtering out jobs we simply don't have the data to judge.
  if (experienceLevel) filter.experienceLevel = { $in: [experienceLevel, null] };
  if (salaryMin) {
    filter.$or = [
      { "salaryRange.max": { $gte: salaryMin } },
      { "salaryRange.max": { $exists: false } },
      { "salaryRange.max": null },
    ];
  }
  if (locations?.length) {
    filter.location = { $regex: locations.join("|"), $options: "i" };
  }
  return filter;
}

const MAX_SEEN_JOB_IDS = 5000; // FIFO cap - oldest seen-job entries drop off first
const STALE_LOCK_MS = 10 * 60 * 1000; // a scan should never realistically take this long

/**
 * Runs one scan cycle for a single agent: pulls a batch of not-yet-seen
 * active jobs matching its criteria, scores each one, logs matches, and
 * (if autoApply is on and the user has a resume) files real Application
 * documents for jobs at/above the match threshold. Mutates and saves the
 * agent's counters based on what actually happened.
 *
 * Concurrency: claims the agent atomically via isScanning before doing any
 * work, so a manual "Scan Now" firing at the same moment as the background
 * scheduler (or two rapid manual triggers) can never run two overlapping
 * scan cycles for the same agent - the second caller sees isScanning
 * already true and returns null immediately instead of racing the first.
 * A claim older than STALE_LOCK_MS is treated as abandoned (e.g. the process
 * crashed mid-scan) and can be reclaimed, so a single bad run can never
 * permanently lock an agent out of future scans.
 */
export async function runScanCycle(agentId, { batchSize = 25 } = {}) {
  const staleBefore = new Date(Date.now() - STALE_LOCK_MS);
  const agent = await WizbotAgent.findOneAndUpdate(
    {
      _id: agentId,
      status: "running",
      $or: [{ isScanning: { $ne: true } }, { scanClaimedAt: { $lt: staleBefore } }],
    },
    { $set: { isScanning: true, scanClaimedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!agent) return null; // not running, doesn't exist, or a scan is already (genuinely) in progress

  await log(agent._id, agent.userId, "scan_started", `Scan started (batch of up to ${batchSize} jobs).`);

  try {
    // Pull fresh external listings matching this agent's own criteria before
    // scoring, so a scan means "check what's actually out there right now",
    // not just re-scan whatever already happened to be in our local DB.
    // Best-effort: syncForAgent never throws (see jobSync.service.js), so a
    // JSearch outage/rate-limit degrades to scanning existing local jobs
    // instead of failing the whole cycle.
    await syncForAgent(agent);

    const profile = await Profile.findOne({ userId: agent.userId });
    const profileSkills = (profile?.skills || []).map((s) => s.toLowerCase());

    const filter = buildScanFilter(agent);
    const candidates = await Job.find(filter).sort({ createdAt: -1 }).limit(batchSize);

    let matched = 0;
    let applied = 0;

    for (const job of candidates) {
      agent.seenJobIds.push(job._id);
      agent.stats.jobsScanned += 1;

      const score = scoreJob(job, agent, profileSkills);
      if (score < agent.criteria.minMatchScore) continue;

      matched += 1;
      agent.stats.jobsMatched += 1;
      await log(agent._id, agent.userId, "job_matched", `Matched "${job.title}" at ${job.company} (${score}% match).`, {
        jobId: job._id,
        metadata: { score },
      });

      // Auto-apply only ever submits for jobs posted directly on this
      // platform. We have no ATS integration for externally-sourced
      // (JSearch) listings, so silently creating an Application for one of
      // those would just be a fake record that no real employer ever sees -
      // exactly the kind of "looks real but isn't" behavior we're not doing.
      // External matches still get logged above so the user sees them; they
      // just don't get auto-submitted.
      if (agent.autoApply && job.source === "platform" && profile?.resumeUrl) {
        const already = await Application.findOne({ userId: agent.userId, jobId: job._id });
        if (!already) {
          await Application.create({
            userId: agent.userId,
            jobId: job._id,
            resumeUrl: profile.resumeUrl,
            coverNote: `Submitted automatically by Wizbot agent "${agent.name}" (${score}% match).`,
          });
          job.applicantsCount += 1;
          await job.save();

          applied += 1;
          agent.stats.jobsApplied += 1;
          await log(agent._id, agent.userId, "job_applied", `Applied to "${job.title}" at ${job.company}.`, {
            jobId: job._id,
            metadata: { score },
          });
        }
      }
    }

    if (agent.seenJobIds.length > MAX_SEEN_JOB_IDS) {
      agent.seenJobIds = agent.seenJobIds.slice(-MAX_SEEN_JOB_IDS);
    }

    agent.lastScanAt = new Date();
    agent.lastScanError = null;
    agent.isScanning = false; // release the claim
    agent.scanClaimedAt = null;
    await agent.save();

    await log(
      agent._id,
      agent.userId,
      "scan_completed",
      `Scan complete: ${candidates.length} scanned, ${matched} matched, ${applied} applied.`
    );

    return { scanned: candidates.length, matched, applied };
  } catch (err) {
    agent.lastScanError = err.message;
    agent.isScanning = false; // release the claim even on failure, or the agent would be stuck "scanning" forever
    agent.scanClaimedAt = null;
    await agent.save();
    await log(agent._id, agent.userId, "error", `Scan failed: ${err.message}`);
    throw err;
  }
}

/** Runs a scan cycle for every currently-running agent. Used by the scheduler. */
export async function runScanForAllRunningAgents() {
  const agents = await WizbotAgent.find({ status: "running" }).select("_id");
  const results = [];
  for (const { _id } of agents) {
    try {
      results.push(await runScanCycle(_id));
    } catch {
      // errors are already logged to the agent's activity log inside runScanCycle
    }
  }
  return results;
}

/** Real funnel + performance metrics derived entirely from stored counters/log. */
export function computeMetrics(agent) {
  const { jobsScanned, jobsMatched, jobsApplied } = agent.stats;
  return {
    funnel: [
      { stage: "Scanned", count: jobsScanned },
      { stage: "Matched", count: jobsMatched },
      { stage: "Applied", count: jobsApplied },
    ],
    matchRate: jobsScanned ? Math.round((jobsMatched / jobsScanned) * 100) : 0,
    applyRate: jobsMatched ? Math.round((jobsApplied / jobsMatched) * 100) : 0,
    lastScanAt: agent.lastScanAt,
  };
}
