import { z } from "zod";

export const sendMessageSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty").max(4000),
  conversationId: z.string().optional(),
});

export const botConfigSchema = z.object({
  avatar: z.string().trim().optional(),
  persona: z.string().trim().max(300).optional(),
});
