const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const student = await prisma.student.findUnique({ where: { email: 'arghyadeeproy25@gmail.com' } });
  console.log(student);
  const reqs = await prisma.subscriptionUpgradeRequest.findMany({ where: { studentId: student?.id } });
  console.log(reqs);
}
main().finally(() => prisma.$disconnect());
