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

  const Field = ({
    name,
    label,
    children,
  }: {
    name: keyof Values;
    label: string;
    children: React.ReactNode;
  }) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {errors[name]?.[0] && (
        <p className="text-xs text-destructive">{errors[name][0]}</p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field name="name" label="Full name *">
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
        <Field name="subject" label="Subject">
          <Input
            id="subject"
            value={values.subject}
            onChange={(e) => set("subject", e.target.value)}
            placeholder="Maths"
          />
        </Field>
        <Field name="gradeClass" label="Class / Grade">
          <Input
            id="gradeClass"
            value={values.gradeClass}
            onChange={(e) => set("gradeClass", e.target.value)}
            placeholder="Grade 10"
          />
        </Field>
      </div>

      <Field name="school" label="School">
        <Input
          id="school"
          value={values.school}
          onChange={(e) => set("school", e.target.value)}
          placeholder="Springfield High"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field name="phone" label="Student phone">
          <Input
            id="phone"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+1 555 000 1111"
            inputMode="tel"
          />
        </Field>
        <Field name="parentPhone" label="Parent phone">
          <Input
            id="parentPhone"
            value={values.parentPhone}
            onChange={(e) => set("parentPhone", e.target.value)}
            placeholder="+1 555 000 2222"
            inputMode="tel"
          />
        </Field>
      </div>

      <Field name="monthlyFee" label="Monthly fee">
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

      <Field name="address" label="Address">
        <Input
          id="address"
          value={values.address}
          onChange={(e) => set("address", e.target.value)}
          placeholder="Street, City"
        />
      </Field>

      <Field name="notes" label="Notes">
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
