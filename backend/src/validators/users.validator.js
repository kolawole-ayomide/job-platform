import { z } from "zod";

// PATCH /api/v1/users/account - at least one of name/email must be present,
// so a request updating neither isn't silently accepted as a no-op success.
export const updateAccountSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100).optional(),
    email: z.string().trim().toLowerCase().email("Please provide a valid email").optional(),
  })
  .refine((vals) => vals.name !== undefined || vals.email !== undefined, {
    message: "Provide at least a name or an email to update.",
  });