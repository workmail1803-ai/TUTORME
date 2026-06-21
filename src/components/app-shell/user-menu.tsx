"use client";

import { UserButton } from "@clerk/nextjs";

// Isolated so it can be lazy-loaded; only pulled into the bundle when Clerk is
// actually in use (i.e. not in local demo mode).
export default function UserMenu() {
  return <UserButton appearance={{ elements: { avatarBox: "size-8" } }} />;
}
