import React, { useState } from 'react';
import { Plus, FolderGit2, Search, Sparkles, Layers, Cpu, ExternalLink, ShieldCheck } from 'lucide-react';
import { useRepo } from '../context/RepoContext';
import RepoCard from '../components/repo/RepoCard';
import AddRepoModal from '../components/repo/AddRepoModal';

const DashboardPage = () => {
  const { repositories, loading } = useRepo();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredRepos = repositories.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.source_url && r.source_url.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 max-w-7xl mx-auto w-full pb-24 md:pb-8 bg-[var(--frame)] dark:bg-[#070B14] transition-colors duration-200">
      {/* Top Banner with Frosted Glass Styling */}
      <div className="p-6 sm:p-10 rounded-[32px] glass-panel-luxury relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full glass-pill text-xs font-mono font-medium text-[var(--accent)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ConSentinel Workspace</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-[var(--ink)] dark:text-white leading-tight">
            Indexed <span className="font-semibold text-[var(--accent)]">Repositories</span>
          </h1>

          <p className="text-sm sm:text-base text-[var(--muted2)] dark:text-slate-300 leading-relaxed max-w-xl font-normal">
            Connect any public or private GitHub repository or upload a ZIP archive. ConSentinel parses syntax boundaries with Tree-Sitter, prepares ChromaDB vector indices, and enables sub-second verifiable code chat.
          </p>

          <div className="pt-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 px-6 py-3 rounded-full bg-[var(--cta)] dark:bg-[#1A2B45] hover:bg-[#162744] text-white font-semibold text-xs sm:text-sm shadow-xl transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Connect Repository / Upload ZIP</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search repositories..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full glass-card-luxury text-xs sm:text-sm text-[var(--ink)] dark:text-white placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-all shadow-xs"
          />
        </div>
        <div className="text-xs text-[var(--muted)] font-mono self-end sm:self-center">
          Active Codebases: <span className="font-bold text-[var(--ink)] dark:text-white">{repositories.length}</span>
        </div>
      </div>

      {/* Repositories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-52 rounded-[28px] glass-card-luxury animate-pulse" />
          ))}
        </div>
      ) : filteredRepos.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-[32px] glass-panel-luxury border-dashed">
          <FolderGit2 className="w-12 h-12 text-[var(--muted)] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[var(--ink)] dark:text-white mb-1">No Repositories Found</h3>
          <p className="text-xs text-[var(--muted)] max-w-sm mx-auto mb-4 font-mono">
            {search ? 'No repositories match your filter.' : 'Connect your first GitHub repository to start chatting.'}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-[var(--cta)] dark:bg-[#1A2B45] text-white text-xs font-semibold rounded-full shadow-md transition-all active:scale-95"
          >
            Connect Repository
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRepos.map(repo => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}

      {isModalOpen && <AddRepoModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default DashboardPage;
