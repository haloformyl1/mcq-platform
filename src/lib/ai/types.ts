/**
 * PIECHEM AI Core Type Definitions
 * Contracts for educational AI tutor, adaptive quizzes, weakness profiling, and study plans.
 */

export type AiMode = 'TUTOR' | 'PRACTICE' | 'EXAM' | 'DOUBT' | 'REVISION' | 'STUDY_PLAN';
export type AcademicLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type Language = 'en' | 'bn';

export type QuestionDifficulty = 'Easy' | 'Moderate' | 'Difficult' | 'HOTS';
export type QuestionType = 'MCQ' | 'True/False' | 'Assertion-Reason' | 'Numerical' | 'Conceptual';

export interface StudentContext {
  studentId?: string;
  name?: string;
  board?: string; // e.g., WBCHSE, CBSE, ISC, ALL
  academicLevel?: string; // e.g., SEM-I, SEM-II, Class 11, Class 12
  subject?: string; // Chemistry (extensible to Physics, Maths, Biology)
  chapter?: string;
  topic?: string;
  activePage?: string;
  isExamActive?: boolean;
}

export interface TopicMastery {
  topic: string;
  chapter: string;
  subject: string;
  masteryScore: number; // 0 to 100
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  questionsAttempted: number;
  correct: number;
  incorrect: number;
  accuracyPercentage: number;
  averageTimeSeconds?: number;
  recommendedAction: string;
}

export interface StudentLearningProfile {
  studentId: string;
  studentName: string;
  board: string;
  academicLevel: string;
  overallAccuracy: number;
  totalQuestionsAttempted: number;
  totalExamsCompleted: number;
  topicMasteries: TopicMastery[];
  weakTopics: TopicMastery[];
  strongTopics: TopicMastery[];
  todayRecommendation: {
    title: string;
    description: string;
    suggestedChapter: string;
    estimatedMinutes: number;
    actionType: 'PRACTICE' | 'REVISE_NOTES' | 'TAKE_QUIZ';
  };
}

export interface GeneratedQuestion {
  questionText: string;
  questionType: QuestionType;
  difficulty: QuestionDifficulty;
  chapter: string;
  topic: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: string; // "A", "B", "C", "D" or "True"/"False"
  explanation: string;
  commonMistake?: string;
  formulaOrRule?: string;
  language?: Language;
}

export interface ProgressiveHint {
  hintLevel: 1 | 2 | 3 | 4;
  title: string;
  content: string;
  isFullSolution: boolean;
}

export interface PerformanceReport {
  attemptId: string;
  testTitle: string;
  score: number;
  percentage: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  overallEvaluation: string;
  strongTopics: string[];
  weakTopics: string[];
  conceptualTrapsIdentified: Array<{
    questionIndex: number;
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    trapReason: string;
    remedy: string;
  }>;
  recommendedRevision: {
    chapters: string[];
    topics: string[];
    priorityLevel: 'URGENT' | 'RECOMMENDED' | 'MAINTENANCE';
    suggestedRecoveryQuizQuestions: number;
  };
  language: Language;
}

export interface StudyPlanDay {
  dayNumber: number;
  focusChapter: string;
  topics: string[];
  tasks: Array<{
    type: 'READ_MATERIAL' | 'SOLVE_MCQS' | 'REVISE_MISTAKES' | 'MOCK_TEST';
    description: string;
    piechemMaterialUrl?: string;
    piechemMaterialTitle?: string;
    estimatedMinutes: number;
  }>;
}

export interface StudyPlan {
  title: string;
  durationDays: number;
  targetExamOrGoal: string;
  studentLevel: AcademicLevel;
  days: StudyPlanDay[];
  proTips: string[];
  language: Language;
}

export interface AiChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  mode?: AiMode;
  context?: StudentContext;
  model?: string;
  sources?: string[];
  timestamp?: string;
}
