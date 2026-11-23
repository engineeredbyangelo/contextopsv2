import type { ReactNode } from "react";
import { LogoMark } from "@/components/app/logo";
import { NAV } from "@/lib/nav";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { CODE_CARD } from "./styles";

/** Browser chrome around a mock of the app. The address bar is decorative. */
export function BrowserFrame({
  path,
  children,
  className,
}: {
  path: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(CODE_CARD, className)}>
      <div aria-hidden className="bg-muted/50 flex h-9 items-center gap-3 border-b px-3">
        <span className="flex shrink-0 gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="bg-muted-foreground/30 size-2.5 rounded-full" />
          ))}
        </span>
        <span className="bg-background text-muted-foreground mx-auto min-w-0 truncate rounded-md border px-3 py-0.5 font-mono text-[11px]">
          {path}
        </span>
        <span className="w-[2.625rem] shrink-0" />
      </div>
      {children}
    </div>
  );
}

/** A static copy of the app sidebar (same nav, same order), for the landing-page demo. */
export function MockSidebar({ active }: { active: string }) {
  return (
    <div
      aria-hidden
      className="bg-sidebar text-sidebar-foreground hidden w-44 shrink-0 flex-col gap-3 border-r p-2 md:flex"
    >
      <div className="flex items-center gap-2 rounded-md p-1.5">
        <span className="bg-sidebar-accent flex size-7 shrink-0 items-center justify-center rounded-md">
          <LogoMark className="size-3.5" />
        </span>
        <span className="grid min-w-0 leading-tight">
          <span className="truncate text-xs font-medium">Northwind Labs</span>
          <span className="text-muted-foreground truncate text-[11px]">
            {PLANS.agency.name} plan
          </span>
        </span>
      </div>
      <ul className="space-y-0.5">
        {NAV.map((item) => (
          <li
            key={item.title}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs",
              item.title === active
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/80",
            )}
          >
            <item.icon className="size-3.5" />
            {item.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
