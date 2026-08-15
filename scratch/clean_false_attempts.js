const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.testAttempt.deleteMany({
    where: {
      score: 0,
      percentage: 0,
      correctCount: 0,
      incorrectCount: 0,
      submissionReason: null
    }
  });
  console.log('Deleted dummy test attempts:', deleted);
}

main().catch(console.error).finally(() => prisma.$disconnect());
