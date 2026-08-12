"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function StudentLogin() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const autoSendRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    const nameParam = params.get('name');
    const autoSendParam = params.get('autoSend');
    
    if (emailParam) {
      setEmail(emailParam);
      if (nameParam) setName(nameParam);

      if (autoSendParam === 'true' && !autoSendRef.current) {
        autoSendRef.current = true;
        setLoading(true);
        fetch("/api/auth/student/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailParam, name: nameParam }),
        }).then(async (res) => {
          setLoading(false);
          if (res.ok) {
            setStep(2);
          } else {
            const data = await res.json();
            setError(data.error || "Failed to send OTP");
          }
        }).catch(() => {
          setLoading(false);
          setError("Failed to send OTP");
        });
      }
    }
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/student/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    });
    setLoading(false);
    if (res.ok) {
      setStep(2);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to send OTP");
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/student/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/dashboard");
    } else {
      const data = await res.json();
      setError(data.error || "Invalid OTP");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black relative font-sans text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header with PIECHEM logo */}
      <header className="absolute top-0 left-0 w-full p-6 sm:p-8 flex items-center space-x-4">
        {/* Logo Icon */}
        <div className="relative flex items-center justify-center w-[56px] h-[56px] rounded-full bg-[#e0f2fe] border-[1.5px] border-[#0284c7]">
          <div className="absolute w-[28px] h-[28px] border-[1.5px] border-[#0284c7] rotate-45"></div>
          {/* Inner pie shape */}
          <svg className="absolute w-5 h-5 text-[#0f283d] z-10" viewBox="0 0 24 24" fill="currentColor" style={{ transform: 'rotate(-15deg)' }}>
            <path d="M11 2A10 10 0 1 0 22 13h-11V2z" />
            <path d="M13.5 2.5a9.5 9.5 0 0 1 8 8h-8v-8z" />
          </svg>
        </div>
        <h1 className="text-white text-2xl sm:text-[28px] font-black tracking-wide font-sans mt-1">
          PIECHEM
        </h1>
      </header>

      <div className="sm:mx-auto sm:w-full sm:max-w-[450px] mt-10">
        <h2 className="mt-6 text-center text-[32px] leading-tight font-bold tracking-tight text-white">
          Student Portal
        </h2>
        <p className="mt-2 text-center text-[#a6a6a6] text-[16px]">
          Chemistry MCQ Examination
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[450px]">
        <div className="py-8 px-4 sm:px-10">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          {step === 1 ? (
            <form className="space-y-6" onSubmit={handleSendOTP}>
              <div className="relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder=" "
                  className="peer w-full bg-[#161616]/80 text-white border border-[#404040] rounded-md pt-6 pb-2 px-4 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition appearance-none text-[16px]"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <label 
                  htmlFor="name" 
                  className="absolute left-4 top-2 text-[12px] text-[#8c8c8c] transition-all peer-placeholder-shown:text-[16px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[12px] cursor-text pointer-events-none"
                >
                  Enter your name
                </label>
              </div>

              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder=" "
                  className="peer w-full bg-[#161616]/80 text-white border border-[#404040] rounded-md pt-6 pb-2 px-4 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition appearance-none text-[16px]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <label 
                  htmlFor="email" 
                  className="absolute left-4 top-2 text-[12px] text-[#8c8c8c] transition-all peer-placeholder-shown:text-[16px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[12px] cursor-text pointer-events-none"
                >
                  Email address
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0099ff] hover:bg-[#007acc] text-white font-semibold text-[16px] py-4 px-4 rounded-md transition duration-200 mt-2 disabled:opacity-70"
                >
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifyOTP}>
              <div className="relative">
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  placeholder=" "
                  className="peer w-full bg-[#161616]/80 text-white border border-[#404040] rounded-md pt-6 pb-2 px-4 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition appearance-none text-[16px] tracking-[0.5em] font-mono text-center"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <label 
                  htmlFor="otp" 
                  className="absolute left-4 top-2 text-[12px] text-[#8c8c8c] transition-all peer-placeholder-shown:text-[16px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[12px] cursor-text pointer-events-none w-full text-left"
                >
                  Enter OTP sent to {email}
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0099ff] hover:bg-[#007acc] text-white font-semibold text-[16px] py-4 px-4 rounded-md transition duration-200 mt-2 disabled:opacity-70"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
              <div className="text-[14px] text-center mt-6">
                <button type="button" onClick={() => setStep(1)} className="text-[#8c8c8c] hover:text-white transition">
                  Change email
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
