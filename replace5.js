const fs = require('fs');

const files = [
  'src/app/dashboard/curriculum/[board]/[level]/page.tsx',
  'src/app/dashboard/category/[category]/page.tsx',
  'src/app/dashboard/category/[category]/[board]/[level]/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\{test\.questionPaperUrl && \(/g, '{isLiveStage && test.questionPaperUrl && (');
  fs.writeFileSync(file, content);
}
console.log('Replaced questionPaperUrl conditions successfully');
