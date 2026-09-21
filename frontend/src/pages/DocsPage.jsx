import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText, Sparkles, Loader2, Copy, Check, FolderGit2 } from 'lucide-react';
import api from '../services/api';
import { useRepo } from '../context/RepoContext';

const DocsPage = () => {
  const { activeRepo } = useRepo();
  const [loading, setLoading] = useState(false);
  const [docData, setDocData] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!activeRepo) return;
    setLoading(true);

    try {
      const res = await api.post(`/repos/${activeRepo.id}/generate-readme`);
      setDocData(res.data);
    } catch (err) {
      console.error('Failed to generate docs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (docData?.readme_markdown) {
      navigator.clipboard.writeText(docData.readme_markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!activeRepo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--frame)] dark:bg-[#070B14]">
        <FolderGit2 className="w-16 h-16 text-[var(--muted)] mb-4" />
        <h3 className="text-xl font-light text-[var(--ink)] dark:text-white mb-2">No Active Repository</h3>
        <p className="text-sm text-[var(--muted2)] dark:text-slate-400 max-w-sm font-mono">
          Please select an indexed repository from the navigation bar to generate automated architecture documentation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-5xl mx-auto w-full pb-24 md:pb-8 bg-[var(--frame)] dark:bg-[#070B14] transition-colors duration-200">
      <div className="p-6 sm:p-8 rounded-[32px] glass-panel-luxury shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[var(--accent)] font-mono text-xs font-semibold uppercase mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Architecture & Onboarding</span>
          </div>
          <h2 className="text-2xl font-light text-[var(--ink)] dark:text-white">
            Automated <span className="font-semibold text-[var(--accent)]">Documentation</span>
          </h2>
          <p className="text-xs text-[var(--muted2)] dark:text-slate-300 mt-1">
            Synthesize all AST symbols, modules, and file metadata for <span className="font-mono text-[var(--accent)] font-semibold">{activeRepo.name}</span>.
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          {docData && (
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-full glass-pill text-xs font-semibold transition-all active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span className="font-mono">{copied ? 'Copied' : 'Copy Markdown'}</span>
            </button>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || activeRepo.status !== 'ready'}
            className="flex items-center space-x-2 px-6 py-2.5 bg-[var(--cta)] dark:bg-[#1A2B45] hover:bg-[#162744] text-white font-semibold rounded-full text-xs shadow-lg transition-all disabled:opacity-50 active:scale-95"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Generate README</span>
          </button>
        </div>
      </div>

      {docData ? (
        <div className="p-6 sm:p-10 rounded-[32px] glass-panel-luxury shadow-xl text-[var(--ink)] dark:text-slate-100 prose dark:prose-invert max-w-none text-left">
          <ReactMarkdown>{docData.readme_markdown}</ReactMarkdown>
        </div>
      ) : (
        <div className="p-16 text-center rounded-[32px] glass-panel-luxury border-dashed">
          <FileText className="w-12 h-12 text-[var(--muted)] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[var(--ink)] dark:text-white mb-1">No Documentation Generated Yet</h3>
          <p className="text-xs text-[var(--muted2)] dark:text-slate-400 max-w-md mx-auto mb-4 font-mono">
            Click the "Generate README" button above to synthesize all AST symbols, modules, and file metadata into a complete onboarding guide.
          </p>
        </div>
      )}
    </div>
  );
};

export default DocsPage;
