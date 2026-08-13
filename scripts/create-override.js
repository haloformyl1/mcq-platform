const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    // pick first student and first test from DB for safety
    const student = await prisma.student.findFirst();
    const test = await prisma.test.findFirst();
    if (!student || !test) {
      console.error('No student or test found in DB');
      process.exit(1);
    }
    const studentId = student.id;
    const testId = test.id;
    const now = new Date();
    const unlock = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2h
    const lock = new Date(now.getTime() + 4 * 60 * 60 * 1000); // +4h

    const upsert = await prisma.studentTestOverride.upsert({
      where: { studentId_testId: { studentId, testId } },
      update: { overrideUnlockAt: unlock, overrideLockAt: lock },
      create: { studentId, testId, overrideUnlockAt: unlock, overrideLockAt: lock }
    });

    console.log('Upserted override:', upsert);
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    try { await prisma.$disconnect(); } catch (e) {}
  }
}

main();
