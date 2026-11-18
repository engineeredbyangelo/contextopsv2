"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FolderGit2, Globe, Search } from "lucide-react";
import { columnHelper, DataTable, type AppColumnDef } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { PendingButton } from "@/components/app/pending-button";
import { RepoStatusBadge } from "@/components/app/status-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import { REPO_STATUS, REPO_STATUS_ORDER } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { RepoListItem, RepoStatus } from "@/server/data/types";

const h = columnHelper<RepoListItem>();

export function RepositoryTable({
  repos,
  base,
  initialStatus,
}: {
  repos: RepoListItem[];
  base: string;
  initialStatus: RepoStatus | null;
}) {
  const [status, setStatus] = useState<RepoStatus | null>(initialStatus);
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<Record<string, true>>({});

  const counts = useMemo(() => {
    const c = new Map<RepoStatus, number>();
    for (const r of repos) c.set(r.status, (c.get(r.status) ?? 0) + 1);
    return c;
  }, [repos]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return repos.filter(
      (r) =>
        (!status || r.status === status) &&
        (!q || r.fullName.toLowerCase().includes(q) || r.language?.toLowerCase().includes(q)),
    );
  }, [repos, status, query]);

  const columns = useMemo<AppColumnDef<RepoListItem>[]>(
    () => [
      h.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all repositories"
            checked={
              table.getIsAllRowsSelected()
                ? true
                : table.getIsSomeRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(v) => table.toggleAllRowsSelected(!!v)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select ${row.original.fullName}`}
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
          />
        ),
        enableSorting: false,
      }),
      h.accessor("name", {
        header: "Repository",
        sortFn: "alphanumeric",
        cell: ({ row }) => (
          <Link
            href={`${base}/repositories/${row.original.id}`}
            className="inline-flex items-center gap-1.5 font-medium hover:underline"
          >
            {row.original.name}
            {row.original.visibility === "public" ? (
              <Globe className="text-muted-foreground size-3" aria-label="Public repository" />
            ) : null}
          </Link>
        ),
      }),
      h.accessor("status", {
        header: "Status",
        sortFn: (a, b) =>
          REPO_STATUS_ORDER.indexOf(a.original.status) -
          REPO_STATUS_ORDER.indexOf(b.original.status),
        cell: ({ getValue }) => <RepoStatusBadge status={getValue()} />,
      }),
      h.accessor((r) => r.policy?.name ?? "", {
        id: "policy",
        header: "Policy",
        sortFn: "text",
        cell: ({ row }) => {
          const r = row.original;
          if (!r.policy) return <span className="text-muted-foreground">—</span>;
          const behind =
            r.appliedVersion && r.expectedVersion && r.appliedVersion !== r.expectedVersion;
          return (
            <span className="whitespace-nowrap">
              {r.policy.name}{" "}
              <span className="text-muted-foreground tabular-nums">
                {r.appliedVersion ? `v${r.appliedVersion}` : "not synced"}
                {behind ? ` → v${r.expectedVersion}` : ""}
              </span>
            </span>
          );
        },
      }),
      h.accessor((r) => r.targets.length, {
        id: "targets",
        header: "Targets",
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">
            {row.original.targets.length || "—"}
          </span>
        ),
      }),
      h.accessor((r) => r.language ?? "", { id: "language", header: "Language", sortFn: "text" }),
      h.accessor((r) => r.checkedAt ?? "", {
        id: "checked",
        header: "Checked",
        sortFn: "alphanumeric",
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {formatDate(row.original.checkedAt)}
          </span>
        ),
      }),
    ],
    [base],
  );

  const selected = Object.keys(selection).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1">
          <FilterChip
            active={status === null}
            onClick={() => setStatus(null)}
            label="All"
            count={repos.length}
          />
          {REPO_STATUS_ORDER.filter((s) => counts.get(s)).map((s) => (
            <FilterChip
              key={s}
              active={status === s}
              onClick={() => setStatus(s)}
              label={REPO_STATUS[s].label}
              count={counts.get(s)!}
            />
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter repositories"
            aria-label="Filter repositories by name or language"
            className="h-8 pl-8"
          />
        </div>
      </div>

      {selected ? (
        <div className="bg-muted/40 flex items-center gap-3 rounded-lg border px-3 py-2 text-sm">
          <span>{selected} selected</span>
          <PendingButton size="sm" phase={3} feature="Bulk assign">
            Assign policy
          </PendingButton>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setSelection({})}
          >
            Clear
          </button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={visible}
        getRowId={(r) => r.id}
        getRowHref={(r) => `${base}/repositories/${r.id}`}
        groupBy={(r) => r.owner}
        initialSorting={[{ id: "name", desc: false }]}
        rowSelection={selection}
        onRowSelectionChange={setSelection}
        empty={
          <div className="p-4">
            <EmptyState
              icon={FolderGit2}
              title="No repositories match"
              description="Try a different status or clear the filter."
              action={
                <button
                  type="button"
                  className="text-sm underline"
                  onClick={() => (setStatus(null), setQuery(""))}
                >
                  Clear filters
                </button>
              }
            />
          </div>
        }
      />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs transition-colors",
        active
          ? "border-foreground/20 bg-accent text-foreground font-medium"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      <span className="tabular-nums opacity-70">{count}</span>
    </button>
  );
}
