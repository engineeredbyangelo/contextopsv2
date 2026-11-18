"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { slug: "general", label: "General" },
  { slug: "team", label: "Team" },
  { slug: "integrations", label: "Integrations" },
  { slug: "billing", label: "Billing" },
];

export function SettingsNav() {
  const { ws } = useParams<{ ws: string }>();
  const pathname = usePathname();
  return (
    <nav
      aria-label="Settings"
      className="-mx-1 flex shrink-0 gap-1 overflow-x-auto md:mx-0 md:w-44 md:flex-col"
    >
      {ITEMS.map((i) => {
        const href = `/app/${ws}/settings/${i.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={i.slug}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
              active
                ? "bg-accent text-foreground font-medium"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
