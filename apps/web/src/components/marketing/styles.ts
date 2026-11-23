/**
 * One type scale, one container and one card for the landing page. Geist and the app's own
 * tokens throughout (root layout), so the page reads like the product it sells.
 */

export const CONTAINER = "mx-auto w-full max-w-6xl px-4 md:px-6";
export const SECTION = "border-t py-16 lg:py-24";

export const H1 =
  "text-[clamp(2.5rem,6.2vw,4.5rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance";
export const H2 =
  "text-3xl leading-tight font-semibold tracking-[-0.03em] text-balance md:text-4xl";
export const H3 = "text-xl leading-snug font-semibold tracking-[-0.015em]";
export const LEAD = "text-muted-foreground max-w-[60ch] text-lg leading-relaxed text-pretty";
export const BODY = "text-muted-foreground text-base leading-relaxed";

/** Every code or file surface: the hero PR, the first-sync file, the demo's browser frame. */
export const CODE_CARD =
  "bg-card text-card-foreground min-w-0 overflow-hidden rounded-xl border shadow-[0_24px_60px_-30px_rgb(0_0_0/0.3)] dark:shadow-[0_24px_60px_-30px_rgb(0_0_0/0.7)]";

/** A file path or a short snippet inside running text. */
export const INLINE_CODE =
  "bg-muted text-foreground rounded-md px-1.5 py-px font-mono text-[0.85em] [overflow-wrap:anywhere]";

/** Mono line metrics for every diff and file view. */
export const CODE_TEXT = "font-mono text-xs leading-5";

/** Keyboard focus for the landing page's own controls (shadcn components keep their ring). */
export const FOCUS =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring";
/** Same, drawn inside the element, for controls in a scrolling rail (which clips outlines). */
export const FOCUS_INSET =
  "outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring";
