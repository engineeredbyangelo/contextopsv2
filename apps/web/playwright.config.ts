import { defineConfig, devices } from "@playwright/test";

/** Session saved by e2e/auth.setup.ts (signs in as the seeded demo user). */
const demoState = "e2e/.auth/demo.json";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3000", trace: "on-first-retry" },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], storageState: demoState },
      dependencies: ["setup"],
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], storageState: demoState },
      dependencies: ["setup"],
    },
  ],
  // Production build: faster pages and the same rendering path as deploys. Needs the local
  // Supabase stack (`pnpm db:start`) with keys in apps/web/.env.local.
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 300_000,
    env: { DEMO_SIGN_IN: "true" },
  },
});
