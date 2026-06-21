import { PrismaClient } from "@prisma/client";
import { addDays, setHours, setMinutes, startOfDay } from "date-fns";

const prisma = new PrismaClient();

function at(daysFromNow: number, hour: number, minute = 0) {
  return setMinutes(setHours(startOfDay(addDays(new Date(), daysFromNow)), hour), minute);
}

async function main() {
  console.log("🌱 Seeding TutorTrack demo data…");

  // Demo tutor (clerkId is a placeholder — replace by signing in with Clerk).
  const user = await prisma.user.upsert({
    where: { email: "demo.tutor@tutortrack.app" },
    update: {},
    create: {
      clerkId: "seed_demo_tutor",
      email: "demo.tutor@tutortrack.app",
      firstName: "Priya",
      lastName: "Sharma",
      role: "TUTOR",
    },
  });

  const tutor = await prisma.tutor.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      headline: "Maths & Physics tutor · 10+ years",
      bio: "Helping students fall in love with problem-solving.",
      subjects: ["Maths", "Physics", "Chemistry"],
      timezone: "Asia/Kolkata",
      hourlyRate: 25,
      inviteCode: "DEMO24",
    },
  });

  // Clean prior demo students for idempotency.
  await prisma.student.deleteMany({ where: { tutorId: tutor.id } });

  const seedStudents = [
    { name: "Aarav Patel", subject: "Maths", gradeClass: "Grade 10", school: "Delhi Public School", monthlyFee: 120, phone: "+91 90000 11111" },
    { name: "Diya Mehta", subject: "Physics", gradeClass: "Grade 12", school: "St. Xavier's", monthlyFee: 150, phone: "+91 90000 22222" },
    { name: "Kabir Singh", subject: "Chemistry", gradeClass: "Grade 11", school: "Modern School", monthlyFee: 130, phone: "+91 90000 33333" },
    { name: "Ananya Rao", subject: "Maths", gradeClass: "Grade 9", school: "Greenfield", monthlyFee: 100, phone: "+91 90000 44444" },
  ];

  const students = [];
  for (const s of seedStudents) {
    students.push(
      await prisma.student.create({
        data: { tutorId: tutor.id, claimCode: undefined, ...s },
      }),
    );
  }

  // Schedules: a few past (with attendance) and upcoming sessions per student.
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const hour = 17 + i; // staggered

    // Past session 2 days ago — mark present.
    const past = await prisma.schedule.create({
      data: {
        tutorId: tutor.id,
        studentId: student.id,
        subject: student.subject ?? "Class",
        location: "Online",
        startTime: at(-2, hour),
        endTime: at(-2, hour + 1),
        status: "COMPLETED",
      },
    });
    await prisma.attendance.create({
      data: { scheduleId: past.id, studentId: student.id, status: i === 3 ? "ABSENT" : "PRESENT" },
    });

    // Upcoming sessions today + later this week.
    for (const day of [0, 2, 4]) {
      await prisma.schedule.create({
        data: {
          tutorId: tutor.id,
          studentId: student.id,
          subject: student.subject ?? "Class",
          location: "Online",
          startTime: at(day, hour),
          endTime: at(day, hour + 1),
          status: "SCHEDULED",
        },
      });
    }

    // Homework.
    await prisma.homework.create({
      data: {
        tutorId: tutor.id,
        studentId: student.id,
        title: `${student.subject} practice set ${i + 1}`,
        description: "Complete the assigned exercises and review mistakes.",
        dueDate: at(3, 23),
        priority: i % 2 === 0 ? "HIGH" : "MEDIUM",
        status: i === 0 ? "COMPLETED" : "PENDING",
      },
    });

    // Note.
    await prisma.note.create({
      data: {
        tutorId: tutor.id,
        studentId: student.id,
        content: i === 1 ? "Excellent grasp of optics this week." : "Needs revision on word problems.",
        visibility: "SHARED",
      },
    });

    // Payment for current month.
    const now = new Date();
    await prisma.payment.create({
      data: {
        tutorId: tutor.id,
        studentId: student.id,
        amount: student.monthlyFee ?? 100,
        periodMonth: now.getMonth() + 1,
        periodYear: now.getFullYear(),
        status: i < 2 ? "PAID" : "DUE",
        paidAt: i < 2 ? now : null,
        method: i < 2 ? "UPI" : null,
      },
    });
  }

  await prisma.announcement.create({
    data: {
      tutorId: tutor.id,
      title: "Holiday notice",
      body: "No classes this Sunday. Regular schedule resumes Monday.",
    },
  });

  console.log(`✅ Seeded tutor "${user.firstName}" with ${students.length} students.`);
  console.log(`   Invite code: ${tutor.inviteCode}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
