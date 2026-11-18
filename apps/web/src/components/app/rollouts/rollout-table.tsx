"use client";

import { useMemo } from "react";
import Link from "next/link";
import { columnHelper, DataTable, type AppColumnDef } from "@/components/app/data-table";
import { PersonLabel } from "@/components/app/person-avatar";
import { RolloutStatusBadge } from "@/components/app/status-badge";
import { RolloutProgress } from "@/components/app/rollouts/rollout-progress";
import { formatDate } from "@/lib/format";
import type { RolloutListItem } from "@/server/data/types";

const h = columnHelper<RolloutListItem>();

export function RolloutTable({ rollouts, base }: { rollouts: RolloutListItem[]; base: string }) {
  const columns = useMemo<AppColumnDef<RolloutListItem>[]>(
    () => [
      h.accessor((r) => r.policy.name, {
        id: "policy",
        header: "Policy",
        sortFn: "text",
        cell: ({ row }) => (
          <Link
            href={`${base}/rollouts/${row.original.id}`}
            className="font-medium whitespace-nowrap hover:underline"
          >
            {row.original.policy.name}{" "}
            <span className="text-muted-foreground font-normal">v{row.original.semver}</span>
          </Link>
        ),
      }),
      h.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => <RolloutStatusBadge status={getValue()} />,
      }),
      h.accessor((r) => r.counts.total, {
        id: "progress",
        header: "Progress",
        cell: ({ row }) => {
          const c = row.original.counts;
          return (
            <div className="w-36 space-y-1">
              <RolloutProgress counts={c} />
              <p className="text-muted-foreground text-xs tabular-nums">
                {c.merged + c.upToDate}/{c.total} done{c.failed ? ` · ${c.failed} failed` : ""}
              </p>
            </div>
          );
        },
      }),
      h.accessor((r) => r.createdBy?.name ?? "", {
        id: "by",
        header: "Started by",
        enableSorting: false,
        cell: ({ row }) => <PersonLabel person={row.original.createdBy} />,
      }),
      h.accessor((r) => r.startedAt ?? "", {
        id: "started",
        header: "Started",
        sortFn: "alphanumeric",
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {formatDate(row.original.startedAt)}
          </span>
        ),
      }),
    ],
    [base],
  );
  return (
    <DataTable
      columns={columns}
      data={rollouts}
      getRowId={(r) => r.id}
      getRowHref={(r) => `${base}/rollouts/${r.id}`}
      initialSorting={[{ id: "started", desc: true }]}
    />
  );
}
