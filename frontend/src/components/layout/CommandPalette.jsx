import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  MessageSquare, 
  Network, 
  BarChart2, 
  FileText, 
  Plus, 
  FolderGit2, 
  Sun, 
  Moon, 
  X,
  Sparkles
} from 'lucide-react';
import { useRepo } from '../../context/RepoContext';
import { useTheme } from '../../context/ThemeContext';

const CommandPalette = ({ isOpen, onClose, onOpenAddRepo }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { repositories, selectRepo } = useRepo();
  const { theme, toggleTheme } = useTheme();

  // Handle Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onClose ? onClose(!isOpen) : null;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { label: 'Chat with Codebase', icon: MessageSquare, action: () => { navigate('/chat'); onClose(); } },
    { label: 'Architecture Dependency Graph', icon: Network, action: () => { navigate('/graph'); onClose(); } },
    { label: 'RAG Retrieval Evaluation', icon: BarChart2, action: () => { navigate('/eval'); onClose(); } },
    { label: 'Technical Documentation', icon: FileText, action: () => { navigate('/docs'); onClose(); } },
    { label: 'Connect New Repository', icon: Plus, action: () => { onClose(); onOpenAddRepo && onOpenAddRepo(); } },
    { label: `Toggle Theme (${theme === 'dark' ? 'Light Mode' : 'Dark Mode'})`, icon: theme === 'dark' ? Sun : Moon, action: () => { toggleTheme(); onClose(); } },
  ];

  const filteredActions = actions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()));
  const filteredRepos = repositories.filter(r => r.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="p-3.5 border-b border-slate-200 dark:border-dark-700 flex items-center space-x-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Type a command or search repositories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List Items */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {/* Navigation & Commands */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              Navigation & Actions
            </div>
            <div className="space-y-0.5">
              {filteredActions.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={item.action}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-dark-800 hover:text-brand-600 dark:hover:text-brand-400 transition-colors text-left"
                  >
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-brand-500" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Repositories */}
          {filteredRepos.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 border-t border-slate-100 dark:border-dark-800 pt-2">
                Switch Repository
              </div>
              <div className="space-y-0.5">
                {filteredRepos.map(repo => (
                  <button
                    key={repo.id}
                    onClick={() => {
                      selectRepo(repo);
                      navigate('/chat');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-dark-800 hover:text-brand-600 dark:hover:text-brand-400 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <FolderGit2 className="w-4 h-4 text-brand-500 flex-shrink-0" />
                      <span className="truncate">{repo.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{repo.total_files} files</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-dark-800 bg-slate-50 dark:bg-dark-950/60 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Navigate with mouse or keyboard</span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-dark-800 text-slate-600 dark:text-slate-300">ESC to close</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
