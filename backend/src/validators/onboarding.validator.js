import { z } from "zod";

const experienceEntrySchema = z.object({
  company: z.string().trim().optional().default(""),
  title: z.string().trim().optional().default(""),
  location: z.string().trim().optional().default(""),
  startDate: z.string().trim().optional().default(""),
  endDate: z.string().trim().optional().default(""),
  isCurrent: z.boolean().optional().default(false),
  description: z.string().trim().optional().default(""),
});

const educationEntrySchema = z.object({
  institution: z.string().trim().optional().default(""),
  degree: z.string().trim().optional().default(""),
  fieldOfStudy: z.string().trim().optional().default(""),
  startDate: z.string().trim().optional().default(""),
  endDate: z.string().trim().optional().default(""),
});

export const completeOnboardingSchema = z.object({
  resumeUrl: z.string().trim().optional(),
  resumePublicId: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  location: z.string().trim().optional(),
  headline: z.string().trim().max(150).optional(),
  summary: z.string().trim().max(2000).optional(),
  skills: z.array(z.string().trim()).optional().default([]),
  experience: z.array(experienceEntrySchema).optional().default([]),
  education: z.array(educationEntrySchema).optional().default([]),
  jobPreferences: z
    .object({
      desiredRoles: z.array(z.string().trim()).optional().default([]),
      jobTypes: z
        .array(z.enum(["full-time", "part-time", "contract", "internship", "freelance"]))
        .optional()
        .default([]),
      workMode: z.array(z.enum(["remote", "hybrid", "onsite", "any"])).optional().default([]),
      experienceLevel: z
        .enum(["entry", "mid", "senior", "lead", "executive"])
        .optional(),
      preferredLocations: z.array(z.string().trim()).optional().default([]),
    })
    .optional(),
  availability: z
    .object({
      status: z.enum(["actively-looking", "open-to-offers", "not-looking"]).optional(),
      noticePeriod: z.string().trim().optional(),
    })
    .optional(),
  salaryExpectation: z
    .object({
      currency: z.string().trim().optional().default("USD"),
      min: z.number().nonnegative().optional(),
      max: z.number().nonnegative().optional(),
    })
    .optional(),
});
