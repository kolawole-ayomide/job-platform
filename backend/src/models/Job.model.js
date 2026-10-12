import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    companyLogoUrl: { type: String, default: null },
    companyDescription: { type: String, trim: true, default: null },
    companySize: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+", null],
      default: null,
    },
    companyWebsite: { type: String, trim: true, default: null },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    workMode: {
      type: String,
      enum: ["remote", "hybrid", "onsite"],
      default: "onsite",
    },
    jobType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship", "freelance"],
      default: "full-time",
    },
    experienceLevel: {
      type: String,
      enum: ["entry", "mid", "senior", "lead", "executive", null],
      // null = genuinely unknown (e.g. synced from JSearch, which has no
      // experience-level field at all) - never guessed. Platform-posted
      // jobs still land on "entry" if the poster leaves it blank, since
      // that default is applied by createJobSchema (job.validator.js)
      // before Mongoose ever sees the document - this schema-level default
      // only takes effect for inserts that skip that validation, i.e. the
      // JSearch sync path.
      default: null,
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
    },
    requirements: [{ type: String, trim: true }],
    responsibilities: [{ type: String, trim: true }],
    skills: [{ type: String, trim: true }], // used to match against Profile.skills

    salaryRange: {
      currency: { type: String, default: "USD" },
      min: { type: Number },
      max: { type: Number },
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: { type: Boolean, default: true },
    applicationDeadline: { type: Date },

    applicantsCount: { type: Number, default: 0 },

    // Where this listing came from. "platform" = posted directly through
    // this app's own POST /jobs (real submissions go through our own
    // Application flow). "jsearch" = synced in from the JSearch API (real
    // external listing - we have no ATS access, so "applying" to these
    // means sending the user to applyUrl, never creating a fake local
    // Application on their behalf).
    source: {
      type: String,
      enum: ["platform", "jsearch"],
      default: "platform",
    },
    // The external API's own id for this listing - used to upsert instead
    // of duplicating on every sync. Only set for source: "jsearch".
    externalId: { type: String, default: null },
    // The real application URL for external listings (JSearch's
    // job_apply_link) - where "Apply" actually sends the user, since we
    // can't submit to a third-party employer's ATS ourselves.
    applyUrl: { type: String, default: null },
    // The listing's real posted-at date as reported by the source, distinct
    // from `createdAt` (which is just when *we* synced it into our DB).
    externalPostedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Prevents importing the same external listing twice across repeated syncs.
jobSchema.index(
  { source: 1, externalId: 1 },
  { unique: true, partialFilterExpression: { externalId: { $type: "string" } } }
);

// Supports keyword search across title/company/description/skills
jobSchema.index({ title: "text", company: "text", description: "text", skills: "text" });
// Common filter combo: active jobs sorted by recency
jobSchema.index({ isActive: 1, createdAt: -1 });

const Job = mongoose.model("Job", jobSchema);

export default Job;
