import mongoose from "mongoose";

/**
 * A Wizbot "agent" is an automation bot the user configures to continuously
 * scan the live Job collection against their criteria, log every match, and
 * optionally auto-apply on their behalf. Everything here is driven by real
 * scans against real Job/Application documents - counters are incremented
 * by actual scan cycles (see services/wizbotAgent.service.js), never set
 * directly by the client.
 */
const wizbotAgentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    avatar: { type: String, default: "default" },

    status: {
      type: String,
      enum: ["running", "paused", "terminated"],
      default: "running",
    },

    // What the bot scans for
    criteria: {
      keywords: [{ type: String, trim: true }],
      locations: [{ type: String, trim: true }],
      workMode: { type: String, enum: ["remote", "hybrid", "onsite", null], default: null },
      jobType: {
        type: String,
        enum: ["full-time", "part-time", "contract", "internship", "freelance", null],
        default: null,
      },
      experienceLevel: {
        type: String,
        enum: ["entry", "mid", "senior", "lead", "executive", null],
        default: null,
      },
      salaryMin: { type: Number, default: null },
      minMatchScore: { type: Number, default: 50, min: 0, max: 100 },
    },

    autoApply: { type: Boolean, default: false },

    // Real counters, only ever mutated by the scan service
    stats: {
      jobsScanned: { type: Number, default: 0 },
      jobsMatched: { type: Number, default: 0 },
      jobsApplied: { type: Number, default: 0 },
    },

        lastScanAt: { type: Date, default: null },
    lastScanError: { type: String, default: null },

    // Atomic claim flag so a manual "Scan Now" and the background scheduler
    // can never run overlapping scan cycles for the same agent at once (see
    // runScanCycle's findOneAndUpdate claim step in wizbotAgent.service.js).
    // scanClaimedAt lets a stuck claim (e.g. the process crashed mid-scan,
    // before the release step ran) self-heal after STALE_LOCK_MS instead of
    // permanently locking the agent out of future scans.
    isScanning: { type: Boolean, default: false },
    scanClaimedAt: { type: Date, default: null },

    // Jobs already evaluated so a scan cycle never re-scores the same job
    // twice. Capped at MAX_SEEN_JOB_IDS in the scan service so this can't
    // grow the document unboundedly over months/years of scanning.
    seenJobIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
  },
  { timestamps: true }
);

wizbotAgentSchema.index({ userId: 1, createdAt: -1 });
wizbotAgentSchema.index({ status: 1 });

const WizbotAgent = mongoose.model("WizbotAgent", wizbotAgentSchema);

export default WizbotAgent;
