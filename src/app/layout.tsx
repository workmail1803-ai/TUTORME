import type { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import { DEV_AUTH } from "@/lib/dev-auth";
import "./globals.css";

// Lazy so the Clerk bundle is never shipped in local demo mode.
const ClerkWrapper = dynamic(() => import("@/components/clerk-wrapper"));

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Tutor & Student Management`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#15161c" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tree = (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-center" closeButton />
        </ThemeProvider>
      </body>
    </html>
  );

  // In local demo mode, skip Clerk entirely so no placeholder key is ever used.
  return DEV_AUTH ? tree : <ClerkWrapper>{tree}</ClerkWrapper>;
}
