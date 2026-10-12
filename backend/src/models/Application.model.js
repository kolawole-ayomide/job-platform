import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    resumeUrl: { type: String, required: true }, // snapshot of the resume used for this application
    coverNote: { type: String, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["applied", "in-review", "interview", "offer", "rejected", "withdrawn"],
      default: "applied",
    },
    // Real event log of every status this application has actually been
    // in, and exactly when. Without this, the dashboard's day-by-day trend
    // (users.controller.js getDashboardSummary) could only approximate
    // "when did this become an interview/offer/rejection" from the
    // application's creation date - now it reads the real transition date.
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["applied", "in-review", "interview", "offer", "rejected", "withdrawn"],
        },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Prevent the same user applying to the same job twice
applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

// Records every status transition as it happens - the very first save
// (isNew) seeds history with the initial status, and every subsequent
// status change appends rather than overwrites, so nothing is ever lost.
applicationSchema.pre("save", async function trackStatusHistory() {
  if (this.isNew) {
    this.statusHistory = [{ status: this.status, changedAt: new Date() }];
  } else if (this.isModified("status")) {
    this.statusHistory.push({ status: this.status, changedAt: new Date() });
  }
});

const Application = mongoose.model("Application", applicationSchema);

export default Application;