import type { AuditItem } from "@/server/data/types";

const s = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v) : "");

/** One readable line per audit event. Unknown actions fall back to the raw action name. */
export function describeEvent(e: AuditItem): string {
  const m = e.metadata;
  switch (e.action) {
    case "workspace.created":
      return `created the workspace ${s(m.name)}`;
    case "workspace.settings_updated":
      return "updated workspace settings";
    case "github.connected":
      return `connected the GitHub org ${s(m.account)}`;
    case "member.invited":
      return `invited ${s(m.email)} as ${s(m.role)}`;
    case "member.joined":
      return `joined as ${s(m.role)}`;
    case "member.role_changed":
      return `changed a member's role to ${s((m.after as Record<string, unknown> | undefined)?.role)}`;
    case "policy.created":
      return `created the policy ${s(m.name)}`;
    case "policy.draft_saved":
      return "saved a policy draft";
    case "policy.published":
      return `published ${s(m.policy)} v${s(m.version)}`;
    case "assignment.created":
      return `assigned ${s(m.policy)} to ${s(m.repository)}`;
    case "rollout.started":
      return `started a rollout of ${s(m.policy)} v${s(m.version)} to ${s(m.repositories)} repos`;
    case "rollout.completed":
      return `rollout of ${s(m.policy)} v${s(m.version)} completed`;
    case "rollout.finished_with_errors":
      return `rollout of ${s(m.policy)} v${s(m.version)} finished with errors`;
    case "rollout.item_failed":
      return `sync failed for ${s(m.repository)}`;
    case "pull_request.opened":
      return `opened PR #${s(m.number)} in ${s(m.repository)}`;
    case "pull_request.merged":
      return `PR #${s(m.number)} merged in ${s(m.repository)}`;
    case "exemption.created":
      return "exempted a repository";
    case "repository.disconnected":
      return `lost access to ${s(m.repository)}`;
    case "repository.drift_detected":
      return `detected drift in ${s(m.repository)}`;
    case "drift_scan.completed":
      return `nightly drift scan checked ${s(m.repositories_checked)} repos`;
    default:
      return e.action;
  }
}

export function actorName(e: AuditItem): string {
  if (e.actor) return e.actor.name;
  return e.actorType === "github" ? "GitHub" : "ContextOps";
}
