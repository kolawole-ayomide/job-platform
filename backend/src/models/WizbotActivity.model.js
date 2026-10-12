import mongoose from "mongoose";

/**
 * One row per real event a Wizbot agent produces during a scan cycle.
 * This is what powers the "Live Activity Log" in the UI - every entry
 * corresponds to an actual thing the scan service did, not mock data.
 */
const wizbotActivitySchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WizbotAgent",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "scan_started",
        "scan_completed",
        "job_matched",
        "job_applied",
        "status_changed",
        "error",
      ],
      required: true,
    },
    message: { type: String, required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

wizbotActivitySchema.index({ agentId: 1, createdAt: -1 });

const WizbotActivity = mongoose.model("WizbotActivity", wizbotActivitySchema);

export default WizbotActivity;
