import { Bot, GitBranch } from "lucide-react";
import { PersonAvatar } from "@/components/app/person-avatar";
import { actorName, describeEvent } from "@/lib/audit";
import { formatDateTime } from "@/lib/format";
import type { AuditItem } from "@/server/data/types";

export function ActivityList({ events }: { events: AuditItem[] }) {
  return (
    <ol className="divide-y">
      {events.map((e) => (
        <li key={e.id} className="flex items-start gap-3 py-2.5 text-sm">
          {e.actor ? (
            <PersonAvatar person={e.actor} className="mt-0.5 size-5" />
          ) : (
            <span className="bg-muted mt-0.5 flex size-5 items-center justify-center rounded-full">
              {e.actorType === "github" ? (
                <GitBranch className="size-3" />
              ) : (
                <Bot className="size-3" />
              )}
            </span>
          )}
          <p className="min-w-0 flex-1">
            <span className="font-medium">{actorName(e)}</span>{" "}
            <span className="text-muted-foreground">{describeEvent(e)}</span>
          </p>
          <time
            dateTime={e.createdAt}
            className="text-muted-foreground shrink-0 text-xs tabular-nums"
          >
            {formatDateTime(e.createdAt)}
          </time>
        </li>
      ))}
    </ol>
  );
}
