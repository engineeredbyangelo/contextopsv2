import { z } from "zod";
import { TARGET_IDS } from "./targets";

const text = z.string().trim();
const optionalText = text.optional();

export const severitySchema = z.enum(["must", "should"]);

export const codingStandardSchema = z.object({
  rule: text.min(1, "Write the rule"),
  severity: severitySchema,
});

export const commandsSchema = z.object({
  install: optionalText,
  dev: optionalText,
  test: optionalText,
  lint: optionalText,
  typecheck: optionalText,
  build: optionalText,
});

export const targetOverrideSchema = z.object({
  append: optionalText,
});

/**
 * Policy content — structured JSON; markdown is only an output.
 * Validated in the browser, in server actions and in the job runner.
 */
export const policyContentSchema = z.object({
  /** Reserved for layered policies (out of scope for v2). Must be absent for now. */
  extends: z.undefined().optional(),
  overview: z.object({
    summary: text.min(1, "Add a short summary"),
    stack: z.array(text.min(1)).default([]),
  }),
  commands: commandsSchema.default({}),
  codingStandards: z.array(codingStandardSchema).default([]),
  security: z
    .object({
      secrets: optionalText,
      forbiddenPaths: z.array(text.min(1)).default([]),
      dependencies: optionalText,
    })
    .default({ forbiddenPaths: [] }),
  pullRequests: z
    .object({
      branchNaming: optionalText,
      commitStyle: z.enum(["conventional", "freeform"]).default("conventional"),
      checklist: z.array(text.min(1)).default([]),
    })
    .default({ commitStyle: "conventional", checklist: [] }),
  overrides: z
    .object({
      /** `full`: CLAUDE.md is a full copy (default). `import`: a thin file importing @AGENTS.md. */
      claude: targetOverrideSchema.extend({ mode: z.enum(["full", "import"]).default("full") }),
      copilot: targetOverrideSchema,
      agents: targetOverrideSchema,
    })
    .partial()
    .default({}),
  freeform: optionalText,
});

/** Parsed policy content, with defaults applied. */
export type PolicyContent = z.output<typeof policyContentSchema>;
/** Policy content as authored, before defaults. */
export type PolicyContentInput = z.input<typeof policyContentSchema>;

export const targetsSchema = z
  .array(z.enum(TARGET_IDS as [string, ...string[]]))
  .min(1, "Pick at least one target");
