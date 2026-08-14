const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const madhurima = await prisma.student.findFirst({ where: { email: 'ghoshmadhurima2009@gmail.com' } });
  const prarthita = await prisma.student.findFirst({ where: { email: 'prarthitadas75@gmail.com' } });
  const test = await prisma.test.findFirst({ where: { status: 'PUBLISHED' } });

  if (!test) {
    console.log('No published test found');
    return;
  }

  if (madhurima) {
    await prisma.testAttempt.create({
      data: {
        testId: test.id,
        studentId: madhurima.id,
        status: 'SUBMITTED',
        score: 50,
        percentage: 100.0,
        correctCount: 50,
        incorrectCount: 0,
        unansweredCount: 0,
        startedAt: new Date(Date.now() - 3600000),
        submittedAt: new Date(Date.now() - 1800000)
      }
    });
    console.log('Created attempt for Madhurima Ghosh');
  }

  if (prarthita) {
    await prisma.testAttempt.create({
      data: {
        testId: test.id,
        studentId: prarthita.id,
        status: 'SUBMITTED',
        score: 45,
        percentage: 90.0,
        correctCount: 45,
        incorrectCount: 5,
        unansweredCount: 0,
        startedAt: new Date(Date.now() - 3600000),
        submittedAt: new Date(Date.now() - 1700000)
      }
    });
    console.log('Created attempt for Prarthita das');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
