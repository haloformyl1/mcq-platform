const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function isRealStudent(student) {
  if (!student || !student.email) return false;
  const emailLower = student.email.toLowerCase();
  if (emailLower.endsWith('@student.local') || emailLower.includes('admin.test')) return false;
  if (student.name && student.name.toLowerCase().includes('admin test')) return false;
  return true;
}

async function main() {
  const recentAttempt = await prisma.testAttempt.findFirst({
    where: {
      status: "SUBMITTED",
      student: {
        NOT: [
          { email: { endsWith: "@student.local" } },
          { email: { contains: "admin.test" } }
        ]
      }
    },
    orderBy: [
      { submittedAt: 'desc' },
      { startedAt: 'desc' }
    ],
    select: { testId: true, test: { select: { title: true } } }
  });

  console.log('Recent Attempt Test:', recentAttempt);

  if (recentAttempt) {
    const testAttempts = await prisma.testAttempt.findMany({
      where: {
        testId: recentAttempt.testId,
        status: "SUBMITTED",
        student: {
          NOT: [
            { email: { endsWith: "@student.local" } },
            { email: { contains: "admin.test" } }
          ]
        }
      },
      include: {
        student: { select: { id: true, name: true, email: true } }
      }
    });

    console.log('Test Attempts Count:', testAttempts.length);
    testAttempts.forEach(t => console.log(t.student.name, t.student.email, t.score));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
