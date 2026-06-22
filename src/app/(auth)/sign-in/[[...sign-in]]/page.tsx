import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { DEV_AUTH } from "@/lib/dev-auth";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  if (DEV_AUTH) redirect("/dashboard");
  return (
    <SignIn
      appearance={{
        elements: {
          rootBox: "mx-auto",
          card: "shadow-xl border",
        },
      }}
      signUpUrl="/sign-up"
      forceRedirectUrl="/onboarding"
    />
  );
}
