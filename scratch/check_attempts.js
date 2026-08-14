const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const attempts = await prisma.testAttempt.findMany({
    where: { status: 'SUBMITTED' },
    include: {
      student: true,
      test: true
    },
    orderBy: { startedAt: 'desc' }
  });

  console.log('Total SUBMITTED attempts:', attempts.length);
  attempts.forEach(a => {
    console.log({
      id: a.id,
      studentId: a.studentId,
      studentName: a.student?.name,
      studentEmail: a.student?.email,
      testTitle: a.test?.title,
      score: a.score,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt
    });
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
