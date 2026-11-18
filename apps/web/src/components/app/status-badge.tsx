import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  REPO_STATUS,
  ROLLOUT_ITEM_STATUS,
  ROLLOUT_STATUS,
  TONE_CLASSES,
  type Tone,
} from "@/lib/status";
import type { RepoStatus, RolloutItemStatus, RolloutStatus } from "@/server/data/types";

function ToneBadge({
  icon: Icon,
  label,
  tone,
  title,
  className,
}: {
  icon: LucideIcon;
  label: string;
  tone: Tone;
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded-md border px-1.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}

export function RepoStatusBadge({ status, className }: { status: RepoStatus; className?: string }) {
  const m = REPO_STATUS[status];
  return <ToneBadge {...m} title={m.description} className={className} />;
}

export function RolloutStatusBadge({ status }: { status: RolloutStatus }) {
  return <ToneBadge {...ROLLOUT_STATUS[status]} />;
}

export function RolloutItemStatusBadge({ status }: { status: RolloutItemStatus }) {
  return <ToneBadge {...ROLLOUT_ITEM_STATUS[status]} />;
}
