import { expect, test } from "@playwright/test";
import { northwind } from "../src/server/demo/northwind";

/** Signed-out behaviour: the proxy guard, demo sign-in, sign-out and invite lookup. */
test.use({ storageState: { cookies: [], origins: [] } });

const ws = northwind.workspaces[0]!.slug;

test("signed-out visitors are sent to /login and come back after signing in", async ({ page }) => {
  await page.goto(`/app/${ws}/policies`);
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.getByRole("button", { name: "Sign in as demo user" }).click();
  await expect(page).toHaveURL(new RegExp(`/app/${ws}/policies$`));
  await expect(page.getByRole("heading", { level: 1, name: "Policies" })).toBeVisible();
});

test("onboarding needs a session too", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/login\?next=%2Fonboarding/);
});

test("?next= cannot redirect off-site", async ({ page }) => {
  await page.goto("/login?next=//evil.example");
  await page.getByRole("button", { name: "Sign in as demo user" }).click();
  await expect(page).toHaveURL(new RegExp(`/app/${ws}$`));
});

test("sign out ends the session", async ({ page, isMobile }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in as demo user" }).click();
  await expect(page).toHaveURL(new RegExp(`/app/${ws}$`));
  if (isMobile) await page.getByRole("button", { name: "Toggle Sidebar" }).click();
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto(`/app/${ws}`);
  await expect(page).toHaveURL(/\/login\?next=/);
});

test("an unknown invite token renders the 404 page", async ({ page }) => {
  await page.goto("/invite/not-a-real-token");
  await expect(page.getByRole("heading", { name: "Nothing here" })).toBeVisible();
});
