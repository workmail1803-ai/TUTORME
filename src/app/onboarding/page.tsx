import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { OnboardingChooser } from "@/components/onboarding/onboarding-chooser";

export const metadata: Metadata = { title: "Get started" };

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.tutor) redirect("/dashboard");
  if (user.student) redirect("/portal");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-grid px-4 py-12">
      <OnboardingChooser />
    </div>
  );
}
