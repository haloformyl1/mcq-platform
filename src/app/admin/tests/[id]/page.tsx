"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import PiFiringLoader from "@/components/PiFiringLoader";

export default function EditTest({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/admin/tests/${resolvedParams.id}`)
      .then(res => res.json())
      .then(data => {
        setTest(data);
        setLoading(false);
      });
  }, [resolvedParams.id]);

  const saveSettings = async () => {
    if (test.status === "LOCKED") {
      if (!test.lockAt) {
        alert("Please select a lock date and time.");
        return;
      }
      if (test.unlockAt && test.lockAt && new Date(test.lockAt) <= new Date(test.unlockAt)) {
        alert("Lock date and time must be later than the unlock date and time.");
        return;
      }
    }
    await fetch(`/api/admin/tests/${resolvedParams.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(test),
    });
    alert("Settings saved!");
  };

  const deleteTest = async () => {
    if (confirm("Are you sure?")) {
      await fetch(`/api/admin/tests/${resolvedParams.id}`, { method: "DELETE" });
      router.push("/admin/tests");
    }
  };

  const addSampleQuestion = async () => {
    const qData = {
      questionText: "New Question",
      optionA: "Option A",
      optionB: "Option B",
      optionC: "Option C",
      optionD: "Option D",
      correctAnswer: "A",
      difficulty: "Easy"
    };
    const res = await fetch(`/api/admin/tests/${resolvedParams.id}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(qData)
    });
    if (res.ok) {
      const newQ = await res.json();
      setTest({ ...test, questions: [...test.questions, newQ] });
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const reevaluateQuestion = async (qId: string, index: number) => {
    const res = await fetch(`/api/admin/questions/${qId}/reevaluate`, {
      method: "POST",
    });
    if (res.ok) {
      const data = await res.json();
      alert(`Scrutiny Complete for Q${index}!\n\n${data.message}`);
    } else {
      alert("Failed to re-evaluate question scores.");
    }
  };

  const deleteQuestion = async (id: string) => {
    if (confirm("Delete question?")) {
      await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
      setTest({ ...test, questions: test.questions.filter((q: any) => q.id !== id) });
    }
  };

  const updateQuestion = async () => {
    if (!editingQuestion) return;
    const res = await fetch(`/api/admin/questions/${editingQuestion.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingQuestion),
    });
    if (res.ok) {
      const data = await res.json();
      const updatedQ = data.question || data;
      setTest({
        ...test,
        questions: test.questions.map((q: any) => q.id === updatedQ.id ? updatedQ : q)
      });
      setEditingQuestion(null);
      const updatedCount = data.updatedAttempts ?? 0;
      const totalCount = data.totalAttempts ?? 0;
      alert(`Question updated successfully!\n\nScrutiny result: Re-evaluated ${totalCount} student attempt(s), ${updatedCount} score(s) updated within seconds.`);
    } else {
      alert("Failed to update question");
    }
  };

  const downloadTemplate = () => {
    const headers = ["questionText", "optionA", "optionB", "optionC", "optionD", "correctAnswer", "difficulty", "explanation", "category"];
    const sampleRow = ["What is the chemical formula for water?", "H2O", "CO2", "O2", "NaCl", "A", "Easy", "Water consists of two hydrogen atoms and one oxygen atom.", "Inorganic Chemistry"];
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), sampleRow.join(",")].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "questions_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsImporting(true);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          let count = 0;
          let totalRows = results.data.length;
          
          for (const rawRow of results.data as any[]) {
            // Normalize keys to lowercase and trim
            const row: any = {};
            for (const key in rawRow) {
               row[key.trim().toLowerCase()] = rawRow[key]?.trim();
            }
            
            const questionText = row.questiontext || row.question || row.q;
            const optionA = row.optiona || row.a || row['option a'] || row['option_a'];
            const optionB = row.optionb || row.b || row['option b'] || row['option_b'];
            const optionC = row.optionc || row.c || row['option c'] || row['option_c'];
            const optionD = row.optiond || row.d || row['option d'] || row['option_d'];
            let correctAnswer = row.correctanswer || row.answer || row.correct || row['correct answer'] || row['correct_answer'];
            
            // Standardize correct answer to A, B, C, or D
            if (correctAnswer) correctAnswer = correctAnswer.charAt(0).toUpperCase();
            
            if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
              continue;
            }
            
            const qData = {
              questionText,
              optionA,
              optionB,
              optionC,
              optionD,
              correctAnswer,
              explanation: row.explanation || row.desc || "",
              difficulty: row.difficulty || row.level || "Moderate",
              category: row.category || row.topic || "",
            };
            
            const res = await fetch(`/api/admin/tests/${resolvedParams.id}/questions`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(qData)
            });
            
            if (res.ok) {
              count++;
            } else {
              const errData = await res.json().catch(() => ({}));
              if (errData.error && errData.error.includes("Maximum")) {
                alert(`Import stopped: ${errData.error}`);
                break;
              }
            }
          }
          
          setIsImporting(false);
          e.target.value = ''; // Reset input so same file can be selected again
          
          if (count > 0) {
            alert(`Successfully imported ${count} questions.`);
            window.location.reload();
          } else if (count === 0 && totalRows > 0) {
            // We only show this if it wasn't broken by the max limit (in which case they already got an alert)
            alert(`Found ${totalRows} rows but 0 were imported. Please check your CSV headers or question limit.`);
            window.location.reload();
          }
        }
      });
    }
  };

  const formatForInput = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const recalculateScores = async () => {
    if (confirm("Recalculate scores for all submitted attempts of this test?")) {
      const res = await fetch(`/api/admin/tests/${resolvedParams.id}/recalculate`, { method: "POST" });
      if (res.ok) {
        alert("Student scores recalculated successfully!");
      } else {
        alert("Failed to recalculate scores.");
      }
    }
  };

  if (loading) return <PiFiringLoader fullScreen={true} />;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Test</h1>
        <div className="flex items-center space-x-3">
          <button onClick={recalculateScores} className="bg-amber-600/30 text-amber-300 border border-amber-500/40 px-3 py-2 text-sm rounded shadow hover:bg-amber-600/50 transition">Recalculate Scores</button>
          <button onClick={deleteTest} className="text-red-400 hover:text-red-300 font-medium text-sm px-2">Delete Test</button>
          <button onClick={saveSettings} className="bg-blue-600 text-white px-4 py-2 text-sm rounded shadow hover:bg-blue-700 font-medium">Save Settings</button>
        </div>
      </div>

      <div className="bg-[#161616]/60 p-6 rounded-lg shadow border border-[#333333] backdrop-blur-sm grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#a6a6a6]">Title</label>
          <input className="mt-1 block w-full bg-[#262626] border border-[#404040] text-white rounded-md p-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]" value={test.title} onChange={e => setTest({...test, title: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#a6a6a6]">Status</label>
          <select className="mt-1 block w-full bg-[#262626] border border-[#404040] text-white rounded-md p-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]" value={test.status} onChange={e => {
            const newStatus = e.target.value;
            if (newStatus === "PUBLISHED") {
              setTest({ ...test, status: newStatus, lockAt: null, unlockAt: null });
            } else {
              setTest({ ...test, status: newStatus });
            }
          }}>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="LOCKED">LOCKED</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#a6a6a6]">Duration (Minutes)</label>
          <input type="number" className="mt-1 block w-full bg-[#262626] border border-[#404040] text-white rounded-md p-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]" value={test.durationMinutes} onChange={e => setTest({...test, durationMinutes: parseInt(e.target.value)})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#a6a6a6]">Total Questions Limit (Max 50)</label>
          <input type="number" max="50" className="mt-1 block w-full bg-[#262626] border border-[#404040] text-white rounded-md p-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]" value={test.totalQuestions} onChange={e => setTest({...test, totalQuestions: parseInt(e.target.value)})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#a6a6a6]">Marks per Question</label>
          <input type="number" step="0.5" className="mt-1 block w-full bg-[#262626] border border-[#404040] text-white rounded-md p-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]" value={test.marksPerQuestion} onChange={e => setTest({...test, marksPerQuestion: parseFloat(e.target.value)})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#a6a6a6]">Negative Marks</label>
          <div className="flex items-center space-x-2 mt-1">
            <input type="checkbox" checked={test.negativeMarking} onChange={e => setTest({...test, negativeMarking: e.target.checked})} />
            <input type="number" step="0.25" disabled={!test.negativeMarking} className="block w-full bg-[#262626] border border-[#404040] text-white rounded-md p-2 disabled:bg-[#1a1a1a] disabled:text-[#666666] focus:ring-[#3b82f6] focus:border-[#3b82f6]" value={test.negativeMarks} onChange={e => setTest({...test, negativeMarks: parseFloat(e.target.value)})} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#a6a6a6]">Maximum Attempts Per Student</label>
          <input type="number" min="1" step="1" className="mt-1 block w-full bg-[#262626] border border-[#404040] text-white rounded-md p-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]" value={test.maximumAttempts || 1} onChange={e => setTest({...test, maximumAttempts: parseInt(e.target.value)})} />
          <p className="mt-1 text-xs text-[#888888]">Total number of attempts allowed per student, including the first attempt (e.g., 2 = initial attempt + 1 retake).</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#a6a6a6]">Shuffle Questions</label>
          <div className="flex items-center space-x-2 mt-1">
            <input type="checkbox" checked={test.randomizeQuestions || false} onChange={e => setTest({...test, randomizeQuestions: e.target.checked})} />
            <span className="text-sm text-[#a6a6a6]">{test.randomizeQuestions ? "Yes - Questions will be shuffled for each attempt" : "No - Questions will appear in the same order"}</span>
          </div>
          <p className="mt-1 text-xs text-[#888888]">When enabled, questions will be randomly shuffled each time a student takes the test. The correct answer for each question will remain intact.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#a6a6a6]">Shuffle Answer Options</label>
          <div className="flex items-center space-x-2 mt-1">
            <input type="checkbox" checked={test.randomizeOptions || false} onChange={e => setTest({...test, randomizeOptions: e.target.checked})} />
            <span className="text-sm text-[#a6a6a6]">{test.randomizeOptions ? "Yes - Answer options will be shuffled" : "No - Answer options will appear in the same order"}</span>
          </div>
          <p className="mt-1 text-xs text-[#888888]">When enabled, the positions of answer options (A, B, C, D) will be shuffled for each question. The correct answer will automatically move with its option.</p>
        </div>
      </div>

      {test.status === "LOCKED" && (
        <div className="bg-[#161616]/60 p-6 rounded-lg shadow border border-[#333333] backdrop-blur-sm space-y-4">
          <h2 className="text-lg font-bold">Scheduled Access Window</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#a6a6a6]">Unlock Date & Time <span className="text-[#666666] font-normal">(Optional)</span></label>
              <input type="datetime-local" className="mt-1 block w-full bg-[#262626] border border-[#404040] text-white rounded-md p-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] [color-scheme:dark]" value={formatForInput(test.unlockAt)} onChange={e => {
                const val = e.target.value;
                if (!val) { setTest({...test, unlockAt: null}); return; }
                const d = new Date(val);
                if (!isNaN(d.getTime())) setTest({...test, unlockAt: d.toISOString()});
              }} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a6a6a6]">Lock Date & Time</label>
              <input type="datetime-local" className="mt-1 block w-full bg-[#262626] border border-[#404040] text-white rounded-md p-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] [color-scheme:dark]" value={formatForInput(test.lockAt)} onChange={e => {
                const val = e.target.value;
                if (!val) { setTest({...test, lockAt: null}); return; }
                const d = new Date(val);
                if (!isNaN(d.getTime())) setTest({...test, lockAt: d.toISOString()});
              }} />
            </div>
          </div>

          <div className="pt-2 border-t border-[#333333]">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded bg-[#262626] border-[#404040] text-amber-500 focus:ring-amber-500"
                checked={test.autoExpireOnLock ?? true}
                onChange={e => setTest({ ...test, autoExpireOnLock: e.target.checked })}
              />
              <span className="text-sm font-semibold text-amber-300">
                ⌛ Schedule Expiry: Automatically expire test when lock time arrives
              </span>
            </label>
            <p className="mt-1 text-xs text-[#888888] pl-6.5">
              When checked, the test will automatically move into the Expired Tests section once the Lock Date & Time passes, requiring admin approval for any new attempt.
            </p>
          </div>

          <div className="mt-4 text-sm text-[#a6a6a6]">
            <p>Students can start this test only during the configured access window.</p>
            <p className="mt-1 text-yellow-400">Note: Students who have already started the test will be allowed to continue their active attempt even after the lock time.</p>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-between items-center">
        <h2 className="text-xl font-bold">Questions ({test.questions?.length || 0})</h2>
        <div className="space-x-2">
          <button onClick={downloadTemplate} className="bg-gray-200 text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-300 font-medium text-sm">
            Download Template
          </button>
          <label className={`bg-green-600 text-white px-4 py-2 rounded shadow cursor-pointer font-medium text-sm ${isImporting ? 'opacity-70' : 'hover:bg-green-700'}`}>
            {isImporting ? 'Importing...' : 'Import CSV'}
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={isImporting} />
          </label>
          <button onClick={addSampleQuestion} className="bg-gray-800 text-white px-4 py-2 rounded shadow hover:bg-gray-900 font-medium text-sm">Add Quick Question</button>
        </div>
      </div>

      <div className="space-y-4 mt-4">
        {test.questions?.map((q: any, i: number) => (
          <div key={q.id} className="bg-[#161616]/60 p-4 rounded-lg shadow border border-[#333333] backdrop-blur-sm">
            {editingQuestion?.id === q.id ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-white">Edit Question {i + 1}</h3>
                  <div className="space-x-2">
                    <button onClick={() => setEditingQuestion(null)} className="text-gray-400 hover:text-white text-sm font-medium transition-colors">Cancel</button>
                    <button onClick={updateQuestion} className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700 text-sm">Save</button>
                  </div>
                </div>
                <textarea className="w-full bg-[#262626] border border-[#404040] text-white rounded-md p-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]" rows={3} value={editingQuestion.questionText} onChange={e => setEditingQuestion({...editingQuestion, questionText: e.target.value})} placeholder="Question Text" />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input className="bg-[#262626] border border-[#404040] text-white rounded-md p-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]" value={editingQuestion.optionA} onChange={e => setEditingQuestion({...editingQuestion, optionA: e.target.value})} placeholder="Option A" />
                  <input className="bg-[#262626] border border-[#404040] text-white rounded-md p-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]" value={editingQuestion.optionB} onChange={e => setEditingQuestion({...editingQuestion, optionB: e.target.value})} placeholder="Option B" />
                  <input className="bg-[#262626] border border-[#404040] text-white rounded-md p-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]" value={editingQuestion.optionC} onChange={e => setEditingQuestion({...editingQuestion, optionC: e.target.value})} placeholder="Option C" />
                  <input className="bg-[#262626] border border-[#404040] text-white rounded-md p-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]" value={editingQuestion.optionD} onChange={e => setEditingQuestion({...editingQuestion, optionD: e.target.value})} placeholder="Option D" />
                </div>
                <div className="flex gap-4 mt-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-[#a6a6a6] mb-1">Correct Answer</label>
                    <select className="w-full bg-[#262626] border border-[#404040] text-white rounded-md p-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]" value={editingQuestion.correctAnswer} onChange={e => setEditingQuestion({...editingQuestion, correctAnswer: e.target.value})}>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-[#a6a6a6] mb-1">Explanation (Optional)</label>
                    <input className="w-full bg-[#262626] border border-[#404040] text-white rounded-md p-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]" value={editingQuestion.explanation || ""} onChange={e => setEditingQuestion({...editingQuestion, explanation: e.target.value})} placeholder="Explanation..." />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-white whitespace-pre-wrap">Q{i + 1}. {q.questionText}</h3>
                  <div className="flex items-center space-x-3 shrink-0 ml-4">
                    <button 
                      onClick={() => reevaluateQuestion(q.id, i + 1)} 
                      className="bg-amber-600/20 text-amber-300 hover:bg-amber-600/40 border border-amber-500/40 px-2.5 py-1 text-xs rounded transition-colors font-medium cursor-pointer"
                      title="Re-evaluate / Scrutinize student attempt scores for this question"
                    >
                      Scrutiny / Re-evaluate
                    </button>
                    <button onClick={() => setEditingQuestion(q)} className="text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors">Edit</button>
                    <button onClick={() => deleteQuestion(q.id)} className="text-red-500 hover:text-red-400 text-sm font-medium transition-colors">Delete</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 text-sm text-[#cccccc]">
                  <div className={`p-2 rounded ${q.correctAnswer === 'A' ? 'bg-green-900/30 border border-green-500/50 text-green-300 font-medium' : 'bg-[#262626]/50 border border-[#404040]'}`}>A. {q.optionA}</div>
                  <div className={`p-2 rounded ${q.correctAnswer === 'B' ? 'bg-green-900/30 border border-green-500/50 text-green-300 font-medium' : 'bg-[#262626]/50 border border-[#404040]'}`}>B. {q.optionB}</div>
                  <div className={`p-2 rounded ${q.correctAnswer === 'C' ? 'bg-green-900/30 border border-green-500/50 text-green-300 font-medium' : 'bg-[#262626]/50 border border-[#404040]'}`}>C. {q.optionC}</div>
                  <div className={`p-2 rounded ${q.correctAnswer === 'D' ? 'bg-green-900/30 border border-green-500/50 text-green-300 font-medium' : 'bg-[#262626]/50 border border-[#404040]'}`}>D. {q.optionD}</div>
                </div>
                {q.explanation && (
                  <div className="mt-3 text-sm text-[#a6a6a6] bg-[#111111]/80 p-2.5 rounded border border-[#333333]">
                    <span className="font-semibold text-white">Explanation:</span> {q.explanation}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
