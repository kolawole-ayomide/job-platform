import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema(
  {
    company: { type: String, trim: true },
    title: { type: String, trim: true },
    location: { type: String, trim: true },
    startDate: { type: String, trim: true }, // free-text ("Jan 2022") since resumes are inconsistent
    endDate: { type: String, trim: true },
    isCurrent: { type: Boolean, default: false },
    description: { type: String, trim: true },
  },
  { _id: true }
);

const educationSchema = new mongoose.Schema(
  {
    institution: { type: String, trim: true },
    degree: { type: String, trim: true },
    fieldOfStudy: { type: String, trim: true },
    startDate: { type: String, trim: true },
    endDate: { type: String, trim: true },
  },
  { _id: true }
);

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    headline: { type: String, trim: true, maxlength: 150 },
    summary: { type: String, trim: true, maxlength: 2000 },

    resumeUrl: { type: String, default: null }, // Cloudinary secure_url
    resumePublicId: { type: String, default: null, select: false }, // for Cloudinary deletion/replacement

    skills: [{ type: String, trim: true }],
    experience: [experienceSchema],
    education: [educationSchema],

    jobPreferences: {
      desiredRoles: [{ type: String, trim: true }],
      jobTypes: {
        type: [String],
        enum: ["full-time", "part-time", "contract", "internship", "freelance"],
        default: [],
      },
      experienceLevel: {
        type: String,
        enum: ["entry", "mid", "senior", "lead", "executive", null],
        default: null,
      },
      workMode: {
        type: [String],
        // "any" only makes sense as a candidate's own preference ("I'm
        // flexible") - it's intentionally NOT added to Job.model.js's
        // workMode, since an actual job posting is always genuinely
        // remote/hybrid/onsite, never "any".
        enum: ["remote", "hybrid", "onsite", "any"],
        default: [],
      },
      preferredLocations: [{ type: String, trim: true }],
    },

    availability: {
      status: {
        type: String,
        enum: ["actively-looking", "open-to-offers", "not-looking"],
        default: "actively-looking",
      },
      noticePeriod: { type: String, trim: true }, // e.g. "Immediate", "2 weeks", "1 month"
    },

    salaryExpectation: {
      currency: { type: String, default: "USD" },
      min: { type: Number },
      max: { type: Number },
    },
  },
  { timestamps: true }
);

const Profile = mongoose.model("Profile", profileSchema);

export default Profile;
