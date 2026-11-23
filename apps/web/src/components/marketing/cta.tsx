import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The GitHub mark (lucide no longer ships brand icons). */
export function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={cn("size-4", className)}>
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

/** Landing-page CTA size: taller than the app's buttons, same component. */
export const CTA = "h-11 gap-2 px-5 text-base";

/** The primary action, identical in the hero and the final CTA. */
export function StartFreeButton() {
  return (
    <Button asChild size="lg" className={CTA}>
      <Link href="/login">
        <GitHubMark className="size-[18px]" />
        Start free with GitHub
      </Link>
    </Button>
  );
}

const TRUST = [
  "never pushes to main",
  "never merges",
  "no source code stored",
  "free up to 5 repos",
] as const;

/** The guarantees under each primary CTA. */
export function TrustStrip({ className }: { className?: string }) {
  return (
    <ul
      aria-label="Guarantees"
      className={cn(
        "text-muted-foreground flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[13px]",
        className,
      )}
    >
      {TRUST.map((item) => (
        <li key={item} className="inline-flex items-center gap-1.5">
          <Check aria-hidden strokeWidth={2.4} className="text-success size-3.5 shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
}
