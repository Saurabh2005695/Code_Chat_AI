import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  ShieldCheck, 
  FolderGit2, 
  Database, 
  LogOut, 
  Cpu, 
  Check, 
  Copy,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRepo } from '../../context/RepoContext';

const UserProfileModal = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { repositories, activeRepo } = useRepo();
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen) return null;

  const totalChunks = repositories.reduce((acc, r) => acc + (r.total_chunks || 0), 0);
  const totalFiles = repositories.reduce((acc, r) => acc + (r.total_files || 0), 0);

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleLogout = () => {
    onClose();
    logout();
  };

  const initials = user?.full_name 
    ? user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : (user?.email?.charAt(0).toUpperCase() || 'U');

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#181C26] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">Developer Profile</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Account overview & workspace analytics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* User Hero Banner */}
          <div className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#181C26] border border-slate-200 dark:border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 border-2 border-brand-400/40 flex items-center justify-center text-lg font-black text-white shadow-lg shadow-brand-500/20 flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {user?.full_name || 'Software Engineer'}
                </h4>
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified</span>
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#181C26] border border-slate-200 dark:border-slate-800 text-center">
              <div className="flex items-center justify-center text-brand-600 dark:text-brand-400 mb-1">
                <FolderGit2 className="w-4 h-4" />
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">{repositories.length}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Repositories</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#181C26] border border-slate-200 dark:border-slate-800 text-center">
              <div className="flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-1">
                <Database className="w-4 h-4" />
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">{totalChunks}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">AST Chunks</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#181C26] border border-slate-200 dark:border-slate-800 text-center">
              <div className="flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">{totalFiles}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Files Indexed</div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-2.5 rounded-2xl bg-slate-50 dark:bg-[#181C26] border border-slate-200 dark:border-slate-800 p-4 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400">Account ID:</span>
              <div className="flex items-center space-x-1.5 font-mono text-slate-800 dark:text-slate-200">
                <span>{user?.id ? `${user.id.substring(0, 12)}...` : 'N/A'}</span>
                {user?.id && (
                  <button 
                    onClick={handleCopyId}
                    className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    title="Copy full User ID"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400">Active Workspace:</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px]">
                {activeRepo?.name || 'None selected'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 dark:text-slate-400">RAG Engine:</span>
              <span className="text-brand-600 dark:text-brand-400 font-semibold flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Tree-Sitter AST + ChromaDB</span>
              </span>
            </div>
          </div>

          {/* Creator Credit */}
          <div className="text-center text-[11px] text-[var(--muted2)] dark:text-slate-400 font-mono">
            Crafted with precision by <strong className="font-semibold text-[var(--ink)] dark:text-white">Saurabh</strong>
          </div>

          {/* Logout Action Area */}
          <div className="pt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-semibold text-xs transition-all shadow-xs group active:scale-95"
            >
              <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Log Out of Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
