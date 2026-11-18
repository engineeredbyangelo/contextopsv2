"use client";

import { useMemo, useState } from "react";
import { Bot, GitBranch, ScrollText } from "lucide-react";
import { EmptyState } from "@/components/app/empty-state";
import { PersonAvatar } from "@/components/app/person-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { actorName, describeEvent } from "@/lib/audit";
import { formatDateTime } from "@/lib/format";
import type { AuditItem } from "@/server/data/types";

const PAGE = 50;
const ALL = "all";

export function AuditLogTable({ events }: { events: AuditItem[] }) {
  const [actor, setActor] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);

  const categories = useMemo(
    () => [...new Set(events.map((e) => e.action.split(".")[0]!))].sort(),
    [events],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter(
      (e) =>
        (actor === ALL || e.actorType === actor) &&
        (category === ALL || e.action.startsWith(`${category}.`)) &&
        (!q || `${actorName(e)} ${describeEvent(e)} ${e.action}`.toLowerCase().includes(q)),
    );
  }, [events, actor, category, query]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Select value={actor} onValueChange={(v) => (setActor(v), setShown(PAGE))}>
          <SelectTrigger size="sm" className="w-36" aria-label="Actor">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All actors</SelectItem>
            <SelectItem value="user">People</SelectItem>
            <SelectItem value="system">ContextOps</SelectItem>
            <SelectItem value="github">GitHub</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={(v) => (setCategory(v), setShown(PAGE))}>
          <SelectTrigger size="sm" className="w-44" aria-label="Event type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All events</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c.replaceAll("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={query}
          onChange={(e) => (setQuery(e.target.value), setShown(PAGE))}
          placeholder="Search events"
          aria-label="Search events"
          className="h-8 w-full sm:ml-auto sm:w-64"
        />
      </div>

      {filtered.length ? (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44">Time</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead className="hidden md:table-cell">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, shown).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground tabular-nums">
                      <time dateTime={e.createdAt}>{formatDateTime(e.createdAt)}</time>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 whitespace-nowrap">
                        {e.actor ? (
                          <PersonAvatar person={e.actor} className="size-5" />
                        ) : (
                          <span className="bg-muted flex size-5 items-center justify-center rounded-full">
                            {e.actorType === "github" ? (
                              <GitBranch className="size-3" />
                            ) : (
                              <Bot className="size-3" />
                            )}
                          </span>
                        )}
                        {actorName(e)}
                      </span>
                    </TableCell>
                    <TableCell className="min-w-64 whitespace-normal">{describeEvent(e)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <code className="text-muted-foreground font-mono text-xs">{e.action}</code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="text-muted-foreground flex items-center justify-between text-sm">
            <span>
              Showing {Math.min(shown, filtered.length)} of {filtered.length}
            </span>
            {shown < filtered.length ? (
              <Button size="sm" variant="outline" onClick={() => setShown(shown + PAGE)}>
                Show more
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <EmptyState
          icon={ScrollText}
          title="No events match"
          description="Try a different actor, event type or search."
        />
      )}
    </div>
  );
}
