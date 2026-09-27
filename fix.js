const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.student.update({
    where: { email: 'arghyadeeproy25@gmail.com' },
    data: { board: 'WBCHSE', academicLevel: 'SEM-I' }
  });
  console.log('Fixed!');
}
main().finally(() => prisma.$disconnect());
