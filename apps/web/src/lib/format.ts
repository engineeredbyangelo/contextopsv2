/**
 * Date formatting. Fixed locale and UTC so server and client render identical strings
 * (no hydration mismatches, and no `new Date()` during prerendering).
 */
const date = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const dateTime = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

export const formatDate = (iso: string | null | undefined) =>
  iso ? date.format(new Date(iso)) : "—";
export const formatDateTime = (iso: string | null | undefined) =>
  iso ? `${dateTime.format(new Date(iso))} UTC` : "—";

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
