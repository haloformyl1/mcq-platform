import prisma from "@/lib/prisma";

export async function recalculateAttemptScore(attemptId: string) {
  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: {
        include: {
          questions: true
        }
      },
      answers: true
    }
  });

  if (!attempt || attempt.status !== "SUBMITTED") return false;

  const test = attempt.test;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = test.questions.length;
  let score = 0;
  let scoreOrAnswerChanged = false;

  const answersDict = attempt.answers.reduce((acc, ans) => {
    acc[ans.questionId] = ans;
    return acc;
  }, {} as Record<string, any>);

  for (const question of test.questions) {
    const answer = answersDict[question.id];
    if (answer && answer.selectedAnswer) {
      unansweredCount--;
      
      // Get actual answer accounting for option shuffling if applicable
      let answerToCheck = answer.selectedAnswer;
      if (attempt.questionShufflings) {
        const shufflings = attempt.questionShufflings as Record<string, Record<string, string>>;
        if (shufflings[question.id]) {
          const mapping = shufflings[question.id];
          answerToCheck = mapping[answer.selectedAnswer] || answer.selectedAnswer;
        }
      }
      
      const isCorrect = answerToCheck === question.correctAnswer;
      
      if (answer.isCorrect !== isCorrect) {
        scoreOrAnswerChanged = true;
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

  if (
    attempt.score !== score ||
    attempt.percentage !== percentage ||
    attempt.correctCount !== correctCount ||
    attempt.incorrectCount !== incorrectCount ||
    attempt.unansweredCount !== unansweredCount
  ) {
    scoreOrAnswerChanged = true;
  }

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

  return scoreOrAnswerChanged;
}

export async function recalculateTestAttempts(testId: string) {
  const attempts = await prisma.testAttempt.findMany({
    where: { testId, status: "SUBMITTED" },
    select: { id: true }
  });

  let updatedCount = 0;
  for (const attempt of attempts) {
    const changed = await recalculateAttemptScore(attempt.id);
    if (changed) updatedCount++;
  }

  return {
    totalAttempts: attempts.length,
    updatedAttempts: updatedCount
  };
}

export async function recalculateStudentAttempts(studentId: string) {
  const attempts = await prisma.testAttempt.findMany({
    where: { studentId, status: "SUBMITTED" },
    select: { id: true }
  });

  let updatedCount = 0;
  for (const attempt of attempts) {
    const changed = await recalculateAttemptScore(attempt.id);
    if (changed) updatedCount++;
  }

  return {
    totalAttempts: attempts.length,
    updatedAttempts: updatedCount
  };
}

export async function recalculateAllSubmittedAttempts() {
  const attempts = await prisma.testAttempt.findMany({
    where: { status: "SUBMITTED" },
    select: { id: true }
  });

  let updatedCount = 0;
  for (const attempt of attempts) {
    const changed = await recalculateAttemptScore(attempt.id);
    if (changed) updatedCount++;
  }

  return {
    totalAttempts: attempts.length,
    updatedAttempts: updatedCount
  };
}
