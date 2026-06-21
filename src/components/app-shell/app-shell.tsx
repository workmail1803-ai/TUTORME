"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { GraduationCap, Menu, X, Copy, Check } from "lucide-react";
import { toast } from "sonner";

// Lazy-load the Clerk user menu so the Clerk bundle is excluded entirely in
// local demo mode (where it's never rendered).
const UserMenu = dynamic(() => import("./user-menu"), { ssr: false });
import { cn } from "@/lib/utils";
import { APP_NAME, STUDENT_NAV, TUTOR_NAV, type NavItem } from "@/lib/constants";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/portal") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLinks({
  nav,
  pathname,
  onNavigate,
}: {
  nav: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <item.icon className="size-4.5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function InviteCard({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs font-medium text-muted-foreground">Your invite code</p>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <code className="font-mono text-base font-semibold tracking-widest">
          {code}
        </code>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            toast.success("Invite code copied");
            setTimeout(() => setCopied(false), 1500);
          }}
          aria-label="Copy invite code"
        >
          {copied ? (
            <Check className="size-3.5 text-success" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}

export function AppShell({
  variant,
  inviteCode,
  showUserButton = true,
  userName = "Demo",
  children,
}: {
  variant: "tutor" | "student";
  inviteCode?: string;
  /** False in local demo mode (Clerk not mounted) — shows a static avatar. */
  showUserButton?: boolean;
  userName?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const nav = variant === "tutor" ? TUTOR_NAV : STUDENT_NAV;
  const primary = nav.slice(0, 5);

  const Brand = (
    <Link href={nav[0].href} className="flex items-center gap-2 font-semibold">
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <GraduationCap className="size-5" />
      </span>
      {APP_NAME}
    </Link>
  );

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card/40 p-4 md:flex">
        <div className="px-2 py-2">{Brand}</div>
        <div className="mt-6 flex-1 overflow-y-auto scrollbar-thin">
          <NavLinks nav={nav} pathname={pathname} />
        </div>
        {variant === "tutor" && inviteCode && (
          <div className="mt-4">
            <InviteCard code={inviteCode} />
          </div>
        )}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="absolute inset-y-0 left-0 flex w-72 flex-col border-r bg-card p-4"
            >
              <div className="flex items-center justify-between px-2 py-2">
                {Brand}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="size-5" />
                </Button>
              </div>
              <div className="mt-6 flex-1 overflow-y-auto scrollbar-thin">
                <NavLinks
                  nav={nav}
                  pathname={pathname}
                  onNavigate={() => setDrawerOpen(false)}
                />
              </div>
              {variant === "tutor" && inviteCode && (
                <InviteCard code={inviteCode} />
              )}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="md:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          <div className="md:hidden">{Brand}</div>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            {showUserButton ? (
              <UserMenu />
            ) : (
              <Avatar name={userName} className="size-8" />
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 md:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-stretch border-t bg-card/90 backdrop-blur-md md:hidden">
        {primary.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
