import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { DEV_AUTH } from "@/lib/dev-auth";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  if (DEV_AUTH) redirect("/dashboard");
  return (
    <SignUp
      appearance={{
        elements: {
          rootBox: "mx-auto",
          card: "shadow-xl border",
        },
      }}
      signInUrl="/sign-in"
      forceRedirectUrl="/dashboard"
    />
  );
}
