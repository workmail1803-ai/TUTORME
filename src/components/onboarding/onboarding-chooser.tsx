"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GraduationCap, BookUser, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { becomeTutor, joinAsStudent } from "@/server/actions/onboarding";

export function OnboardingChooser() {
  const router = useRouter();
  const [mode, setMode] = React.useState<"choose" | "student">("choose");
  const [pending, start] = React.useTransition();
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});

  function chooseTutor() {
    start(async () => {
      const res = await becomeTutor();
      if (res.ok) {
        toast.success("Welcome aboard!");
        router.push("/dashboard");
      } else toast.error(res.error);
    });
  }

  function join(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErrors({});
    start(async () => {
      const res = await joinAsStudent({
        inviteCode: String(fd.get("inviteCode") ?? ""),
        claimCode: String(fd.get("claimCode") ?? ""),
      });
      if (res.ok) {
        toast.success("You're connected to your tutor!");
        router.push("/portal");
      } else {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast.error(res.error);
      }
    });
  }

  if (mode === "student") {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <button
            onClick={() => setMode("choose")}
            className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back
          </button>
          <h2 className="text-lg font-semibold">Join your tutor</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the invite code your tutor gave you.
          </p>
          <form onSubmit={join} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="inviteCode">Tutor invite code *</Label>
              <Input
                id="inviteCode"
                name="inviteCode"
                placeholder="ABC123"
                className="uppercase tracking-widest"
                autoFocus
                required
              />
              {errors.inviteCode?.[0] && (
                <p className="text-xs text-destructive">{errors.inviteCode[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="claimCode">Claim code (optional)</Label>
              <Input
                id="claimCode"
                name="claimCode"
                placeholder="If your tutor already added you"
                className="uppercase tracking-widest"
              />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Connect
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          How will you be using TutorTrack?
        </p>
      </div>

      <button
        onClick={chooseTutor}
        disabled={pending}
        className="block w-full text-left"
      >
        <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="size-6" />
            </div>
            <div>
              <p className="font-semibold">I&apos;m a tutor</p>
              <p className="text-sm text-muted-foreground">
                Manage students, classes, homework and payments.
              </p>
            </div>
          </CardContent>
        </Card>
      </button>

      <button
        onClick={() => setMode("student")}
        disabled={pending}
        className="block w-full text-left"
      >
        <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground">
              <BookUser className="size-6" />
            </div>
            <div>
              <p className="font-semibold">I&apos;m a student</p>
              <p className="text-sm text-muted-foreground">
                Join your tutor and track your classes & homework.
              </p>
            </div>
          </CardContent>
        </Card>
      </button>
    </div>
  );
}
