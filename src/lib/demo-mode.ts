/**
 * Client-side demo mode detection.
 *
 * Uses NEXT_PUBLIC_DEMO_MODE which is exposed to the browser by Next.js.
 * When demo mode is enabled, components show hardcoded sample/mock data.
 * When disabled, components start with empty state and fetch from the API.
 */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
