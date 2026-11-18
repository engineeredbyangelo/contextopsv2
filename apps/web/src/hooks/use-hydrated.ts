import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False while this component hydrates (matching the server HTML), true after. Unlike a
 * mount flag held in a provider, it is per component, so it is also false when a
 * Suspense boundary streams in and hydrates after the rest of the page.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
