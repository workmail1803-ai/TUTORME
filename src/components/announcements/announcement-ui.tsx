"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Megaphone, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createAnnouncement,
  deleteAnnouncement,
} from "@/server/actions/announcements";

export function AnnouncementButton() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, start] = React.useTransition();
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErrors({});
    start(async () => {
      const res = await createAnnouncement({
        title: String(fd.get("title") ?? ""),
        body: String(fd.get("body") ?? ""),
      });
      if (res.ok) {
        toast.success("Announcement posted");
        setOpen(false);
        router.refresh();
      } else {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast.error(res.error);
      }
    });
  }

  const err = (k: string) =>
    errors[k]?.[0] ? (
      <p className="text-xs text-destructive">{errors[k][0]}</p>
    ) : null;

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Megaphone className="size-4" /> New announcement
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Post an announcement"
        description="All your students with an account will be notified."
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" name="title" placeholder="Holiday next week" required />
            {err("title")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">Message *</Label>
            <Textarea
              id="body"
              name="body"
              placeholder="Write your message…"
              className="min-h-28"
              required
            />
            {err("body")}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Post
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function DeleteAnnouncementButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7 text-destructive hover:bg-destructive/10"
      disabled={pending}
      aria-label="Delete announcement"
      onClick={() =>
        start(async () => {
          const res = await deleteAnnouncement(id);
          if (res.ok) {
            toast.success("Deleted");
            router.refresh();
          } else toast.error(res.error);
        })
      }
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}
