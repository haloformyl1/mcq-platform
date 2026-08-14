"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import PiechemLogo from "@/components/PiechemLogo";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        router.push("/admin");
      } else {
        setError(data.error || "Invalid username or password");
      }
    } catch (err) {
      setLoading(false);
      setError("Authentication failed. Please check connection.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black relative font-sans text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header with PIECHEM logo */}
      <header className="absolute top-0 left-0 w-full p-6 sm:p-8 flex items-center">
        <PiechemLogo size="lg" />
      </header>

      <div className="sm:mx-auto sm:w-full sm:max-w-[450px] mt-10">
        <div className="flex justify-center mb-3">
          <div className="p-3 bg-cyan-950/60 border border-cyan-500/30 rounded-2xl text-cyan-400 shadow-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-center text-[28px] sm:text-[32px] leading-tight font-bold tracking-tight text-white">
          Admin Portal
        </h2>
        <p className="mt-2 text-center text-[#a6a6a6] text-[15px]">
          Enter your admin credentials to access control panel
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-[450px]">
        <div className="py-8 px-4 sm:px-10 bg-[#161616]/70 border border-[#333333] rounded-2xl backdrop-blur-md shadow-2xl">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            {/* Username Input */}
            <div className="relative">
              <input
                id="username"
                name="username"
                type="text"
                required
                placeholder=" "
                className="peer w-full bg-[#1e293b]/50 text-white border border-[#404040] rounded-xl pt-6 pb-2 px-4 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition appearance-none text-[15px]"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <label 
                htmlFor="username" 
                className="absolute left-4 top-2 text-[12px] text-[#8c8c8c] transition-all peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[12px] cursor-text pointer-events-none"
              >
                Username or Email
              </label>
            </div>

            {/* Password Input */}
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder=" "
                className="peer w-full bg-[#1e293b]/50 text-white border border-[#404040] rounded-xl pt-6 pb-2 pl-4 pr-12 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition appearance-none text-[15px]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label 
                htmlFor="password" 
                className="absolute left-4 top-2 text-[12px] text-[#8c8c8c] transition-all peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[12px] cursor-text pointer-events-none"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-[#8c8c8c] hover:text-white transition focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-[15px] py-3.5 px-4 rounded-xl transition duration-200 shadow-lg disabled:opacity-70 mt-2"
              >
                {loading ? "Authenticating..." : "Login to Admin Portal"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
