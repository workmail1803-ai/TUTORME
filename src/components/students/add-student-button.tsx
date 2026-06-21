"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StudentForm } from "@/components/students/student-form";
import { createStudent } from "@/server/actions/students";

export function AddStudentButton() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="size-4" /> Add student
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add a student"
        description="Create a profile. You can invite them to log in later."
      >
        <StudentForm
          submitLabel="Add student"
          onSubmit={createStudent}
          onDone={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
