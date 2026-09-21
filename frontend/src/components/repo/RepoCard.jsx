import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderGit2, 
  Layers, 
  FileCode, 
  MessageSquare, 
  Trash2, 
  ExternalLink,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { useRepo } from '../../context/RepoContext';

const RepoCard = ({ repo }) => {
  const navigate = useNavigate();
  const { selectRepo, deleteRepo, activeRepo } = useRepo();

  const handleOpenChat = () => {
    selectRepo(repo);
    navigate('/chat');
  };

  const isSelected = activeRepo?.id === repo.id;

  return (
    <div className={`p-6 rounded-[28px] glass-card-luxury transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between ${
      isSelected 
        ? 'ring-2 ring-[var(--accent)] shadow-xl' 
        : 'hover:border-[var(--accent)]/50'
    }`}>
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-white/90 dark:bg-[#1A2B45] border border-white/60 dark:border-slate-700 flex items-center justify-center text-[var(--accent)] shadow-sm flex-shrink-0">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h4 
                className="text-base font-bold text-[var(--ink)] dark:text-white hover:text-[var(--accent)] transition-colors cursor-pointer truncate max-w-[160px] sm:max-w-[190px]" 
                onClick={handleOpenChat}
              >
                {repo.name}
              </h4>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-xs text-[var(--muted2)] dark:text-slate-400 capitalize font-mono">{repo.source_type}</span>
                {repo.source_url && (
                  <a
                    href={repo.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--muted)] hover:text-[var(--accent)]"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <span className={`text-[10px] px-2.5 py-1 rounded-full font-mono font-medium ${
            repo.status === 'ready' 
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : repo.status === 'failed'
              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse'
          }`}>
            {repo.status}
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5 p-3.5 rounded-2xl bg-white/50 dark:bg-[#181C26]/60 border border-slate-200/50 dark:border-slate-700/50 text-xs font-mono">
          <div className="flex items-center space-x-2 text-[var(--ink-soft)] dark:text-slate-300">
            <FileCode className="w-4 h-4 text-[var(--accent)]" />
            <span>{repo.total_files} Files</span>
          </div>
          <div className="flex items-center space-x-2 text-[var(--ink-soft)] dark:text-slate-300">
            <Layers className="w-4 h-4 text-[var(--accent)]" />
            <span>{repo.total_chunks} Chunks</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200/40 dark:border-slate-700/40">
        <div className="flex items-center space-x-1.5 text-[11px] text-[var(--muted)] font-mono">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(repo.created_at).toLocaleDateString()}</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => deleteRepo(repo.id)}
            title="Delete repository"
            className="p-2 rounded-full text-[var(--muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenChat}
            disabled={repo.status !== 'ready'}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-[var(--cta)] dark:bg-[#1A2B45] hover:bg-[#162744] text-white text-xs font-semibold shadow-md transition-all disabled:opacity-40 active:scale-95"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepoCard;
