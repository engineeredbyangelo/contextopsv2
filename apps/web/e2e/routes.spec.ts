import { expect, test } from "@playwright/test";
import { northwind } from "../src/server/demo/northwind";

/**
 * Phase 1 "done when": every route renders in both themes on mobile and desktop.
 * Runs under both Playwright projects (desktop, mobile); themes are looped here.
 * Fails on non-2xx responses, console errors (incl. hydration), page errors and
 * horizontal overflow.
 */

const ws = northwind.workspaces[0]!.slug;
const repo = (name: string) => northwind.repositories.find((r) => r.name === name)!.id;
const policy = northwind.policies.find((p) => p.slug === "core-standards")!.id;
const rollout = northwind.rollouts.find((r) => r.status === "running")!.id;

const ROUTES = [
  "/",
  "/pricing",
  "/login",
  "/onboarding",
  "/invite/demo-invite-lena", // raw token for the seeded invite (stored hashed)
  `/app/${ws}`,
  `/app/${ws}/repositories`,
  `/app/${ws}/repositories?status=drifted`,
  `/app/${ws}/repositories/${repo("billing-service")}`,
  `/app/${ws}/repositories/${repo("mobile-app")}`,
  `/app/${ws}/repositories/${repo("infra-terraform")}`,
  `/app/${ws}/repositories/${repo("legacy-admin")}`,
  `/app/${ws}/policies`,
  `/app/${ws}/policies/new`,
  `/app/${ws}/policies/${policy}`,
  `/app/${ws}/rollouts`,
  `/app/${ws}/rollouts/new`,
  `/app/${ws}/rollouts/${rollout}`,
  `/app/${ws}/audit-log`,
  `/app/${ws}/settings/general`,
  `/app/${ws}/settings/team`,
  `/app/${ws}/settings/integrations`,
  `/app/${ws}/settings/billing`,
];

for (const theme of ["dark", "light"] as const) {
  test.describe(`${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => window.localStorage.setItem("theme", t), theme);
    });

    for (const path of ROUTES) {
      test(path, async ({ page }) => {
        const problems: string[] = [];
        page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text()}`));
        page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));

        const res = await page.goto(path);
        expect(res?.status(), "HTTP status").toBeLessThan(400);
        await expect(page.locator("h1").first()).toBeVisible();
        await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${theme}\\b`));

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, "horizontal overflow (px)").toBeLessThanOrEqual(1);
        expect(problems).toEqual([]);
      });
    }
  });
}

test("unknown workspace and repo render the 404 page", async ({ page }) => {
  for (const path of [
    `/app/nope`,
    `/app/${ws}/repositories/00000000-0000-4000-8000-000000000000`,
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "Nothing here" })).toBeVisible();
  }
});

test("/app redirects to the workspace", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(new RegExp(`/app/${ws}$`));
});

test("keyboard: ⌘K opens the palette and g r goes to repositories", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard shortcuts are desktop-only");
  await page.goto(`/app/${ws}`);
  await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible({
    timeout: 15_000,
  });
  // The palette streams in with the sidebar; retry until it has hydrated.
  const input = page.getByPlaceholder("Search repositories, policies, actions…");
  await expect(async () => {
    await page.keyboard.press("ControlOrMeta+k");
    await expect(input).toBeVisible({ timeout: 500 });
  }).toPass();
  await page.keyboard.press("Escape");
  await expect(input).toBeHidden();
  await page.keyboard.press("g");
  await page.keyboard.press("r");
  await expect(page).toHaveURL(new RegExp(`/app/${ws}/repositories$`));
  // Rows stream in after the client navigation; j/k bind once the table mounts.
  const firstRow = page.locator("tr[data-href]").first();
  await expect(firstRow).toBeVisible({ timeout: 15_000 });
  await expect(async () => {
    await page.keyboard.press("j");
    await expect(firstRow).toBeFocused({ timeout: 500 });
  }).toPass();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/app/${ws}/repositories/[0-9a-f-]+$`));
});
