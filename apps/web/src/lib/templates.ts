/** Starter templates offered on New policy and in onboarding. Content lands with the editor (phase 3). */
export const POLICY_TEMPLATES = [
  {
    id: "nextjs-supabase",
    name: "Next.js + Supabase",
    description: "App Router, server actions, RLS-aware data access.",
    stack: ["Next.js", "Supabase", "Tailwind"],
  },
  {
    id: "python-service",
    name: "Python service",
    description: "uv, pytest, ruff and typed public APIs.",
    stack: ["Python", "uv", "pytest"],
  },
  {
    id: "monorepo",
    name: "Monorepo",
    description: "Workspace-aware commands and package boundaries.",
    stack: ["pnpm", "Turborepo"],
  },
] as const;
