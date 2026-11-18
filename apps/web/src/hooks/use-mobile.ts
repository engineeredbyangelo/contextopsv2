import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

/**
 * True below the md breakpoint. Starts false so the first client render matches the
 * server HTML; useSyncExternalStore here caused intermittent hydration mismatches on
 * phones inside streamed Suspense boundaries (sidebar rendered as a Sheet too early).
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}
