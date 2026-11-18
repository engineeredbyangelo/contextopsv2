import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/server/supabase/server";
import type { InviteDetail } from "./types";
import type { Dataset } from "./views";

type Result<T> = { data: T | null; error: { message: string } | null };

async function rows<T>(query: PromiseLike<Result<T[]>>, what: string): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw new Error(`Loading ${what} failed: ${error.message}`);
  return data ?? [];
}

/**
 * Everything the signed-in user can see, read with their session so RLS scopes every row
 * to their workspaces. Loaded once per request (React `cache`) and shared by every
 * data-layer call in that render.
 *
 * Phase 1 tenants are small (Northwind: 24 repos, 200 audit events). When lists grow,
 * move the heavy ones (audit log, rollout items) to targeted, paginated queries.
 * Note the API's max_rows (supabase/config.toml) caps every query at 1000 rows.
 */
export const loadDataset = cache(async (): Promise<Dataset> => {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const [
    profiles,
    workspaces,
    workspaceMembers,
    invitations,
    githubInstallations,
    repositories,
    policies,
    policyVersions,
    policyAssignments,
    repoExemptions,
    repoFileStates,
    rollouts,
    rolloutItems,
    syncPullRequests,
    auditEvents,
    statuses,
  ] = await Promise.all([
    rows(sb.from("profiles").select("*").order("user_id"), "profiles"),
    rows(sb.from("workspaces").select("*").order("id"), "workspaces"),
    rows(sb.from("workspace_members").select("*").order("id"), "members"),
    rows(sb.from("invitations").select("*").order("id"), "invitations"),
    rows(sb.from("github_installations").select("*").order("id"), "installations"),
    rows(sb.from("repositories").select("*").order("id"), "repositories"),
    rows(sb.from("policies").select("*").order("id"), "policies"),
    rows(sb.from("policy_versions").select("*").order("id"), "policy versions"),
    rows(sb.from("policy_assignments").select("*").order("id"), "assignments"),
    rows(sb.from("repo_exemptions").select("*").order("id"), "exemptions"),
    rows(sb.from("repo_file_states").select("*").order("id"), "file states"),
    rows(sb.from("rollouts").select("*").order("id"), "rollouts"),
    rows(sb.from("rollout_items").select("*").order("id"), "rollout items"),
    rows(sb.from("sync_pull_requests").select("*").order("id"), "pull requests"),
    rows(sb.from("audit_events").select("*").order("id"), "audit events"),
    rows(sb.from("repository_status").select("repository_id, status"), "repository status"),
  ]);

  const emails = await Promise.all(
    workspaces.map((w) => rows(sb.rpc("workspace_member_emails", { ws: w.id }), "member emails")),
  );
  const users = new Map<string, string>();
  for (const e of emails.flat()) users.set(e.user_id, e.email);
  users.set(user.id, user.email ?? users.get(user.id) ?? "");

  return {
    currentUserId: user.id,
    users: [...users].map(([id, email]) => ({ id, email })),
    profiles,
    workspaces,
    workspaceMembers,
    invitations,
    githubInstallations,
    repositories,
    policies,
    policyVersions,
    policyAssignments,
    repoExemptions,
    repoFileStates,
    rollouts,
    rolloutItems,
    syncPullRequests,
    auditEvents,
    status: Object.fromEntries(
      statuses.flatMap((s) => (s.repository_id && s.status ? [[s.repository_id, s.status]] : [])),
    ),
  };
});

/** Invite preview by raw token. Works signed out: the invitee isn't a member yet. */
export async function getInvite(token: string): Promise<InviteDetail | null> {
  if (!token) return null;
  const sb = await createClient();
  const [invite] = await rows(sb.rpc("invitation_preview", { p_token: token }), "invitation");
  if (!invite) return null;
  return {
    workspaceName: invite.workspace_name,
    role: invite.role,
    email: invite.email,
    expiresAt: invite.expires_at,
    invitedBy: invite.invited_by_id
      ? {
          id: invite.invited_by_id,
          name: invite.invited_by_name ?? invite.invited_by_login ?? "Unknown",
          login: invite.invited_by_login,
          avatarUrl: invite.invited_by_avatar_url,
        }
      : null,
  };
}
