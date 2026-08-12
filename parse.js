const fs = require('fs');
const papa = require('papaparse');

const raw = fs.readFileSync('raw_questions.txt', 'utf8');
const lines = raw.split('\n').filter(l => l.trim().length > 0);

const questions = [];

for (const line of lines) {
  // Regex to match question and options
  // The structure is roughly:
  // "1) Question text (A/a) Option 1 (B/b) Option 2 (C/c) Option 3 (D/d) Option 4"
  // Let's use a regex that handles A, B, C, D (case insensitive).
  
  const match = line.match(/^\d+\)\s*(.*?)\s*\([aA]\)\s*(.*?)\s*\([bB]\)\s*(.*?)\s*\([cC]\)\s*(.*?)\s*\([dD]\)\s*(.*)$/);
  
  if (match) {
    questions.push({
      questionText: match[1].trim(),
      optionA: match[2].trim(),
      optionB: match[3].trim(),
      optionC: match[4].trim(),
      optionD: match[5].trim(),
      correctAnswer: 'A', // Default to A since answer key not provided
      difficulty: 'Moderate',
      explanation: '',
      category: 'Chemistry'
    });
  } else {
    // If the standard A,B,C,D doesn't match, maybe we just treat the whole line as question
    // and empty options, but let's try to see if it failed
    console.log("Failed to match:", line.substring(0, 50));
  }
}

const csv = papa.unparse(questions);
fs.writeFileSync('parsed_questions.csv', csv);
console.log(`Generated CSV with ${questions.length} questions.`);
