import { z } from "zod";

/**
 * Form schemas shared by client forms now and server actions later. Slug rules match the
 * CHECK constraints in supabase/migrations.
 */
const slug = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "Required")
    .max(max, `At most ${max} characters`)
    .regex(
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
      "Lowercase letters, numbers and dashes; no dash at either end",
    );

export const roleSchema = z.enum(["viewer", "editor", "admin", "owner"]);

export const newPolicySchema = z.object({
  name: z.string().trim().min(1, "Name the policy").max(80),
  slug: slug(64),
  description: z.string().trim().max(280).optional(),
  source: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("import"), repoId: z.string().min(1), path: z.string().min(1) }),
    z.object({ kind: z.literal("template"), template: z.string().min(1) }),
    z.object({ kind: z.literal("blank") }),
  ]),
});
export type NewPolicyInput = z.input<typeof newPolicySchema>;

export const workspaceSettingsSchema = z.object({
  name: z.string().trim().min(1, "Name the workspace").max(80),
  slug: slug(48),
  audience: z.enum(["company", "clients"]),
  requirePublishApproval: z.boolean(),
  rolloutsByEditors: z.enum(["never", "with_approval", "always"]),
});
export type WorkspaceSettingsInput = z.input<typeof workspaceSettingsSchema>;

export const inviteSchema = z.object({
  email: z.email("Enter an email address"),
  role: roleSchema.exclude(["owner"]),
});
export type InviteInput = z.input<typeof inviteSchema>;

export function slugify(value: string, max = 48): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/, "");
}
