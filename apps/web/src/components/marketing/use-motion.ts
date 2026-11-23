"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const MOTION_OK = "(prefers-reduced-motion: no-preference)";

function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia(MOTION_OK);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * True when the visitor allows motion. False on the server and while hydrating (so the first
 * client render matches the server HTML), then the real preference, kept live.
 */
export function useMotionAllowed() {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(MOTION_OK).matches,
    () => false,
  );
}

/**
 * Tracks whether an element is on screen, so the product demo pauses (and spends no CPU)
 * while a visitor-started run is scrolled away. Returns a callback ref and the current state.
 * With `once`, it stays true after the first intersection.
 */
export function useInView<T extends Element>({
  threshold = 0.25,
  once = false,
}: { threshold?: number; once?: boolean } = {}) {
  const [node, setNode] = useState<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setInView(entry.isIntersecting);
        if (once && entry.isIntersecting) observer.disconnect();
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, threshold, once]);

  return [setNode, inView] as const;
}
