import { z } from "zod";

// Mirrors backend validators/auth.validator.js `signupSchema` exactly, so a
// user never sees "created" locally then gets rejected by the API.
export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().trim().toLowerCase().email("Please provide a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((vals) => vals.password === vals.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Step 1 of sign-in: email only.
export const signinEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please provide a valid email"),
});

// Step 2 of sign-in: password only (email carried over from step 1).
export const signinPasswordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please provide a valid email"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((vals) => vals.password === vals.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
