import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().trim().min(2, "Title is required"),
  company: z.string().trim().min(1, "Company is required"),
  companyLogoUrl: z.string().trim().url().optional().nullable(),
  companyDescription: z.string().trim().max(2000).optional().nullable(),
  companySize: z
    .enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"])
    .optional()
    .nullable(),
  companyWebsite: z.string().trim().url().optional().nullable(),
  location: z.string().trim().min(1, "Location is required"),
  workMode: z.enum(["remote", "hybrid", "onsite"]).optional().default("onsite"),
  jobType: z
    .enum(["full-time", "part-time", "contract", "internship", "freelance"])
    .optional()
    .default("full-time"),
  experienceLevel: z
    .enum(["entry", "mid", "senior", "lead", "executive"])
    .optional()
    .default("entry"),
  description: z.string().trim().min(20, "Description must be at least 20 characters"),
  requirements: z.array(z.string().trim()).optional().default([]),
  responsibilities: z.array(z.string().trim()).optional().default([]),
  skills: z.array(z.string().trim()).optional().default([]),
  salaryRange: z
    .object({
      currency: z.string().trim().optional().default("USD"),
      min: z.number().nonnegative().optional(),
      max: z.number().nonnegative().optional(),
    })
    .optional(),
  applicationDeadline: z.coerce.date().optional(),
});

export const updateJobSchema = createJobSchema.partial();

export const jobQuerySchema = z.object({
  keyword: z.string().trim().optional(),
  location: z.string().trim().optional(),
  workMode: z.enum(["remote", "hybrid", "onsite"]).optional(),
  jobType: z.enum(["full-time", "part-time", "contract", "internship", "freelance"]).optional(),
  experienceLevel: z.enum(["entry", "mid", "senior", "lead", "executive"]).optional(),
  salaryMin: z.coerce.number().nonnegative().optional(),
  salaryMax: z.coerce.number().nonnegative().optional(),
  companySize: z
    .enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"])
    .optional(),
  sortBy: z.enum(["recent", "salary-high", "salary-low", "relevance"]).optional().default("recent"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
});

export const applyToJobSchema = z.object({
  coverNote: z.string().trim().max(2000).optional(),
});

export const reportJobSchema = z.object({
  reason: z.enum(["spam", "scam", "expired", "discriminatory", "misleading", "other"]),
  details: z.string().trim().max(1000).optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(["applied", "in-review", "interview", "offer", "rejected", "withdrawn"]),
});
