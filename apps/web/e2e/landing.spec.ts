import { expect, test, type Page } from "@playwright/test";
import { northwind } from "../src/server/demo/northwind";

/**
 * Landing page (`/`): the hero (diff headline, a sync PR framed by the managed-block markers,
 * filename buttons, repo chips, auto-advancing file tabs with a pause control), the product
 * demo (plays only when asked) and reduced motion. Signed out, like a real visitor.
 * Assertions check states the page settles into, never animation frames.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const BEGIN = /^<!-- contextops:begin policy="core-standards" version="2\.3\.0" -->$/;
const END = "<!-- contextops:end -->";
const HEADLINE = "Stop copy-pasting CLAUDE.md.";
const OUTSIDE_NOTE = "Everything outside these markers stays yours.";

async function openDemo(page: Page) {
  await page.goto("/");
  const demo = page.getByRole("region", { name: "ContextOps product demo" });
  await demo.scrollIntoViewIfNeeded();
  // Clicks before hydration are lost; wait for the client component to take over.
  await expect(demo).toHaveAttribute("data-ready", "true");
  return demo;
}

/** The hero and its PR frame, once the frame has hydrated (clicks before that are lost). */
async function openHero(page: Page) {
  await page.goto("/");
  const hero = page.getByTestId("hero");
  const frame = hero.getByTestId("hero-sync");
  await expect(frame).toHaveAttribute("data-ready", "true");
  return {
    hero,
    frame,
    fileTabs: frame.getByRole("tablist", { name: "Files changed" }),
    filePanel: frame.locator('[role="tabpanel"][aria-labelledby*="file-tab"]'),
    repoTabs: frame.getByRole("tablist", { name: "Repositories in the rollout" }),
    pr: frame.getByRole("article", { name: "Sync pull request" }),
  };
}

test("hero: one diff headline, a PR framed by both markers, and working CTAs", async ({ page }) => {
  await page.goto("/");
  const hero = page.getByTestId("hero");
  await expect(page.locator("h1")).toHaveCount(1);
  const h1 = hero.getByRole("heading", { level: 1 });
  await expect(h1).toHaveText(HEADLINE);
  await expect(h1).toHaveAccessibleName(HEADLINE);
  await expect(page.getByRole("region", { name: HEADLINE })).toBeVisible();

  const begin = hero.getByTestId("hero-marker-begin");
  const end = hero.getByTestId("hero-marker-end");
  await expect(begin).toBeVisible();
  await expect(begin).toHaveText(BEGIN);
  await expect(end).toBeVisible();
  await expect(end).toHaveText(END);
  await expect(hero.getByText(OUTSIDE_NOTE)).toBeVisible();

  await expect(hero.getByRole("link", { name: "Start free with GitHub" })).toHaveAttribute(
    "href",
    "/login",
  );
  await expect(hero.getByRole("link", { name: "Open the demo workspace" })).toHaveAttribute(
    "href",
    "/app",
  );
  await expect(hero.getByRole("list", { name: "Guarantees" })).toContainText("never merges");
});

test("a filename in the subline selects that file's tab", async ({ page }) => {
  const { hero, fileTabs, filePanel } = await openHero(page);
  const agentsButton = hero.getByRole("button", { name: "AGENTS.md", exact: true });
  const claudeButton = hero.getByRole("button", { name: "CLAUDE.md", exact: true });
  const copilotButton = hero.getByRole("button", { name: "Copilot instructions", exact: true });
  const copilotTab = fileTabs.getByRole("tab", { name: /^\.github\/copilot-instructions\.md/ });
  const claudeTab = fileTabs.getByRole("tab", { name: /^CLAUDE\.md/ });

  await copilotButton.click();
  await expect(copilotButton).toHaveAttribute("aria-pressed", "true");
  await expect(agentsButton).toHaveAttribute("aria-pressed", "false");
  await expect(copilotTab).toHaveAttribute("aria-selected", "true");
  await expect(filePanel).toContainText("First sync: the file didn't exist");

  await claudeButton.click();
  await expect(claudeButton).toHaveAttribute("aria-pressed", "true");
  await expect(copilotButton).toHaveAttribute("aria-pressed", "false");
  await expect(claudeTab).toHaveAttribute("aria-selected", "true");
  await expect(filePanel).toContainText("Ask #payments before changing webhook handlers.");
  await expect(filePanel).toContainText("Outside the markers. Unchanged, byte for byte.");

  // The tabs are a real tablist: arrow keys move selection, and the subline follows.
  await claudeTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(copilotTab).toBeFocused();
  await expect(copilotTab).toHaveAttribute("aria-selected", "true");
  await expect(copilotButton).toHaveAttribute("aria-pressed", "true");
});

test("repo chips switch the pull request and use the app's status labels", async ({ page }) => {
  const { repoTabs, pr } = await openHero(page);
  const billing = repoTabs.getByRole("tab", { name: /billing-service/ });
  const design = repoTabs.getByRole("tab", { name: /design-system/ });

  // billing-service #342 is selected on load.
  await expect(billing).toHaveAttribute("aria-selected", "true");
  await expect(billing).toHaveAccessibleName(/Pending sync/);
  await expect(pr.getByTestId("pr-repo")).toHaveText("billing-service");
  await expect(pr.getByTestId("pr-number")).toHaveText("#342");
  await expect(pr.getByTestId("pr-state")).toHaveText("Open");
  await expect(pr).toContainText("contextops[bot] wants to merge into main");

  await expect(design).toHaveAccessibleName(/Compliant/);
  await design.click();
  await expect(design).toHaveAttribute("aria-selected", "true");
  await expect(billing).toHaveAttribute("aria-selected", "false");
  await expect(pr.getByTestId("pr-repo")).toHaveText("design-system");
  await expect(pr.getByTestId("pr-number")).toHaveText("#118");
  await expect(pr.getByTestId("pr-state")).toHaveText("Merged");
  await expect(pr).toContainText("Repo is Compliant.");

  // Arrow keys and End move between chips (roving focus).
  await page.keyboard.press("ArrowRight");
  const api = repoTabs.getByRole("tab", { name: /api-gateway/ });
  await expect(api).toBeFocused();
  await expect(api).toHaveAttribute("aria-selected", "true");
  await expect(pr.getByTestId("pr-number")).toHaveText("#204");
  await page.keyboard.press("End");
  await expect(repoTabs.getByRole("tab", { name: /mobile-app/ })).toBeFocused();
  await expect(pr.getByTestId("pr-number")).toHaveText("#263");
  await expect(pr.getByTestId("pr-state")).toHaveText("Open");
});

test.describe("hero auto-advance", () => {
  test.use({ reducedMotion: "no-preference" });

  test("file tabs advance until paused; the pause control works from the keyboard", async ({
    page,
  }) => {
    const { frame, fileTabs } = await openHero(page);
    // Auto-advance runs only while the frame is on screen (it is below the copy on mobile).
    await frame.scrollIntoViewIfNeeded();
    const selected = fileTabs.locator('[role="tab"][aria-selected="true"]');
    // Untouched, AGENTS.md hands over to CLAUDE.md after one interval (~3.4s).
    await expect(selected).toHaveText(/^CLAUDE\.md/, { timeout: 8_000 });

    // Focusing the control does not count as the stopping interaction; pressing it does.
    const pause = frame.getByRole("button", { name: "Pause file tabs" });
    await pause.focus();
    await page.keyboard.press("Enter");
    const play = frame.getByRole("button", { name: "Play file tabs" });
    await expect(play).toBeFocused();
    const held = (await selected.textContent()) ?? "";
    await page.waitForTimeout(4_500);
    await expect(selected).toHaveText(held);

    await page.keyboard.press("Space");
    await expect(frame.getByRole("button", { name: "Pause file tabs" })).toBeFocused();
    await expect(selected).not.toHaveText(held, { timeout: 8_000 });
  });
});

test("landing sections are labelled by their headings", async ({ page }) => {
  await page.goto("/");
  for (const name of [
    "The sync pull request",
    "How it works",
    "What we store",
    "Your first sync PR in under 10 minutes",
  ]) {
    await expect(page.getByRole("region", { name })).toBeVisible();
  }
  const cta = page.getByRole("region", { name: "Your first sync PR in under 10 minutes" });
  // The page ends where it started: the same primary action and guarantees as the hero.
  await expect(cta.getByRole("link", { name: "Start free with GitHub" })).toHaveAttribute(
    "href",
    "/login",
  );
  await expect(cta.getByRole("list", { name: "Guarantees" })).toContainText("never merges");
});

test("the demo does not autoplay and its tabs switch the screen", async ({ page }) => {
  const demo = await openDemo(page);
  // Starts paused on the rollout's finished state; nothing moves until the visitor asks.
  await expect(demo.getByRole("button", { name: "Play demo" })).toBeVisible();
  await expect(demo.getByRole("tab", { name: /Roll out/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  const panel = demo.getByRole("tabpanel");
  await expect(panel).toContainText("6 of 6 merged");

  await demo.getByRole("tab", { name: /Detect drift/ }).click();
  await expect(demo.getByRole("tab", { name: /Detect drift/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(panel).toContainText("billing-service");
  await expect(panel).toContainText("Drifted");

  await demo.getByRole("tab", { name: /Remediate/ }).click();
  await expect(panel).toContainText("Open remediation PR");
  await expect(panel).toContainText("#347");

  await demo.getByRole("tab", { name: /Roll out/ }).click();
  await expect(panel).toContainText("Core Standards v2.3.0");
  await expect(panel).toContainText("notifications-service");
  // Still paused: picking a step never starts playback.
  await expect(demo.getByRole("button", { name: "Play demo" })).toBeVisible();
});

test("play and pause work from the keyboard", async ({ page }) => {
  const demo = await openDemo(page);
  const play = demo.getByRole("button", { name: "Play demo" });
  await play.focus();
  await page.keyboard.press("Enter");
  const pause = demo.getByRole("button", { name: "Pause demo" });
  await expect(pause).toBeFocused();
  await page.keyboard.press("Space");
  await expect(demo.getByRole("button", { name: "Play demo" })).toBeFocused();
});

/** Which focus indicators an element is drawing: an outline and/or its box-shadow ring. */
async function indicators(page: Page, selector: string) {
  return page.locator(selector).evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      outline: s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0,
      boxShadow: s.boxShadow,
    };
  });
}

test("demo tabs and panel each show exactly one keyboard focus indicator", async ({ page }) => {
  const demo = await openDemo(page);
  const trigger = '[data-slot="tabs-trigger"][aria-selected="true"]';
  const panel = '[data-slot="tabs-content"][data-state="active"]';
  const play = demo.getByRole("button", { name: "Play demo" });

  // Unfocused baselines (the active trigger has a resting shadow of its own).
  await play.focus();
  const triggerAtRest = await indicators(page, trigger);
  const panelAtRest = await indicators(page, panel);

  // Tab order: active tab, Play, panel. Keyboard moves so :focus-visible applies.
  await page.keyboard.press("Shift+Tab");
  await expect(demo.getByRole("tab", { name: /Roll out/ })).toBeFocused();
  await expect
    .poll(async () => (await indicators(page, trigger)).boxShadow)
    .not.toBe(triggerAtRest.boxShadow);
  expect((await indicators(page, trigger)).outline, "trigger: ring only, no outline").toBe(false);

  await page.keyboard.press("Tab");
  await expect(play).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(demo.getByRole("tabpanel")).toBeFocused();
  await expect
    .poll(async () => (await indicators(page, panel)).boxShadow)
    .not.toBe(panelAtRest.boxShadow);
  expect((await indicators(page, panel)).outline, "panel: ring only, no outline").toBe(false);
});

test("mono file text has ligatures off, so markers read as literal <!-- and -->", async ({
  page,
}) => {
  await page.goto("/");
  const hero = page.getByTestId("hero");
  for (const marker of [
    hero.getByTestId("hero-marker-begin"),
    hero.getByTestId("hero-marker-end"),
  ]) {
    await expect(marker).toHaveCSS("font-variant-ligatures", "none");
  }
  // Diff lines in the PR card are mono file text too.
  await expect(hero.locator('[role="tabpanel"][aria-labelledby*="file-tab"]')).toHaveCSS(
    "font-variant-ligatures",
    "none",
  );
});

test("the first-sync file view switches between before and after", async ({ page }) => {
  await page.goto("/");
  // Scoped: the hero's PR diff also shows "## Repository notes".
  const fileView = page.getByTestId("managed-block-demo");
  const version = fileView.getByTestId("managed-block-version");
  await expect(version).toHaveText(/v2\.3\.0/);
  const before = fileView.getByRole("button", { name: "Before", exact: true });
  await before.click();
  await expect(before).toHaveAttribute("aria-pressed", "true");
  await expect(version).toHaveText(/no ContextOps markers/);
  await expect(fileView.getByText("## Repository notes")).toHaveCount(0);
  await fileView.getByRole("button", { name: "After the first sync" }).click();
  await expect(version).toHaveText(/v2\.3\.0/);
  await expect(fileView.getByText("## Repository notes")).toBeVisible();
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("hero content is fully visible with no animation", async ({ page }) => {
    await page.goto("/");
    const hero = page.getByTestId("hero");
    for (const el of [
      hero.getByTestId("hero-marker-begin"),
      hero.getByRole("heading", { level: 1 }),
      hero.getByRole("link", { name: "Start free with GitHub" }),
      hero.getByTestId("hero-marker-end"),
      hero.getByText(OUTSIDE_NOTE),
    ]) {
      await expect(el).toBeVisible();
      await expect(el).toHaveCSS("opacity", "1");
      await expect(el).toHaveCSS("animation-name", "none");
    }
  });

  test("hero file tabs do not auto-advance and there is nothing to pause", async ({ page }) => {
    const { frame, fileTabs } = await openHero(page);
    await frame.scrollIntoViewIfNeeded();
    await expect(frame.getByRole("button", { name: /file tabs/ })).toHaveCount(0);
    const agents = fileTabs.getByRole("tab", { name: /^AGENTS\.md/ });
    await expect(agents).toHaveAttribute("aria-selected", "true");
    // Longer than one auto-advance interval (3.4s): still on AGENTS.md.
    await page.waitForTimeout(4_500);
    await expect(agents).toHaveAttribute("aria-selected", "true");
  });

  test("shows the finished, static state and keeps the tabs usable", async ({ page }) => {
    const demo = await openDemo(page);
    // No autoplay: the demo starts paused on the rollout's final frame.
    await expect(demo.getByRole("button", { name: "Play demo" })).toBeVisible();
    await expect(demo.getByRole("tab", { name: /Roll out/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const panel = demo.getByRole("tabpanel");
    await expect(panel).toContainText("Completed");
    await expect(panel).toContainText("6 of 6 merged");
    await expect(panel.getByText("Pending sync")).toHaveCount(0);

    await demo.getByRole("tab", { name: /Detect drift/ }).click();
    await expect(panel).toContainText("Drifted");
    await demo.getByRole("tab", { name: /Remediate/ }).click();
    await expect(panel).toContainText("Every target file matches the policy");

    // The first-sync file view shows its finished state.
    const fileView = page.getByTestId("managed-block-demo");
    await expect(fileView.getByTestId("managed-block-version")).toHaveText(/v2\.3\.0/);
    await expect(fileView.getByText("## Repository notes")).toBeVisible();
  });
});

/**
 * Regression: the marketing palette must stay on marketing pages. Leaving `/` by a client-side
 * navigation once left the marketing Ink background on /app and /login (the hidden marketing
 * layout kept a `body:has(.marketing)` rule matching). After the navigation, the body must look
 * exactly like a fresh load of the same URL. The landing page now uses the app's own tokens,
 * so the old Ink values below also guard against that palette (or a leak of it) coming back.
 */
const MARKETING_INK = ["rgb(16, 28, 44)", "rgb(243, 245, 247)"];

async function bodyColours(page: Page) {
  return page.evaluate(() => {
    const style = getComputedStyle(document.body);
    return {
      background: style.backgroundColor,
      token: style.getPropertyValue("--background").trim(),
    };
  });
}

async function expectSameAsFreshLoad(page: Page, ready: () => Promise<void>) {
  await ready();
  await expect
    .poll(async () => MARKETING_INK.includes((await bodyColours(page)).background))
    .toBe(false);
  const afterNav = await bodyColours(page);
  await page.reload();
  await ready();
  expect(afterNav).toEqual(await bodyColours(page));
}

for (const theme of ["dark", "light"] as const) {
  test.describe(`leaving the landing page (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => window.localStorage.setItem("theme", t), theme);
    });

    test("Start free to /login drops the marketing palette", async ({ page }) => {
      await page.goto("/");
      await page.getByTestId("hero").getByRole("link", { name: "Start free with GitHub" }).click();
      await expect(page).toHaveURL(/\/login/);
      await expectSameAsFreshLoad(page, () =>
        expect(page.getByRole("heading", { name: "Sign in to ContextOps" })).toBeVisible(),
      );
    });

    test.describe("signed in", () => {
      test.use({ storageState: "e2e/.auth/demo.json" });

      test("Open the demo workspace to /app drops the marketing palette", async ({ page }) => {
        const ws = northwind.workspaces[0]!.slug;
        await page.goto("/");
        await page
          .getByTestId("hero")
          .getByRole("link", { name: "Open the demo workspace" })
          .click();
        await expect(page).toHaveURL(new RegExp(`/app/${ws}$`));
        await expectSameAsFreshLoad(page, () =>
          expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible({
            timeout: 15_000,
          }),
        );
      });
    });
  });
}
