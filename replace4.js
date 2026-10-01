const fs = require('fs');

const files = [
  'src/app/api/student/dashboard/route.ts',
  'src/app/api/student/curriculum/[board]/[level]/route.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace('isPremium: true', 'isPremium: true,\n        questionPaperUrl: true');
  fs.writeFileSync(file, content);
}
console.log('API routes updated');
