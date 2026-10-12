import { z } from "zod";

export const createAgentSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  avatar: z.string().trim().optional().default("default"),
  criteria: z
    .object({
      keywords: z.array(z.string().trim()).optional().default([]),
      locations: z.array(z.string().trim()).optional().default([]),
      workMode: z.enum(["remote", "hybrid", "onsite"]).optional().nullable(),
      jobType: z
        .enum(["full-time", "part-time", "contract", "internship", "freelance"])
        .optional()
        .nullable(),
      experienceLevel: z
        .enum(["entry", "mid", "senior", "lead", "executive"])
        .optional()
        .nullable(),
      salaryMin: z.coerce.number().nonnegative().optional().nullable(),
      minMatchScore: z.coerce.number().min(0).max(100).optional().default(50),
    })
    .optional()
    .default({}),
  autoApply: z.boolean().optional().default(false),
});

export const updateAgentSchema = createAgentSchema.partial();

export const updateAgentStatusSchema = z.object({
  status: z.enum(["running", "paused", "terminated"]),
});
