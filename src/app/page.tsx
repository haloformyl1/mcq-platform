"use client";

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black relative font-sans text-white">
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

      {/* Main Content */}
      <main className="flex min-h-screen items-center justify-center p-4 pt-20">
        {/* Transparent container floating on the full screen gradient */}
        <div className="w-full max-w-[450px] text-white p-10 sm:p-14">
          <h2 className="text-[32px] leading-tight font-bold mb-8 tracking-tight">Enter your info to log in</h2>

          <form onSubmit={(e) => { 
            e.preventDefault(); 
            const emailInput = document.getElementById('login-email') as HTMLInputElement;
            const nameInput = document.getElementById('login-name') as HTMLInputElement;
            if (emailInput && emailInput.value && nameInput && nameInput.value) {
              window.location.href = `/login?email=${encodeURIComponent(emailInput.value)}&name=${encodeURIComponent(nameInput.value)}&autoSend=true`;
            } else {
              window.location.href = '/login'; 
            }
          }} className="space-y-4">
            <div className="relative">
              <input 
                type="text" 
                id="login-name"
                required
                className="peer w-full bg-[#161616]/80 text-white border border-[#404040] rounded-md pt-6 pb-2 px-4 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition appearance-none text-[16px]"
                placeholder=" "
              />
              <label 
                htmlFor="login-name" 
                className="absolute left-4 top-2 text-[12px] text-[#8c8c8c] transition-all peer-placeholder-shown:text-[16px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[12px] cursor-text pointer-events-none"
              >
                Enter your name
              </label>
            </div>
            <div className="relative">
              <input 
                type="email" 
                id="login-email"
                required
                className="peer w-full bg-[#161616]/80 text-white border border-[#404040] rounded-md pt-6 pb-2 px-4 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition appearance-none text-[16px]"
                placeholder=" "
              />
              <label 
                htmlFor="login-email" 
                className="absolute left-4 top-2 text-[12px] text-[#8c8c8c] transition-all peer-placeholder-shown:text-[16px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[12px] cursor-text pointer-events-none"
              >
                Enter your email address
              </label>
            </div>

            <button 
              type="submit"
              className="w-full bg-[#0099ff] hover:bg-[#007acc] text-white font-semibold text-[16px] py-4 px-4 rounded-md transition duration-200 mt-2"
            >
              Continue
            </button>
          </form>

          <div className="mt-8 text-[#a6a6a6] text-[16px]">
            <div className="flex justify-between items-center mb-6">
              <Link href="/admin/login" className="hover:underline flex items-center group">
                Admin Login
                <svg className="w-5 h-5 ml-1 text-[#a6a6a6] group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </Link>
            </div>
            
            <p className="text-[13px] text-[#8c8c8c] leading-relaxed">
              This page is protected by Google reCAPTCHA to ensure you're not a bot.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
