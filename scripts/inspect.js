const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const attempts = await prisma.testAttempt.findMany({
    orderBy: { startedAt: 'desc' },
    include: {
      student: true,
      test: {
        include: {
          questions: true
        }
      },
      answers: {
        include: {
          question: true
        }
      }
    }
  });

  console.log(`Found ${attempts.length} total attempts.`);
  for (const a of attempts) {
    console.log(`\nAttempt ID: ${a.id}`);
    console.log(`Student: ${a.student?.email} (${a.studentId})`);
    console.log(`Test: "${a.test?.title}" (${a.testId})`);
    console.log(`Status: ${a.status}`);
    console.log(`Score: ${a.score}, Percentage: ${a.percentage}%, Correct: ${a.correctCount}, Incorrect: ${a.incorrectCount}`);
    console.log(`Question Shufflings:`, JSON.stringify(a.questionShufflings));
    console.log(`Answers (${a.answers.length}):`);
    for (const ans of a.answers) {
      console.log(`  Ans ID: ${ans.id}`);
      console.log(`  Question ID: ${ans.questionId}`);
      console.log(`  Question Text: "${ans.question?.questionText}"`);
      console.log(`  Question CorrectAns: "${ans.question?.correctAnswer}"`);
      console.log(`  SelectedAnswer (student): "${ans.selectedAnswer}"`);
      console.log(`  isCorrect in DB: ${ans.isCorrect}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
