"use client";

import { useState } from "react";

interface ComplimentaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (board: string, academicLevel: string) => void;
}

export default function ComplimentaryModal({ isOpen, onClose, onConfirm }: ComplimentaryModalProps) {
  const [board, setBoard] = useState("CBSE");
  const [academicLevel, setAcademicLevel] = useState("CLASS 11");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111] border border-cyan-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-2">Grant Complimentary Access</h3>
        <p className="text-sm text-gray-400 mb-6">Select the curriculum this student will get access to.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Board</label>
            <select
              value={board}
              onChange={(e) => {
                const newBoard = e.target.value;
                setBoard(newBoard);
                if (newBoard === "WBCHSE") {
                  setAcademicLevel("SEM-I");
                } else {
                  setAcademicLevel("CLASS 11");
                }
              }}
              className="w-full bg-[#222] border border-[#444] rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500 transition"
            >
              <option value="CBSE">CBSE</option>
              <option value="WBCHSE">WBCHSE</option>
              <option value="ICSE">ICSE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Class / Semester</label>
            <select
              value={academicLevel}
              onChange={(e) => setAcademicLevel(e.target.value)}
              className="w-full bg-[#222] border border-[#444] rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500 transition"
            >
              {board === "WBCHSE" ? (
                <>
                  <option value="SEM-I">SEM-I</option>
                  <option value="SEM-II">SEM-II</option>
                  <option value="SEM-I+II">SEM-I+II</option>
                  <option value="SEM-III">SEM-III</option>
                  <option value="SEM-IV">SEM-IV</option>
                  <option value="SEM-III+IV">SEM-III+IV</option>
                  <option value="ALL">ALL</option>
                </>
              ) : (
                <>
                  <option value="CLASS 11">CLASS 11</option>
                  <option value="CLASS 12">CLASS 12</option>
                  <option value="BOTH">BOTH</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(board, academicLevel)}
            className="px-4 py-2 text-sm font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition"
          >
            Grant Access
          </button>
        </div>
      </div>
    </div>
  );
}
