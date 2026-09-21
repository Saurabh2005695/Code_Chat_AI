import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  Network, 
  FileText, 
  BarChart2, 
  Plus, 
  ChevronDown,
  FolderGit2,
  Search,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRepo } from '../../context/RepoContext';
import AddRepoModal from '../repo/AddRepoModal';
import UserProfileModal from '../profile/UserProfileModal';
import ThemeToggle from '../common/ThemeToggle';
import CommandPalette from './CommandPalette';

const Navbar = () => {
  const { user } = useAuth();
  const { repositories, activeRepo, selectRepo } = useRepo();
  const location = useLocation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRepoDropdownOpen, setIsRepoDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const navLinks = [
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Architecture', path: '/graph', icon: Network },
    { name: 'Benchmarks', path: '/eval', icon: BarChart2 },
    { name: 'Docs', path: '/docs', icon: FileText },
  ];

  const userInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U');

  return (
    <>
      <header className="h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/75 dark:bg-[#070B14]/85 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-50 transition-colors duration-200">
        {/* Brand & Active Repo Selector */}
        <div className="flex items-center space-x-3 sm:space-x-5">
          <Link to="/dashboard" className="flex items-center space-x-2.5 group">
            {/* ConSentinel Striped Globe Mark */}
            <svg className="w-8 h-8 group-hover:scale-105 transition-transform" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <defs>
                <clipPath id="gclip-nav"><circle cx="20" cy="20" r="18.2"/></clipPath>
              </defs>
              <circle cx="20" cy="20" r="18.4" stroke="#0d1b30" className="dark:stroke-[#96A6C4]" strokeWidth="1.1"/>
              <g clipPath="url(#gclip-nav)" stroke="#0d1b30" className="dark:stroke-[#F0F4FA]" fill="none" strokeLinecap="round" strokeLinejoin="round">
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
            <span className="font-extrabold text-base tracking-tight text-[var(--ink)] dark:text-white hidden sm:flex items-center space-x-1.5">
              <span>CodeChat</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-mono font-bold border border-[var(--accent)]/30">SENTINEL</span>
            </span>
          </Link>

          {/* Repo Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsRepoDropdownOpen(!isRepoDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-full glass-pill text-xs sm:text-sm hover:border-[var(--accent)] transition-all shadow-xs active:scale-95"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" />
              <span className="font-medium max-w-[90px] sm:max-w-[150px] md:max-w-[180px] truncate text-[var(--ink)] dark:text-white">
                {activeRepo ? activeRepo.name : 'Select Repo'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-[var(--muted)] transition-transform duration-200 ${isRepoDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isRepoDropdownOpen && (
              <>
                {/* Backdrop to dismiss dropdown on outside click */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsRepoDropdownOpen(false)} 
                />

                <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-[24px] glass-panel-luxury p-2 z-50 animate-in fade-in-0 zoom-in-95 duration-150 shadow-2xl">
                  <div className="px-3 py-2 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] font-mono">Repositories</span>
                    <span className="text-[11px] text-[var(--muted2)] dark:text-slate-400 font-mono">{repositories.length} Total</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto p-1 space-y-1 mt-1">
                    {repositories.length === 0 ? (
                      <div className="text-xs text-[var(--muted)] p-4 text-center font-mono">
                        No indexed repositories yet. Connect one below.
                      </div>
                    ) : (
                      repositories.map((repo) => {
                        const isSelected = activeRepo?.id === repo.id;
                        return (
                          <button
                            key={repo.id}
                            onClick={() => {
                              selectRepo(repo);
                              setIsRepoDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm flex items-center justify-between transition-all ${
                              isSelected
                                ? 'bg-[var(--cta)] text-white font-semibold shadow-md'
                                : 'text-[var(--ink)] dark:text-slate-200 hover:bg-white/60 dark:hover:bg-[#1A2B45]/60'
                            }`}
                          >
                            <div className="flex items-center space-x-2 truncate pr-2">
                              <FolderGit2 className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-white' : 'text-[var(--accent)]'}`} />
                              <span className="truncate">{repo.name}</span>
                            </div>

                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                              isSelected 
                                ? 'bg-white/20 text-white' 
                                : repo.status === 'ready'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}>
                              {repo.status}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="border-t border-slate-200/50 dark:border-slate-700/50 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setIsRepoDropdownOpen(false);
                        setIsAddModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 text-xs font-semibold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Connect New Repository</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Navigation Tabs (Desktop / Tablet) */}
        <nav className="hidden md:flex items-center space-x-1 glass-pill p-1 rounded-full text-xs font-semibold text-[#202940] dark:text-slate-200 shadow-xs">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-2 px-4 py-1.5 rounded-full transition-all ${
                  isActive
                    ? 'bg-[var(--cta)] text-white shadow-sm'
                    : 'hover:text-[var(--accent)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons & Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Command Palette Trigger */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full glass-pill text-xs text-[var(--muted2)] dark:text-slate-400 hover:border-[var(--accent)] transition-colors"
            title="Command Palette (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
            <kbd className="font-mono text-[10px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[var(--ink)] dark:text-slate-200">Ctrl K</kbd>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="hidden sm:flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-[var(--cta)] dark:bg-[#1A2B45] hover:bg-[#162744] text-white text-xs font-semibold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Repo</span>
          </button>

          {/* Clickable Profile Pill */}
          <div className="pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center space-x-2 p-1 sm:px-2.5 sm:py-1 rounded-full glass-pill hover:border-[var(--accent)] transition-all group active:scale-95"
              title="User Profile & Settings"
            >
              <div className="w-7 h-7 rounded-full bg-[var(--cta)] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {userInitial}
              </div>
              <div className="hidden sm:flex flex-col text-left pr-1">
                <span className="text-xs font-semibold text-[var(--ink)] dark:text-white group-hover:text-[var(--accent)] truncate max-w-[90px]">
                  {user?.full_name || 'Profile'}
                </span>
                <span className="text-[10px] text-[var(--muted)] leading-none font-mono">Settings</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Modals */}
      {isAddModalOpen && <AddRepoModal onClose={() => setIsAddModalOpen(false)} />}
      <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenAddRepo={() => setIsAddModalOpen(true)}
      />
    </>
  );
};

export default Navbar;
