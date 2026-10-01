const fs = require('fs');

const files = [
  'src/app/dashboard/curriculum/[board]/[level]/page.tsx',
  'src/app/dashboard/category/[category]/page.tsx',
  'src/app/dashboard/category/[category]/[board]/[level]/page.tsx'
];

const target = `            ) : (
              <Link 
                href={\`/exam/start/\${test.id}\`}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 transition shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] active:scale-[0.98]"
              >
                <span>Start Test</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}`;

const replace = `            ) : (
              <div className="flex flex-col gap-2 w-full">
                <Link 
                  href={\`/exam/start/\${test.id}\`}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 transition shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] active:scale-[0.98]"
                >
                  <span>Start Test</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {test.questionPaperUrl && (
                  <button 
                    onClick={() => alert("Please attempt the test first to download the question paper.")}
                    className="w-full text-center py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold text-emerald-300 bg-emerald-900/30 hover:bg-emerald-900/50 hover:text-emerald-200 border border-emerald-800/50 transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Question Paper
                  </button>
                )}
              </div>
            )}`;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(target.replace(/\n/g, '\r\n'), replace.replace(/\n/g, '\r\n'));
  content = content.replace(target, replace);
  fs.writeFileSync(file, content);
}
console.log('Replaced successfully');
