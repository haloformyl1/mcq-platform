"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PiFiringLoader from "@/components/PiFiringLoader";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/tests")
      .then(async res => {
        if (res.status === 401) {
          router.push("/admin/login");
          return null;
        }
        const data = await res.json();
        if (!res.ok || !Array.isArray(data)) {
          throw new Error(data.error || "Failed to fetch tests");
        }
        return data;
      })
      .then(data => {
        if (data) {
          setStats({
            totalTests: data.length,
            publishedTests: data.filter((t: any) => t.status === "PUBLISHED" || t.status === "LIVE").length,
            totalQuestions: data.reduce((acc: number, t: any) => acc + (t._count?.questions || 0), 0),
            totalAttempts: data.reduce((acc: number, t: any) => acc + (t._count?.attempts || 0), 0),
          });
        }
      })
      .catch(err => setError(err.message));
  }, [router]);

  const handleTestAsStudent = async () => {
    try {
      const res = await fetch("/api/admin/test-as-student", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = "/dashboard";
      } else {
        alert(data.error || "Failed to switch to test student mode.");
      }
    } catch (err) {
      console.error(err);
      alert("Error switching to student mode.");
    }
  };

  if (error) return <div className="text-red-400">{error}</div>;
  if (!stats) return <PiFiringLoader fullScreen={true} />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#161616]/60 p-6 rounded-lg shadow border border-[#333333] backdrop-blur-sm">
          <p className="text-[#a6a6a6] text-sm font-medium">Total Tests</p>
          <p className="text-3xl font-bold text-white mt-2">{stats.totalTests}</p>
        </div>
        <div className="bg-[#161616]/60 p-6 rounded-lg shadow border border-[#333333] backdrop-blur-sm">
          <p className="text-[#a6a6a6] text-sm font-medium">Live Tests</p>
          <p className="text-3xl font-bold text-white mt-2">{stats.publishedTests}</p>
        </div>
        <div className="bg-[#161616]/60 p-6 rounded-lg shadow border border-[#333333] backdrop-blur-sm">
          <p className="text-[#a6a6a6] text-sm font-medium">Total Questions</p>
          <p className="text-3xl font-bold text-white mt-2">{stats.totalQuestions}</p>
        </div>
        <div className="bg-[#161616]/60 p-6 rounded-lg shadow border border-[#333333] backdrop-blur-sm">
          <p className="text-[#a6a6a6] text-sm font-medium">Total Attempts</p>
          <p className="text-3xl font-bold text-white mt-2">{stats.totalAttempts}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <Link href="/admin/tests" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 font-medium">
          Manage Tests
        </Link>
        <Link href="/admin/results" className="bg-gray-600 text-white px-4 py-2 rounded shadow hover:bg-gray-700 font-medium">
          View Results
        </Link>
        <button
          onClick={handleTestAsStudent}
          className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded shadow transition font-medium flex items-center space-x-2"
        >
          <span>🎓 Test Site as Student</span>
        </button>
      </div>
    </div>
  );
}
