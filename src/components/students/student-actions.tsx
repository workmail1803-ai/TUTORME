"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Archive, ArchiveRestore, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StudentForm } from "@/components/students/student-form";
import {
  updateStudent,
  setStudentStatus,
  deleteStudent,
} from "@/server/actions/students";

export type StudentActionData = {
  id: string;
  name: string;
  subject: string;
  gradeClass: string;
  school: string;
  phone: string;
  parentPhone: string;
  monthlyFee: string;
  address: string;
  notes: string;
  status: "ACTIVE" | "ARCHIVED";
};

export function StudentActions({ student }: { student: StudentActionData }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const archived = student.status === "ARCHIVED";

  function toggleArchive() {
    startTransition(async () => {
      const res = await setStudentStatus(
        student.id,
        archived ? "ACTIVE" : "ARCHIVED",
      );
      if (res.ok) {
        toast.success(archived ? "Student restored" : "Student archived");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteStudent(student.id);
      if (res.ok) {
        toast.success("Student deleted");
        router.push("/students");
      } else toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" onClick={() => setEditing(true)}>
        <Pencil className="size-4" /> Edit
      </Button>
      <Button variant="outline" onClick={toggleArchive} disabled={pending}>
        {archived ? (
          <ArchiveRestore className="size-4" />
        ) : (
          <Archive className="size-4" />
        )}
        {archived ? "Restore" : "Archive"}
      </Button>
      <Button
        variant="ghost"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setConfirmDelete(true)}
      >
        <Trash2 className="size-4" /> Delete
      </Button>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit student"
      >
        <StudentForm
          initial={student}
          submitLabel="Save changes"
          onSubmit={(input) => updateStudent(student.id, input)}
          onDone={() => setEditing(false)}
        />
      </Modal>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete student?"
        description="This permanently removes the student and all their classes, homework, attendance and payment records. This cannot be undone."
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={pending}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            Delete permanently
          </Button>
        </div>
      </Modal>
    </div>
  );
}
