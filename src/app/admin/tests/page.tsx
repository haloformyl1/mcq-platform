"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminTests() {
  const [tests, setTests] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [bulkUnlockAt, setBulkUnlockAt] = useState<string>("");
  const [bulkLockAt, setBulkLockAt] = useState<string>("");
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const router = useRouter();

  const fetchTests = () => {
    fetch("/api/admin/tests")
      .then(async res => {
        const data = await res.json();

        if (!res.ok || !Array.isArray(data)) {
          throw new Error(data.error || "Failed to fetch tests");
        }

        return data;
      })
      .then(data => {
        setTests(data);
        setError(null);
      })
      .catch(error => setError(error.message));
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const createTest = async () => {
    const res = await fetch("/api/admin/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "New Test",
        durationMinutes: 30,
        totalQuestions: 50,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push(`/admin/tests/${data.id}`);
    }
  };

  const isAllSelected = tests.length > 0 && selectedIds.length === tests.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tests.map(t => t.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const applyBulkStatus = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one test using the checkboxes.");
      return;
    }
    if (!bulkStatus) {
      alert("Please choose a status option to apply (LIVE, DRAFT, UPCOMING, EXPIRED).");
      return;
    }

    if (bulkStatus === "UPCOMING") {
      if (!bulkUnlockAt) {
        alert("Please select an Unlock Date & Time for UPCOMING status.");
        return;
      }
      if (!bulkLockAt) {
        alert("Please select a Re-Lock Date & Time for UPCOMING status.");
        return;
      }
      if (new Date(bulkLockAt) <= new Date(bulkUnlockAt)) {
        alert("Re-Lock Date & Time must be later than Unlock Date & Time.");
        return;
      }
    }

    setIsApplying(true);
    try {
      const res = await fetch("/api/admin/tests/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testIds: selectedIds,
          status: bulkStatus,
          unlockAt: bulkUnlockAt ? new Date(bulkUnlockAt).toISOString() : null,
          lockAt: bulkLockAt ? new Date(bulkLockAt).toISOString() : null,
        }),
      });

      const data = await res.json();
      setIsApplying(false);

      if (res.ok && data.success) {
        alert(`Successfully updated ${data.count} test(s) to status ${bulkStatus}!`);
        setSelectedIds([]);
        setBulkStatus("");
        setBulkUnlockAt("");
        setBulkLockAt("");
        fetchTests();
      } else {
        alert(data.error || "Failed to update selected tests.");
      }
    } catch (err) {
      setIsApplying(false);
      alert("An error occurred while updating tests.");
    }
  };

  const formatDateTimeDisplay = (dStr: string | null) => {
    if (!dStr) return "";
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, '0');
    let hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(hours)}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Manage Tests</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleSelectAll}
            className="bg-[#262626] hover:bg-[#333333] text-white border border-[#404040] px-3.5 py-2 text-sm rounded-md shadow transition font-medium flex items-center space-x-2"
          >
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={() => {}}
              className="rounded bg-[#1a1a1a] border-[#404040] text-blue-600 focus:ring-blue-500 pointer-events-none"
            />
            <span>{isAllSelected ? "Deselect All" : "Select All Tests"}</span>
          </button>
          <button onClick={createTest} className="bg-blue-600 text-white px-4 py-2 text-sm rounded shadow hover:bg-blue-700 font-medium">
            Create New Test
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-red-400">{error}</p>}

      {/* Bulk Action Toolbar */}
      <div className="bg-[#161616]/90 border border-blue-900/40 p-4 rounded-xl shadow-lg backdrop-blur-md space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold uppercase tracking-wider bg-blue-950 text-blue-400 px-3 py-1 rounded-full border border-blue-800">
              Bulk Actions
            </span>
            <span className="text-sm font-semibold text-white">
              {selectedIds.length} of {tests.length} test(s) selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <select
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value)}
              className="bg-[#262626] border border-[#404040] text-white text-sm rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Change Selected Status To --</option>
              <option value="LIVE">LIVE</option>
              <option value="DRAFT">DRAFT</option>
              <option value="UPCOMING">UPCOMING</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>

            <button
              onClick={applyBulkStatus}
              disabled={isApplying || selectedIds.length === 0 || !bulkStatus}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-bold shadow transition flex items-center space-x-1.5"
            >
              {isApplying ? "Updating..." : `Apply Status to Selected (${selectedIds.length})`}
            </button>
          </div>
        </div>

        {/* Schedule Inputs for Bulk UPCOMING selection */}
        {bulkStatus === "UPCOMING" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#333333] bg-[#111111]/80 p-3 rounded-lg">
            <div>
              <label className="block text-xs font-semibold text-amber-300">Unlock Date & Time for Selected Tests</label>
              <input
                type="datetime-local"
                value={bulkUnlockAt}
                onChange={e => setBulkUnlockAt(e.target.value)}
                className="mt-1 block w-full bg-[#262626] border border-[#404040] text-white rounded-md p-1.5 text-xs focus:ring-amber-500 focus:border-amber-500 [color-scheme:dark]"
              />
              {bulkUnlockAt && (
                <p className="mt-1 text-[11px] text-amber-400 font-mono">
                  Unlock: {formatDateTimeDisplay(bulkUnlockAt)}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-orange-400">Re-Lock Date & Time for Selected Tests</label>
              <input
                type="datetime-local"
                value={bulkLockAt}
                onChange={e => setBulkLockAt(e.target.value)}
                className="mt-1 block w-full bg-[#262626] border border-[#404040] text-white rounded-md p-1.5 text-xs focus:ring-orange-500 focus:border-orange-500 [color-scheme:dark]"
              />
              {bulkLockAt && (
                <p className="mt-1 text-[11px] text-orange-400 font-mono">
                  Re-Lock: {formatDateTimeDisplay(bulkLockAt)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#161616]/60 shadow rounded-lg overflow-hidden border border-[#333333] backdrop-blur-sm">
        <table className="min-w-full divide-y divide-[#333333]">
          <thead className="bg-[#1a1a1a]/80">
            <tr>
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded bg-[#262626] border-[#404040] text-blue-600 focus:ring-blue-500 cursor-pointer"
                  title="Select / Deselect All Tests"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Questions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-transparent divide-y divide-[#333333]">
            {tests.length === 0 && !error ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-[#a6a6a6]">No tests have been created yet.</td>
              </tr>
            ) : tests.map(test => {
              const isChecked = selectedIds.includes(test.id);
              const displayStatus = test.status === 'PUBLISHED' ? 'LIVE' : test.status === 'LOCKED' ? 'UPCOMING' : test.status;

              return (
                <tr key={test.id} className={`hover:bg-[#262626]/50 transition-colors ${isChecked ? 'bg-blue-950/20' : ''}`}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectRow(test.id)}
                      className="w-4 h-4 rounded bg-[#262626] border-[#404040] text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{test.title}</div>
                    <div className="text-sm text-[#a6a6a6]">{test.durationMinutes} mins | {test.marksPerQuestion} marks/q</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      displayStatus === 'LIVE' ? 'bg-green-900/30 text-green-400 border border-green-800' : 
                      displayStatus === 'UPCOMING' ? 'bg-amber-900/30 text-amber-300 border border-amber-800' :
                      displayStatus === 'EXPIRED' ? 'bg-red-900/30 text-red-400 border border-red-800' :
                      'bg-gray-800 text-gray-300 border border-gray-700'
                    }`}>
                      {displayStatus}
                    </span>
                    {(displayStatus === 'UPCOMING') && (test.unlockAt || test.lockAt) && (
                      <div className="text-[10px] text-[#8c8c8c] mt-1 space-y-0.5 font-mono">
                        {test.unlockAt && <div><span className="text-amber-400">Unlock:</span> {formatDateTimeDisplay(test.unlockAt)}</div>}
                        {test.lockAt && <div><span className="text-orange-400">Re-Lock:</span> {formatDateTimeDisplay(test.lockAt)}</div>}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#a6a6a6]">
                    {test._count.questions} / {test.totalQuestions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/admin/tests/${test.id}`} className="text-[#3b82f6] hover:text-[#60a5fa] transition-colors">Edit</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

