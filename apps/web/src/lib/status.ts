import {
  CircleCheck,
  CircleDashed,
  CircleSlash,
  Clock,
  GitPullRequestArrow,
  Loader,
  ShieldOff,
  TriangleAlert,
  Unplug,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { RepoStatus, RolloutItemStatus, RolloutStatus } from "@/server/data/types";

export type Tone = "success" | "warning" | "info" | "danger" | "muted" | "neutral";

type StatusMeta = { label: string; icon: LucideIcon; tone: Tone; description: string };

/** The five compliance states plus Disconnected (and Unassigned). Icon + label, never color alone. */
export const REPO_STATUS: Record<RepoStatus, StatusMeta> = {
  compliant: {
    label: "Compliant",
    icon: CircleCheck,
    tone: "success",
    description: "Every target file matches the policy",
  },
  drifted: {
    label: "Drifted",
    icon: TriangleAlert,
    tone: "warning",
    description: "A managed block was edited in the repo",
  },
  pending_sync: {
    label: "Pending sync",
    icon: Clock,
    tone: "info",
    description: "Waiting on a sync pull request",
  },
  sync_failed: {
    label: "Sync failed",
    icon: XCircle,
    tone: "danger",
    description: "The last sync could not open a PR",
  },
  exempted: {
    label: "Exempted",
    icon: ShieldOff,
    tone: "muted",
    description: "Excluded from rollouts and KPIs",
  },
  disconnected: {
    label: "Disconnected",
    icon: Unplug,
    tone: "muted",
    description: "ContextOps lost access to this repo",
  },
  unassigned: {
    label: "Unassigned",
    icon: CircleDashed,
    tone: "neutral",
    description: "No policy assigned yet",
  },
};

export const REPO_STATUS_ORDER: RepoStatus[] = [
  "compliant",
  "drifted",
  "pending_sync",
  "sync_failed",
  "exempted",
  "disconnected",
  "unassigned",
];

export const ROLLOUT_STATUS: Record<RolloutStatus, StatusMeta> = {
  queued: { label: "Queued", icon: Clock, tone: "neutral", description: "" },
  running: { label: "Running", icon: Loader, tone: "info", description: "" },
  completed: { label: "Completed", icon: CircleCheck, tone: "success", description: "" },
  completed_with_errors: {
    label: "Completed with errors",
    icon: TriangleAlert,
    tone: "warning",
    description: "",
  },
  failed: { label: "Failed", icon: XCircle, tone: "danger", description: "" },
  cancelled: { label: "Cancelled", icon: CircleSlash, tone: "muted", description: "" },
};

export const ROLLOUT_ITEM_STATUS: Record<RolloutItemStatus, StatusMeta> = {
  queued: { label: "Queued", icon: Clock, tone: "neutral", description: "" },
  running: { label: "Running", icon: Loader, tone: "info", description: "" },
  pr_open: { label: "PR open", icon: GitPullRequestArrow, tone: "info", description: "" },
  up_to_date: { label: "Up to date", icon: CircleCheck, tone: "success", description: "" },
  merged: { label: "Merged", icon: CircleCheck, tone: "success", description: "" },
  closed: { label: "Closed", icon: CircleSlash, tone: "muted", description: "" },
  failed: { label: "Failed", icon: XCircle, tone: "danger", description: "" },
  skipped: { label: "Skipped", icon: CircleSlash, tone: "muted", description: "" },
};

export const TONE_CLASSES: Record<Tone, string> = {
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  info: "border-info/30 bg-info/10 text-info",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  muted: "border-border bg-muted text-muted-foreground",
  neutral: "border-border bg-transparent text-muted-foreground",
};
