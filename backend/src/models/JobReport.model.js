import mongoose from "mongoose";

const jobReportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    reason: {
      type: String,
      enum: ["spam", "scam", "expired", "discriminatory", "misleading", "other"],
      required: true,
    },
    details: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["open", "reviewed", "dismissed"],
      default: "open",
    },
  },
  { timestamps: true }
);

jobReportSchema.index({ jobId: 1, createdAt: -1 });

const JobReport = mongoose.model("JobReport", jobReportSchema);

export default JobReport;
