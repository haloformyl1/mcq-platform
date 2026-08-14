const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.findMany();
  console.log('Total students:', students.length);
  students.forEach(s => console.log(s.id, s.name, s.email));
}

main().catch(console.error).finally(() => prisma.$disconnect());
