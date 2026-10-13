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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#111] border border-red-500/40 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <span>⚡ Grant PIE Ultra Access</span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">VIP Unlimited</span>
        </h3>
        <p className="text-xs text-gray-300 mb-4 leading-relaxed">
          Student will receive <strong className="text-red-400">PIE Ultra VIP Access</strong> for <span className="text-emerald-400 font-bold">infinite time</span> (never expires). Only an Admin can downgrade them back to Free.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Education Board</label>
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
              className="w-full bg-[#222] border border-[#444] rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 transition cursor-pointer"
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
              className="w-full bg-[#222] border border-[#444] rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 transition cursor-pointer"
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
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(board, academicLevel)}
            className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-lg transition shadow-[0_0_15px_rgba(229,9,20,0.4)] cursor-pointer"
          >
            Grant Ultra Access
          </button>
        </div>
      </div>
    </div>
  );
}
