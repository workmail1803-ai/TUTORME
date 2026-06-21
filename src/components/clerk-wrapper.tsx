"use client";

import { ClerkProvider } from "@clerk/nextjs";

// Isolated + lazy-loaded so the Clerk bundle is excluded entirely in local demo
// mode (DEV_AUTH=1), where this component is never rendered.
export default function ClerkWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
