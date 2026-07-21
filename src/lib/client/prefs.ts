/**
 * Client-side external stores for useSyncExternalStore: media queries and
 * URL params (static per page load). Shared by the live presentation routes.
 */

export function subscribeReducedMotion(onChange: () => void): () => void {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function readReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const serverFalse = (): boolean => false;

export const serverNull = (): null => null;

export const staticSubscribe = (): (() => void) => () => {};

/** Module-scope factory: create one reader per param name, reuse per render. */
export function makeParamReader(name: string): () => string | null {
  return () => new URLSearchParams(window.location.search).get(name);
}
