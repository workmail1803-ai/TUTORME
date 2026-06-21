"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/server/actions/students";
import type { StudentInput } from "@/lib/validations/student";

type Values = {
  name: string;
  subject: string;
  gradeClass: string;
  school: string;
  phone: string;
  parentPhone: string;
  monthlyFee: string;
  address: string;
  notes: string;
};

const empty: Values = {
  name: "",
  subject: "",
  gradeClass: "",
  school: "",
  phone: "",
  parentPhone: "",
  monthlyFee: "",
  address: "",
  notes: "",
};

// Defined at module scope (NOT inside the form) so it isn't recreated on every
// keystroke — recreating it would remount inputs and steal focus.
function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function StudentForm({
  initial,
  submitLabel = "Save student",
  onSubmit,
  onDone,
}: {
  initial?: Partial<Values>;
  submitLabel?: string;
  onSubmit: (input: StudentInput) => Promise<ActionResult<unknown>>;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = React.useState<Values>({ ...empty, ...initial });
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const [pending, startTransition] = React.useTransition();

  function set<K extends keyof Values>(key: K, v: string) {
    setValues((s) => ({ ...s, [key]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const res = await onSubmit({
        name: values.name,
        subject: values.subject,
        gradeClass: values.gradeClass,
        school: values.school,
        phone: values.phone,
        parentPhone: values.parentPhone,
        monthlyFee: values.monthlyFee,
        address: values.address,
        notes: values.notes,
      });

      if (res.ok) {
        toast.success("Student saved");
        router.refresh();
        onDone?.();
      } else {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field id="name" label="Full name *" error={errors.name?.[0]}>
        <Input
          id="name"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Aarav Sharma"
          autoFocus
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field id="subject" label="Subject" error={errors.subject?.[0]}>
          <Input
            id="subject"
            value={values.subject}
            onChange={(e) => set("subject", e.target.value)}
            placeholder="Maths"
          />
        </Field>
        <Field id="gradeClass" label="Class / Grade" error={errors.gradeClass?.[0]}>
          <Input
            id="gradeClass"
            value={values.gradeClass}
            onChange={(e) => set("gradeClass", e.target.value)}
            placeholder="Grade 10"
          />
        </Field>
      </div>

      <Field id="school" label="School" error={errors.school?.[0]}>
        <Input
          id="school"
          value={values.school}
          onChange={(e) => set("school", e.target.value)}
          placeholder="Springfield High"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field id="phone" label="Student phone" error={errors.phone?.[0]}>
          <Input
            id="phone"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+1 555 000 1111"
            inputMode="tel"
          />
        </Field>
        <Field id="parentPhone" label="Parent phone" error={errors.parentPhone?.[0]}>
          <Input
            id="parentPhone"
            value={values.parentPhone}
            onChange={(e) => set("parentPhone", e.target.value)}
            placeholder="+1 555 000 2222"
            inputMode="tel"
          />
        </Field>
      </div>

      <Field id="monthlyFee" label="Monthly fee" error={errors.monthlyFee?.[0]}>
        <Input
          id="monthlyFee"
          value={values.monthlyFee}
          onChange={(e) => set("monthlyFee", e.target.value)}
          placeholder="120"
          inputMode="decimal"
          type="number"
          min={0}
          step="1"
        />
      </Field>

      <Field id="address" label="Address" error={errors.address?.[0]}>
        <Input
          id="address"
          value={values.address}
          onChange={(e) => set("address", e.target.value)}
          placeholder="Street, City"
        />
      </Field>

      <Field id="notes" label="Notes" error={errors.notes?.[0]}>
        <Textarea
          id="notes"
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Anything to remember about this student…"
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        {onDone && (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
