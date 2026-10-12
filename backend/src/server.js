import app from "./app.js";
import env from "./config/env.js";
import connectDB from "./config/db.js";
import { runScanForAllRunningAgents } from "./services/wizbotAgent.service.js";
import { runBroadSyncCycle } from "./services/jobSync.service.js";

const SCAN_INTERVAL_MS = Number(env.wizbotScanIntervalMs) || 2 * 60 * 1000; // 2 minutes
// Deliberately much less frequent than the Wizbot scan loop - each run costs
// a real JSearch API call against a limited free-tier quota. Defaults to
// every 6 hours; override via JOB_SYNC_INTERVAL_MS if you have more quota.
const JOB_SYNC_INTERVAL_MS = Number(env.jobSyncIntervalMs) || 6 * 60 * 60 * 1000;

async function start() {
  try {
    await connectDB();

    const server = app.listen(env.port, () => {
      console.log(`Wizpace API running on port ${env.port} [${env.nodeEnv}]`);
    });

    // Background job: every SCAN_INTERVAL_MS, run one scan cycle for every
    // agent whose status is "running". This is what makes Wizbot agents
    // actually autonomous instead of only scanning when a user clicks a
    // button - real setInterval, real DB writes, same code path as the
    // on-demand POST /wizbot/agents/:id/scan endpoint.
    const scanTimer = setInterval(() => {
      runScanForAllRunningAgents().catch((err) => {
        console.error("Wizbot scheduler error:", err.message);
      });
    }, SCAN_INTERVAL_MS);
    scanTimer.unref?.();

    // Background job: keeps the general "Discover Jobs" search page backed
    // by real, current external listings even for users with no Wizbot
    // agents running. Cycles through a rotation of broad search terms (see
    // jobSync.service.js) one at a time, so it never depends on anyone
    // having created a bot. No-ops safely if JSEARCH_API_KEY isn't set yet.
    const jobSyncTimer = setInterval(() => {
      runBroadSyncCycle().catch((err) => {
        console.error("Job sync scheduler error:", err.message);
      });
    }, JOB_SYNC_INTERVAL_MS);
    jobSyncTimer.unref?.();
    // Run once shortly after boot too, so a fresh install isn't sitting on
    // an empty Job collection for up to 6 hours waiting on the first tick.
    setTimeout(() => {
      runBroadSyncCycle().catch((err) => {
        console.error("Job sync scheduler error:", err.message);
      });
    }, 15_000).unref?.();

    // Catch unhandled promise rejections (e.g. a DB call that throws outside
    // an asyncHandler-wrapped route) so the process shuts down cleanly
    // instead of continuing in a broken state.
    process.on("unhandledRejection", (err) => {
      console.error("Unhandled Rejection:", err);
      server.close(() => process.exit(1));
    });

    process.on("SIGTERM", () => {
      console.log("SIGTERM received, shutting down gracefully.");
      clearInterval(scanTimer);
      clearInterval(jobSyncTimer);
      server.close(() => process.exit(0));
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
