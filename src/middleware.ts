import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that do NOT require authentication.
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

// Local demo mode (DEV_AUTH=1, non-production): skip auth protection entirely so
// the app is browsable as the seeded demo tutor without Clerk.
const DEV_AUTH =
  process.env.DEV_AUTH === "1" && process.env.NODE_ENV !== "production";

export default clerkMiddleware(async (auth, req) => {
  if (DEV_AUTH) return;
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next internals and static files unless found in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
  ],
};
