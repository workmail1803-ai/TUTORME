import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      tutor: { include: { _count: { select: { students: true, schedules: true, payments: true } } } },
      student: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\n=== ${users.length} user(s) ===`);
  for (const u of users) {
    const role = u.tutor ? "TUTOR" : u.student ? "STUDENT" : u.role;
    const counts = u.tutor
      ? `students=${u.tutor._count.students} schedules=${u.tutor._count.schedules} payments=${u.tutor._count.payments}`
      : "(no tutor profile)";
    console.log(
      `- ${u.email}  | clerkId=${u.clerkId}  | ${role}  | ${counts}  | created=${u.createdAt.toISOString()}`,
    );
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
