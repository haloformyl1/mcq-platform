const fs = require('fs');

const files = [
  'src/app/dashboard/category/[category]/page.tsx',
  'src/app/dashboard/category/[category]/[board]/[level]/page.tsx'
];

const target2 = `              return (
                <Link 
                  href={\`/exam/result/\${submittedAttempt.id}\`}
                  className="w-full block text-center py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white border border-white/10 transition"
                >
                  View Scorecard {maxAttempts > 1 ? \`(\${attemptsUsed}/\${maxAttempts} Attempts Used)\` : "(Completed)"}
                </Link>
              );`;

const replace2 = `              return (
                <div className="flex flex-col gap-2 w-full">
                  <Link 
                    href={\`/exam/result/\${submittedAttempt.id}\`}
                    className="w-full block text-center py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white border border-white/10 transition"
                  >
                    View Scorecard {maxAttempts > 1 ? \`(\${attemptsUsed}/\${maxAttempts} Attempts Used)\` : "(Completed)"}
                  </Link>
                  {test.questionPaperUrl && (
                    <a 
                      href={test.questionPaperUrl}
                      download 
                      target="_blank" 
                      rel="noreferrer" 
                      className="w-full text-center py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold text-emerald-300 bg-emerald-900/30 hover:bg-emerald-900/50 hover:text-emerald-200 border border-emerald-800/50 transition flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Question Paper
                    </a>
                  )}
                </div>
              );`;
              
const target1 = `                return (
                  <div className="flex gap-2">
                    <Link 
                      href={\`/exam/start/\${test.id}\`}
                      className="flex-1 text-center py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 transition shadow-md"
                    >
                      Retake ({\${attemptsUsed}}/\${maxAttempts})
                    </Link>
                    <Link 
                      href={\`/exam/result/\${submittedAttempt.id}\`}
                      className="text-center py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white border border-white/10 transition whitespace-nowrap"
                    >
                      View Result
                    </Link>
                  </div>
                );`;

const replace1 = `                return (
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex gap-2">
                      <Link 
                        href={\`/exam/start/\${test.id}\`}
                        className="flex-1 text-center py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 transition shadow-md"
                      >
                        Retake ({\${attemptsUsed}}/\${maxAttempts})
                      </Link>
                      <Link 
                        href={\`/exam/result/\${submittedAttempt.id}\`}
                        className="text-center py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white border border-white/10 transition whitespace-nowrap"
                      >
                        View Result
                      </Link>
                    </div>
                    {test.questionPaperUrl && (
                      <a 
                        href={test.questionPaperUrl}
                        download 
                        target="_blank" 
                        rel="noreferrer" 
                        className="w-full text-center py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold text-emerald-300 bg-emerald-900/30 hover:bg-emerald-900/50 hover:text-emerald-200 border border-emerald-800/50 transition flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download Question Paper
                      </a>
                    )}
                  </div>
                );`;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(target1.replace(/\n/g, '\r\n'), replace1.replace(/\n/g, '\r\n'));
  content = content.replace(target1, replace1);
  content = content.replace(target2.replace(/\n/g, '\r\n'), replace2.replace(/\n/g, '\r\n'));
  content = content.replace(target2, replace2);
  
  content = content.replace('BookOpen, Layers', 'BookOpen, Layers, Download');
  fs.writeFileSync(file, content);
}
console.log('Replaced successfully');
