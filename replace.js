const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/curriculum/[board]/[level]/page.tsx', 'utf8');

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

content = content.replace(target2.replace(/\n/g, '\r\n'), replace2.replace(/\n/g, '\r\n'));
content = content.replace(target2, replace2); // try both \n and \r\n
fs.writeFileSync('src/app/dashboard/curriculum/[board]/[level]/page.tsx', content);
console.log('Replaced successfully');
