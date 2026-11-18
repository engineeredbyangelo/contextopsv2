import { describe, expect, it } from "vitest";
import { northwind } from "@/server/demo/northwind";
import { createDataLayer, type Dataset } from "./views";

/** The Northwind dataset as Supabase would return it to the demo owner. */
function dataset(overrides: Partial<Dataset> = {}): Dataset {
  return {
    ...northwind,
    currentUserId: northwind.demoUser.id,
    status: northwind.expectedStatus,
    ...overrides,
  };
}

const layer = (d: Dataset) => createDataLayer(async () => d);
const ws = northwind.workspaces[0]!;

describe("data layer views", () => {
  it("lists every unarchived repo, sorted, with the view's status", async () => {
    const repos = await layer(dataset()).listRepositories(ws.id);
    expect(repos).toHaveLength(northwind.repositories.filter((r) => !r.archived).length);
    expect(repos.map((r) => r.fullName)).toEqual(repos.map((r) => r.fullName).toSorted());
    for (const r of repos) expect(r.status).toBe(northwind.expectedStatus[r.id]);
  });

  it("overview KPIs add up and agree with the repo list", async () => {
    const l = layer(dataset());
    const [overview, repos] = await Promise.all([l.getOverview(ws.id), l.listRepositories(ws.id)]);
    expect(Object.values(overview.counts).reduce((a, b) => a + b, 0)).toBe(overview.total);
    expect(overview.counts.drifted).toBe(repos.filter((r) => r.status === "drifted").length);
    expect(overview.attention.every((r) => ["drifted", "sync_failed"].includes(r.status))).toBe(
      true,
    );
  });

  it("only shows a failure reason on sync_failed repos", async () => {
    const repos = await layer(dataset()).listRepositories(ws.id);
    for (const r of repos) if (r.error) expect(r.status).toBe("sync_failed");
  });

  it("returns null for a workspace the user isn't a member of", async () => {
    const outsider = layer(dataset({ currentUserId: "99999999-0000-4000-8000-000000000000" }));
    expect(await outsider.getWorkspace(ws.slug)).toBeNull();
    expect(await outsider.listMyWorkspaces()).toEqual([]);
  });

  it("scopes detail lookups to the workspace in the URL", async () => {
    const l = layer(dataset());
    const repo = northwind.repositories[0]!;
    expect(await l.getRepository(ws.id, repo.id)).not.toBeNull();
    expect(await l.getRepository("00000000-0000-4000-8000-000000000000", repo.id)).toBeNull();
  });

  it("orders members by role and includes emails", async () => {
    const members = await layer(dataset()).listMembers(ws.id);
    expect(members.map((m) => m.role)).toEqual(["owner", "admin", "editor", "viewer"]);
    expect(members.every((m) => m.email.includes("@"))).toBe(true);
  });

  it("current user is the demo owner", async () => {
    const user = await layer(dataset()).getCurrentUser();
    expect(user.email).toBe(northwind.demoUser.email);
  });
});
