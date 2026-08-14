"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import PiechemLogo from "@/components/PiechemLogo";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const handleTestAsStudent = async () => {
    try {
      const res = await fetch("/api/admin/test-as-student", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        alert(data.error || "Failed to switch to test student mode.");
      }
    } catch (err) {
      console.error(err);
      alert("Error switching to student mode.");
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/admin" },
    { name: "Tests", href: "/admin/tests" },
    { name: "Students", href: "/admin/students" },
    { name: "Results", href: "/admin/results" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black flex flex-col font-sans text-white">
      <nav className="bg-[#161616]/40 border-b border-[#404040]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center space-x-3">
                <PiechemLogo size="sm" />
                <span className="border-l border-gray-700 pl-3 text-sm text-gray-300 font-medium tracking-wide">Admin Panel</span>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                        pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin")
                          ? "bg-[#262626] text-white"
                          : "text-[#a6a6a6] hover:bg-[#333333] hover:text-white"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleTestAsStudent}
                className="bg-amber-600/80 hover:bg-amber-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center space-x-1.5 shadow-sm border border-amber-500/30"
              >
                <span>🎓 Test as Student</span>
              </button>
              <button
                onClick={handleLogout}
                className="text-[#a6a6a6] hover:bg-[#333333] hover:text-white px-3 py-2 rounded-md text-sm font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 text-white">
          {children}
        </div>
      </main>
    </div>
  );
}
