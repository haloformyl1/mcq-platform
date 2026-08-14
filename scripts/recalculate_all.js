const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting bulk recalculation of all submitted test attempts...");
  const attempts = await prisma.testAttempt.findMany({
    where: { status: "SUBMITTED" },
    include: {
      test: {
        include: {
          questions: true
        }
      },
      answers: true
    }
  });

  console.log(`Found ${attempts.length} submitted attempts.`);

  for (const attempt of attempts) {
    const test = attempt.test;
    if (!test) continue;

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = test.questions.length;
    let score = 0;

    const answersDict = attempt.answers.reduce((acc, ans) => {
      acc[ans.questionId] = ans;
      return acc;
    }, {});

    for (const question of test.questions) {
      const answer = answersDict[question.id];
      if (answer && answer.selectedAnswer) {
        unansweredCount--;
        
        let answerToCheck = answer.selectedAnswer;
        if (attempt.questionShufflings) {
          const shufflings = attempt.questionShufflings;
          if (shufflings[question.id]) {
            const mapping = shufflings[question.id];
            answerToCheck = mapping[answer.selectedAnswer] || answer.selectedAnswer;
          }
        }
        
        const isCorrect = answerToCheck === question.correctAnswer;
        
        if (answer.isCorrect !== isCorrect) {
          await prisma.answer.update({
            where: { id: answer.id },
            data: { isCorrect }
          });
        }

        if (isCorrect) {
          correctCount++;
          score += test.marksPerQuestion;
        } else {
          incorrectCount++;
          if (test.negativeMarking) {
            score -= test.negativeMarks;
          }
        }
      }
    }

    const percentage = test.questions.length > 0 ? (score / (test.questions.length * test.marksPerQuestion)) * 100 : 0;

    await prisma.testAttempt.update({
      where: { id: attempt.id },
      data: {
        score,
        percentage,
        correctCount,
        incorrectCount,
        unansweredCount,
      }
    });

    console.log(`Recalculated attempt ${attempt.id}: Score=${score}, %=${percentage.toFixed(1)}, Correct=${correctCount}, Incorrect=${incorrectCount}`);
  }

  console.log("Recalculation finished successfully.");
}

main()
  .catch(e => {
    console.error("Recalculation error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
