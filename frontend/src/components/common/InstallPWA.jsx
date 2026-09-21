import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already installed in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  if (!isInstallable || dismissed) return null;

  return (
    <div className="fixed top-18 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm">
      <div className="flex items-center space-x-3 p-3 bg-slate-900/95 dark:bg-[#0F172A]/95 text-white rounded-2xl border border-indigo-500/40 shadow-2xl backdrop-blur-xl">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0 pr-1">
          <h4 className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
            Install CodeChat AI
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">APP</span>
          </h4>
          <p className="text-[11px] text-slate-300 truncate">Add to phone home screen</p>
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleInstallClick}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
