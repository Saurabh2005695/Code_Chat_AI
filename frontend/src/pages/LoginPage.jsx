import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Terminal } from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';

const VIDEO_POSTER = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260912_105822_bf7c2d53-9957-4521-bbbf-7c1ab7a70130.png";
const VIDEO_SRC = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260912_105953_21ad8049-9088-4a00-bad3-aee6b5575a2b.mp4";

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-[var(--frame)] dark:bg-[#070B14] text-[var(--ink)] dark:text-[#F0F4FA] relative overflow-hidden flex flex-col justify-between font-sans transition-colors duration-200">
      {/* Background Video Caustics Plate */}
      <video
        className="video-caustics opacity-85 dark:opacity-40"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        aria-hidden="true"
        poster={VIDEO_POSTER}
        src={VIDEO_SRC}
      />

      {/* Subtle Ambient Tint */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/30 dark:from-[#070B14]/60 dark:to-[#070B14]/80 pointer-events-none z-[1]" />

      {/* Top Header */}
      <header className="relative z-10 px-6 sm:px-12 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <svg className="w-9 h-9 group-hover:scale-105 transition-transform" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <defs>
              <clipPath id="gclip-login"><circle cx="20" cy="20" r="18.2"/></clipPath>
            </defs>
            <circle cx="20" cy="20" r="18.4" stroke="#0d1b30" className="dark:stroke-[#96A6C4]" strokeWidth="1.1"/>
            <g clipPath="url(#gclip-login)" stroke="#0d1b30" className="dark:stroke-[#F0F4FA]" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13.2 4.6c3-.9 6.2-1 9.2-.1" strokeWidth="1.7"/>
              <path d="M5.6 9.2c3.8-1.9 8-2.4 11.7-1.2 2.5.8 4.3 2.1 6.6 2.3 2 .2 4.2-.4 6.4-1.5" strokeWidth="2.3"/>
              <path d="M2.6 13.9c4.4-2.4 9.4-3 13.6-1.5 2.4.9 4.1 2.3 6.4 2.4 2.3.1 4.7-1 7.1-2.4 1.6-.9 3.4-1.4 5.3-1.4" strokeWidth="2.7"/>
              <path d="M1.6 18.7c4.8-2.7 10.1-3.2 14.4-1.6 1.8.7 3.2 1.6 4.7 2.1-1.7 1.3-3.4 2.2-5.1 2.6 2.9.5 5.9-.1 8.8-1.5 1.5-.7 2.9-1.6 4.4-2.3 1.9-.9 3.9-1.3 5.9-1.1" strokeWidth="2.9"/>
              <path d="M1.9 24.1c4.5-2.4 9.6-3 13.9-1.6 2.3.7 4 1.9 6.2 2 2.4.1 5-.9 7.5-2.3 1.6-.9 3.3-1.4 5-1.4" strokeWidth="2.8"/>
              <path d="M3.7 28.8c4.1-2 8.7-2.5 12.6-1.3 2.2.7 3.8 1.8 5.9 1.8 2.3.1 4.8-.8 7.1-2.1 1.2-.7 2.5-1.1 3.8-1.2" strokeWidth="2.4"/>
              <path d="M7.6 32.9c3.5-1.5 7.4-1.9 10.6-.9 1.9.6 3.3 1.4 5 1.5 1.6.1 3.3-.3 5-1.1" strokeWidth="1.9"/>
              <path d="M13.6 35.8c2.8-.9 5.8-1 8.6-.2" strokeWidth="1.5"/>
            </g>
          </svg>
          <span className="font-extrabold text-xl tracking-tight text-[var(--ink)] dark:text-white">
            CodeChat <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 font-mono">SENTINEL</span>
          </span>
        </Link>

        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <Link
            to="/signup"
            className="px-4 py-2 rounded-full glass-pill text-xs font-semibold hover:text-[var(--accent)] transition-all"
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* Main Login Split */}
      <main className="relative z-10 max-w-6xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
        {/* Left Info Column */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-pill text-xs font-mono font-medium text-[var(--accent)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Developer Code Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-[var(--ink)] dark:text-white leading-tight">
            Welcome Back to <br />
            <span className="font-normal bg-gradient-to-r from-[var(--ink)] via-[var(--accent)] to-[var(--ink-soft)] dark:from-white dark:via-[var(--accent)] dark:to-slate-300 bg-clip-text text-transparent">
              ConSentinel RAG
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[var(--muted2)] dark:text-slate-300 leading-relaxed max-w-md">
            Sign in to chat with your codebase, inspect module dependencies, and verify every AI generation with exact AST citations.
          </p>

          <div className="space-y-3 max-w-md pt-2">
            <div className="flex items-center space-x-3 text-xs sm:text-sm text-[var(--ink-soft)] dark:text-slate-200">
              <Zap className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />
              <span>Sub-second streaming latency (~240ms TTFT)</span>
            </div>
            <div className="flex items-center space-x-3 text-xs sm:text-sm text-[var(--ink-soft)] dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>Tree-Sitter syntax boundary preservation</span>
            </div>
            <div className="flex items-center space-x-3 text-xs sm:text-sm text-[var(--ink-soft)] dark:text-slate-200">
              <Terminal className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />
              <span>Hybrid Dense ChromaDB + Sparse BM25 RRF Retrieval</span>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <div className="w-full max-w-md glass-panel-luxury p-8 rounded-[32px] shadow-2xl">
            <LoginForm />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-4 text-center text-xs text-[var(--muted2)] dark:text-slate-400 font-mono flex items-center justify-center space-x-2">
        <span>ConSentinel</span>
        <span>•</span>
        <span>Crafted with precision by <strong className="font-semibold text-[var(--ink)] dark:text-white">Saurabh</strong></span>
      </footer>
    </div>
  );
};

export default LoginPage;
