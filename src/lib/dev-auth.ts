/**
 * Local demo mode. When DEV_AUTH=1 (and not production), the app is browsable as
 * the seeded demo tutor without configuring Clerk — Clerk is not mounted at all.
 * Server-only flag: not exposed as NEXT_PUBLIC, so it reads `false` on the client.
 */
export const DEV_AUTH =
  process.env.DEV_AUTH === "1" && process.env.NODE_ENV !== "production";
