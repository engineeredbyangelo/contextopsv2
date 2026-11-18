import type { Enums } from "@/server/supabase/database.types";

export type Plan = Enums<"workspace_plan">;

/** Plans from docs/spec.md → "Pricing & plans". Prices are starting hypotheses. */
export const PLANS: Record<
  Plan,
  { name: string; price: string; repos: number | null; orgs: number | null; includes: string[] }
> = {
  free: {
    name: "Free",
    price: "$0",
    repos: 5,
    orgs: 1,
    includes: ["1 policy", "All three targets", "30-day audit log"],
  },
  team: {
    name: "Team",
    price: "$49 / month",
    repos: 50,
    orgs: 3,
    includes: ["Unlimited policies", "Drift alerts", "1-year audit log"],
  },
  agency: {
    name: "Agency",
    price: "$199 / month",
    repos: 250,
    orgs: null,
    includes: [
      "Multiple workspaces",
      "Viewer seats for clients",
      "CSV audit export",
      "Publish approvals",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: "Custom",
    repos: null,
    orgs: null,
    includes: ["SSO/SAML", "Data retention controls", "Priority support"],
  },
};
