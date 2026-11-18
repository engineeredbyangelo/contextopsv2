import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-5", className)} fill="none">
      <rect x="2" y="2" width="20" height="20" rx="6" className="fill-foreground" />
      <path
        d="M8 8h8M8 12h5M8 16h8"
        className="stroke-background"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-semibold tracking-tight">
      <LogoMark />
      ContextOps
    </Link>
  );
}
