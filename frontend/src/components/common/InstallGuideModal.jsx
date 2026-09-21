import React from 'react';
import { X, Smartphone, CheckCircle, Download, ExternalLink, ArrowUpRight, Share2, MoreVertical } from 'lucide-react';

const InstallGuideModal = ({ isOpen, onClose, onNativeInstall, isNativeSupported }) => {
  if (!isOpen) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-[28px] glass-panel-luxury p-6 relative shadow-2xl border border-white/20 dark:border-slate-700/60 bg-white/95 dark:bg-[#0E1526]/95 text-[var(--ink)] dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center space-x-3.5 mb-5">
          <img 
            src="/icon-192.jpg" 
            alt="CodeChat AI" 
            className="w-12 h-12 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700" 
          />
          <div>
            <h3 className="text-base font-bold tracking-tight">Install CodeChat AI</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Run like a native mobile app</p>
          </div>
        </div>

        {/* Native 1-Click Install Button if supported */}
        {isNativeSupported && (
          <div className="mb-4">
            <button
              onClick={() => {
                onNativeInstall();
                onClose();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-[var(--cta)] dark:bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Click to Install Now</span>
            </button>
          </div>
        )}

        {/* Platform Specific Steps */}
        <div className="space-y-3 text-left">
          {isIOS ? (
            <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs mb-2">
                <Share2 className="w-4 h-4" />
                <span>iPhone / iPad (Safari) Instructions:</span>
              </div>
              <ol className="text-xs space-y-2 text-slate-700 dark:text-slate-300">
                <li className="flex items-start space-x-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</span>
                  <span>Safari me bottom bar me <strong>Share Icon (📤)</strong> dabayein.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</span>
                  <span>Scroll karke <strong>"Add to Home Screen"</strong> par tap karein.</span>
                </li>
              </ol>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs mb-2">
                <MoreVertical className="w-4 h-4" />
                <span>Android (Chrome / Brave / Edge) Instructions:</span>
              </div>
              <ol className="text-xs space-y-2 text-slate-700 dark:text-slate-300">
                <li className="flex items-start space-x-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</span>
                  <span>Browser ke upar right side me <strong>3-Dots (⋮) Menu</strong> dabayein.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</span>
                  <span><strong>"Install app"</strong> ya <strong>"Add to Home screen"</strong> par tap karein.</span>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Benefits list */}
        <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <div className="flex items-center space-x-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Full-Screen Mode</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Offline Caching</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>App Icon on Mobile</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Faster Performance</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallGuideModal;
