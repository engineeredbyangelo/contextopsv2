"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createColumnHelper,
  createSortedRowModel,
  flexRender,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** Features every app table registers: client-side sorting and row selection. */
export const features = tableFeatures({
  rowSortingFeature,
  rowSelectionFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text, datetime: sortFn_datetime },
});
export type Features = typeof features;
export const columnHelper = <T extends RowData>() => createColumnHelper<Features, T>();
export type AppColumnDef<T extends RowData> = ColumnDef<Features, T, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/**
 * Dense, sortable table. With `getRowHref`, rows are links and j/k move focus through
 * them (Enter opens). Selection is opt-in via a checkbox column built by the caller.
 */
const EMPTY_SELECTION: RowSelectionState = {};

export function DataTable<T extends RowData>({
  columns,
  data,
  getRowId,
  getRowHref,
  groupBy,
  initialSorting = [],
  rowSelection,
  onRowSelectionChange,
  empty,
  className,
}: {
  columns: AppColumnDef<T>[];
  data: T[];
  getRowId: (row: T) => string;
  getRowHref?: (row: T) => string;
  /** Renders a header row per group, keeping the active sort within each group. */
  groupBy?: (row: T) => string;
  initialSorting?: SortingState;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (next: RowSelectionState) => void;
  empty?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const bodyRef = useRef<HTMLTableSectionElement>(null);

  const table = useTable({
    features,
    data,
    columns,
    getRowId,
    state: { sorting, rowSelection: rowSelection ?? EMPTY_SELECTION },
    onSortingChange: setSorting,
    enableRowSelection: !!onRowSelectionChange,
    onRowSelectionChange: (updater) => {
      if (!onRowSelectionChange) return;
      onRowSelectionChange(
        typeof updater === "function" ? updater(rowSelection ?? EMPTY_SELECTION) : updater,
      );
    },
  });

  const focusRow = useCallback((delta: number) => {
    const rows = [...(bodyRef.current?.querySelectorAll<HTMLElement>("tr[data-href]") ?? [])];
    if (!rows.length) return;
    const current = rows.indexOf(document.activeElement as HTMLElement);
    const next =
      current === -1
        ? delta > 0
          ? 0
          : rows.length - 1
        : Math.min(rows.length - 1, Math.max(0, current + delta));
    rows[next]?.focus();
    rows[next]?.scrollIntoView({ block: "nearest" });
  }, []);

  useEffect(() => {
    if (!getRowHref) return;
    const onKey = (e: KeyboardEvent) => {
      if (
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        isTyping(e.target) ||
        document.querySelector("[role=dialog][data-state=open]")
      )
        return;
      if (e.key === "j") focusRow(1);
      if (e.key === "k") focusRow(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusRow, getRowHref]);

  const sortedRows = table.getRowModel().rows;
  const rows = groupBy
    ? [...Map.groupBy(sortedRows, (r) => groupBy(r.original)).entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .flatMap(([, group]) => group)
    : sortedRows;

  return (
    <div className={cn("overflow-x-auto rounded-lg border", className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="hover:bg-transparent">
              {hg.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    className="h-9 text-xs"
                    aria-sort={
                      sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined
                    }
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="hover:text-foreground inline-flex items-center gap-1"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted === "asc" ? (
                          <ArrowUp className="size-3" />
                        ) : sorted === "desc" ? (
                          <ArrowDown className="size-3" />
                        ) : null}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody ref={bodyRef}>
          {rows.length ? (
            rows.map((row, i) => {
              const href = getRowHref?.(row.original);
              const group = groupBy?.(row.original);
              const startsGroup =
                group !== undefined && (i === 0 || groupBy!(rows[i - 1]!.original) !== group);
              return (
                <Fragment key={row.id}>
                  {startsGroup ? (
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableCell
                        colSpan={columns.length}
                        className="text-muted-foreground py-1.5 text-xs font-medium"
                      >
                        {group}
                      </TableCell>
                    </TableRow>
                  ) : null}
                  <TableRow
                    data-href={href}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    tabIndex={href ? 0 : undefined}
                    onClick={(e) => {
                      if (!href || (e.target as HTMLElement).closest("a,button,[role=checkbox]"))
                        return;
                      router.push(href);
                    }}
                    onKeyDown={(e) => {
                      if (href && e.key === "Enter" && e.target === e.currentTarget)
                        router.push(href);
                    }}
                    className={cn(
                      href && "focus-visible:bg-muted/60 cursor-pointer focus-visible:outline-none",
                    )}
                  >
                    {row.getAllCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                </Fragment>
              );
            })
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-0">
                {empty ?? (
                  <p className="text-muted-foreground p-6 text-center text-sm">No results.</p>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
