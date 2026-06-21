"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateTutorProfile } from "@/server/actions/tutor";

export function ProfileForm({
  initial,
}: {
  initial: {
    headline: string;
    bio: string;
    subjects: string;
    timezone: string;
    hourlyRate: string;
  };
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await updateTutorProfile({
        headline: String(fd.get("headline") ?? ""),
        bio: String(fd.get("bio") ?? ""),
        subjects: String(fd.get("subjects") ?? ""),
        timezone: String(fd.get("timezone") ?? ""),
        hourlyRate: String(fd.get("hourlyRate") ?? ""),
      });
      if (res.ok) {
        toast.success("Profile updated");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          name="headline"
          defaultValue={initial.headline}
          placeholder="Maths & Physics tutor · 10+ years"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={initial.bio}
          placeholder="A short introduction students will see."
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="subjects">Subjects</Label>
        <Input
          id="subjects"
          name="subjects"
          defaultValue={initial.subjects}
          placeholder="Maths, Physics, Chemistry"
        />
        <p className="text-xs text-muted-foreground">Comma-separated.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            name="timezone"
            defaultValue={initial.timezone}
            placeholder="Asia/Kolkata"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hourlyRate">Hourly rate</Label>
          <Input
            id="hourlyRate"
            name="hourlyRate"
            type="number"
            min={0}
            defaultValue={initial.hourlyRate}
            placeholder="25"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}
