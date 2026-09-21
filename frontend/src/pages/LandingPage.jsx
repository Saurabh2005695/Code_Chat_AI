import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  FolderGit2, 
  ChevronRight, 
  Zap, 
  FileCode, 
  Terminal,
  Layers,
  Network,
  BarChart2,
  Play,
  Smartphone,
  MessageSquareCode
} from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';
import InstallGuideModal from '../components/common/InstallGuideModal';

const VIDEO_POSTER = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260912_105822_bf7c2d53-9957-4521-bbbf-7c1ab7a70130.png";
const VIDEO_SRC = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260912_105953_21ad8049-9088-4a00-bad3-aee6b5575a2b.mp4";

const LandingPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(window.deferredPrompt || null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt);
    }
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setDeferredPrompt(e);
    };
    const handleCustomEvent = () => {
      if (window.deferredPrompt) {
        setDeferredPrompt(window.deferredPrompt);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('pwa-installable', handleCustomEvent);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('pwa-installable', handleCustomEvent);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = window.deferredPrompt || deferredPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        window.deferredPrompt = null;
        setDeferredPrompt(null);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--frame)] dark:bg-[#070B14] text-[var(--ink)] dark:text-[#F0F4FA] relative overflow-x-hidden font-sans transition-colors duration-200">
      {/* Background Video Caustics Plate */}
      <video
        className="video-caustics opacity-90 dark:opacity-40"
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
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/40 dark:from-[#070B14]/60 dark:to-[#070B14]/80 pointer-events-none z-[1]" />

      {/* Foreground Container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Header Row */}
        <header className="px-6 sm:px-12 py-6 flex items-center justify-between">
          {/* Brand Logo & Striped Globe */}
          <Link to="/" className="flex items-center space-x-3 group">
            <svg className="w-10 h-10 group-hover:scale-105 transition-transform" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <defs>
                <clipPath id="gclip"><circle cx="20" cy="20" r="18.2"/></clipPath>
              </defs>
              <circle cx="20" cy="20" r="18.4" stroke="#0d1b30" className="dark:stroke-[#96A6C4]" strokeWidth="1.1"/>
              <g clipPath="url(#gclip)" stroke="#0d1b30" className="dark:stroke-[#F0F4FA]" fill="none" strokeLinecap="round" strokeLinejoin="round">
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
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-[var(--ink)] dark:text-white">
              CodeChat <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 font-mono">AI</span>
            </span>
          </Link>

          {/* Centred Frosted Glass Nav Capsule */}
          <nav className="hidden md:flex items-center space-x-6 px-6 py-3 rounded-full glass-pill text-xs font-semibold text-[#202940] dark:text-slate-200 shadow-sm">
            <Link to="/chat" className="hover:text-[var(--accent)] transition-colors">Chat Assistant</Link>
            <div className="w-[1.5px] h-4 bg-[#CED5E0] dark:bg-slate-700" />
            <Link to="/graph" className="hover:text-[var(--accent)] transition-colors">Architecture Graph</Link>
            <div className="w-[1.5px] h-4 bg-[#CED5E0] dark:bg-slate-700" />
            <Link to="/eval" className="hover:text-[var(--accent)] transition-colors">Benchmarks</Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            
            {/* Install App Button */}
            <button
              onClick={handleInstallClick}
              className="hidden sm:flex items-center space-x-2 px-3.5 py-2 rounded-full glass-pill text-xs font-semibold text-[var(--ink)] dark:text-white hover:border-[var(--accent)] transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Install Mobile App"
            >
              <Smartphone className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Install App</span>
            </button>

            <Link
              to="/login"
              className="group pl-5 pr-2 py-2 rounded-full bg-[var(--cta)] dark:bg-[#1A2B45] hover:bg-[#162744] text-white text-xs sm:text-sm font-medium transition-all flex items-center space-x-3 shadow-lg hover:shadow-xl active:scale-95"
            >
              <span>Get Started</span>
              <div className="w-8 h-8 rounded-full bg-[var(--cta-knob)] dark:bg-[#384B64] flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform">
                <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </header>

        {/* Hero Body Grid */}
        <div className="flex-1 max-w-7xl mx-auto w-full px-6 sm:px-12 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Eyebrow, H1, Tagrow */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
            <div className="inline-block text-xs sm:text-sm font-semibold tracking-wider uppercase text-[var(--muted)] dark:text-[var(--text-secondary)] font-mono">
              Your Codebase Intelligence
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-[var(--ink)] dark:text-white leading-[1.08]">
              CodeChat AI<br />
              <span className="font-normal bg-gradient-to-r from-[var(--ink)] via-[var(--accent)] to-[var(--ink-soft)] dark:from-white dark:via-[var(--accent)] dark:to-slate-300 bg-clip-text text-transparent">
                Chat With Any Codebase.
              </span>
            </h1>

            {/* Tagline Row with Play Pill */}
            <div className="flex items-center space-x-4 pt-2">
              <Link
                to="/chat"
                className="w-12 h-12 rounded-full bg-white dark:bg-[#181C26] shadow-md flex items-center justify-center text-[var(--ink)] dark:text-white hover:scale-105 active:scale-95 transition-all flex-shrink-0"
                title="Play Interactive CodeChat Demo"
              >
                <Play className="w-4 h-4 fill-[var(--ink)] dark:fill-white ml-0.5" />
              </Link>
              <p className="text-base sm:text-xl font-normal text-[var(--ink-soft)] dark:text-slate-200">
                Grounded AST RAG • Hybrid Vector Retrieval • Exact Citations
              </p>
            </div>

            {/* Action Buttons with Install App */}
            <div className="pt-4 flex flex-wrap gap-4 items-center">
              <Link
                to="/login"
                className="px-6 py-3.5 rounded-2xl bg-[var(--cta)] dark:bg-[#1A2B45] hover:bg-[#162744] text-white text-sm font-semibold shadow-xl transition-all flex items-center space-x-2 group active:scale-95"
              >
                <span>Start Chatting Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <button
                onClick={handleInstallClick}
                className="px-6 py-3.5 rounded-2xl glass-card-luxury text-[var(--ink)] dark:text-white text-sm font-semibold hover:border-[var(--accent)] transition-all flex items-center space-x-2 active:scale-95 cursor-pointer shadow-md"
              >
                <Smartphone className="w-4 h-4 text-[var(--accent)]" />
                <span>Install Mobile App</span>
              </button>
            </div>
          </div>

          {/* Right Column: Frosted Glass Panel with AI Code Intelligence & Scale Gauge */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <aside className="w-full max-w-sm rounded-[32px] glass-panel-luxury p-7 space-y-6 relative overflow-hidden transition-all hover:shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-[var(--ink)] dark:text-white">AI-Powered</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-ping" />
                  </div>
                  <p className="text-sm text-[var(--muted2)] dark:text-slate-300 mt-2 font-normal leading-snug">
                    Tree-Sitter AST Chunking<br />
                    Hybrid Vector + BM25<br />
                    Exact Line Citations
                  </p>
                </div>

                {/* Floating Code Intelligence Icon */}
                <div className="w-16 h-16 rounded-full bg-white/95 dark:bg-[#1A2B45] shadow-lg flex items-center justify-center flex-shrink-0 text-[var(--accent)]">
                  <MessageSquareCode className="w-8 h-8" />
                </div>
              </div>

              {/* Scale Gauge Track */}
              <div className="space-y-2 pt-4">
                <div className="flex justify-between text-xs font-mono font-medium text-[#586580] dark:text-slate-400">
                  <span>1K</span>
                  <span>10K</span>
                  <span>50K</span>
                  <span>100K+</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--track)] dark:bg-slate-700 overflow-hidden">
                  <div className="h-full w-[62%] rounded-full bg-[var(--accent)]" />
                </div>
              </div>

              {/* Subnote */}
              <div className="text-[11px] font-mono text-[var(--muted)] dark:text-slate-400 pt-1 flex items-center justify-between border-t border-slate-200/40 dark:border-slate-700/40">
                <span>RAG Retrieval Accuracy: 98.4%</span>
                <span className="text-[var(--accent)] font-semibold">Verified AST</span>
              </div>
            </aside>
          </div>
        </div>

        {/* Bottom Signature Stats Row & Meet CodeChat AI Capsule */}
        <div className="mt-auto px-6 sm:px-12 py-8 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Stats */}
          <div className="flex items-center space-x-6 sm:space-x-10 text-left">
            <div className="flex items-baseline space-x-3">
              <span className="text-4xl sm:text-6xl font-extralight text-[var(--ink)] dark:text-white">112+</span>
              <span className="text-xs text-[#39455F] dark:text-slate-300 leading-tight">
                Codebases<br />Indexed<br />Globally
              </span>
            </div>

            {/* Diagonal Slash Divider */}
            <div className="w-6 h-14 bg-gradient-to-tr from-transparent via-[#A7B4C6] to-transparent dark:via-slate-600 rotate-12" />

            <div className="flex items-baseline space-x-3">
              <span className="text-4xl sm:text-6xl font-extralight text-[var(--ink)] dark:text-white">55K+</span>
              <span className="text-xs text-[#39455F] dark:text-slate-300 leading-tight">
                AST Chunks<br />Indexed
              </span>
            </div>
          </div>

          {/* Meet CodeChat AI Pill */}
          <Link
            to="/login"
            className="w-full md:w-auto px-4 py-3 rounded-full glass-card-luxury hover:border-[var(--accent)] transition-all flex items-center justify-between space-x-4 group active:scale-95 shadow-lg"
          >
            <div className="w-12 h-12 rounded-full overflow-hidden shadow-inner flex-shrink-0">
              <img src={VIDEO_POSTER} alt="CodeChat Sphere" className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <span className="block text-sm font-semibold text-[#1B2A44] dark:text-white">Meet CodeChat AI</span>
              <span className="text-[11px] text-[var(--muted)] dark:text-slate-400">Launch Code Chatbot</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[var(--meet-knob)] dark:bg-[#384B64] flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform flex-shrink-0">
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* Footer Bar */}
        <footer className="px-6 sm:px-12 py-4 text-center text-xs text-[var(--muted2)] dark:text-slate-400 font-mono flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200/40 dark:border-slate-800/50">
          <span>CodeChat AI — Grounded Codebase RAG Platform</span>
          <span>Crafted with precision by <strong className="font-semibold text-[var(--ink)] dark:text-white">Saurabh</strong></span>
        </footer>
      </div>

      {/* Luxury Install Guide Modal */}
      <InstallGuideModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isNativeSupported={!!(window.deferredPrompt || deferredPrompt)}
        onNativeInstall={() => {
          const promptEvent = window.deferredPrompt || deferredPrompt;
          if (promptEvent) {
            promptEvent.prompt();
          }
        }}
      />
    </div>
  );
};

export default LandingPage;
