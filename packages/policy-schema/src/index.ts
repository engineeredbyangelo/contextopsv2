import { z } from "zod";

/**
 * Policy content schema — the single source of truth shared by the browser,
 * server actions and job runner. See docs/spec.md → "Policy model".
 * Placeholder shape; fleshed out in phase 1/2.
 */
export const policySchema = z.object({
  overview: z.object({ summary: z.string(), stack: z.array(z.string()) }),
  freeform: z.string().optional(),
});

export type Policy = z.infer<typeof policySchema>;
