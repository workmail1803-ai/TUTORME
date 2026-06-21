import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function timeIt(label: string, fn: () => Promise<unknown>) {
  const t = Date.now();
  await fn();
  console.log(`${label}: ${Date.now() - t} ms`);
}

async function main() {
  await timeIt("1st query (connect + TLS + query)", () => prisma.$queryRaw`SELECT 1`);
  await timeIt("warm query (round-trip only)", () => prisma.$queryRaw`SELECT 1`);
  await timeIt("warm query 2", () => prisma.$queryRaw`SELECT 1`);
  await timeIt("student.count()", () => prisma.student.count());
  await timeIt("4 parallel counts", () =>
    Promise.all([
      prisma.student.count(),
      prisma.schedule.count(),
      prisma.payment.count(),
      prisma.homework.count(),
    ]),
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
