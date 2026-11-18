import { expect, test as setup } from "@playwright/test";
import { northwind } from "../src/server/demo/northwind";

export const DEMO_STATE = "e2e/.auth/demo.json";

/** Signs in once through the real demo button; the route tests reuse the session. */
setup("sign in as the demo user", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in as demo user" }).click();
  await expect(page).toHaveURL(new RegExp(`/app/${northwind.workspaces[0]!.slug}$`));
  await page.context().storageState({ path: DEMO_STATE });
});
