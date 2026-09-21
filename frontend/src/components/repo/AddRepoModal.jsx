import React, { useState } from 'react';
import { X, Github, Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useRepo } from '../../context/RepoContext';

const AddRepoModal = ({ onClose }) => {
  const { fetchRepositories, selectRepo } = useRepo();
  const [tab, setTab] = useState('github');
  const [githubUrl, setGithubUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [zipFile, setZipFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleGithubSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/repos/index-github', {
        github_url: githubUrl,
        branch: branch || 'main'
      });
      await fetchRepositories();
      selectRepo(res.data);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to connect repository. Make sure URL is public and valid.');
    } finally {
      setLoading(false);
    }
  };

  const handleZipSubmit = async (e) => {
    e.preventDefault();
    if (!zipFile) {
      setError('Please select a ZIP file');
      return;
    }

    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('file', zipFile);

    try {
      const res = await api.post('/repos/upload-zip', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchRepositories();
      selectRepo(res.data);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload ZIP file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-[32px] glass-panel-luxury p-8 relative animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[var(--muted)] hover:text-[var(--ink)] dark:hover:text-white p-2 rounded-full hover:bg-white/40 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-2xl font-light text-[var(--ink)] dark:text-white mb-1">Connect <span className="font-semibold text-[var(--accent)]">Repository</span></h3>
        <p className="text-xs text-[var(--muted2)] dark:text-slate-300 mb-6 font-mono">
          Index codebase for AST semantic search & verifiable citations.
        </p>

        {/* Tab selector */}
        <div className="flex rounded-full glass-pill p-1 mb-6">
          <button
            onClick={() => { setTab('github'); setError(''); }}
            className={`flex-1 py-2 rounded-full text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              tab === 'github'
                ? 'bg-[var(--cta)] text-white shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--ink)] dark:hover:text-white'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>GitHub Repository</span>
          </button>
          <button
            onClick={() => { setTab('zip'); setError(''); }}
            className={`flex-1 py-2 rounded-full text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              tab === 'zip'
                ? 'bg-[var(--cta)] text-white shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--ink)] dark:hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload ZIP</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Repository connected! Indexing started in background...</span>
          </div>
        )}

        {tab === 'github' ? (
          <form onSubmit={handleGithubSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--muted2)] dark:text-slate-300 uppercase mb-2 font-mono">
                Public GitHub URL
              </label>
              <input
                type="url"
                required
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/facebook/react"
                className="w-full px-4 py-2.5 rounded-full glass-card-luxury text-[var(--ink)] dark:text-white placeholder-[var(--muted)] text-base sm:text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--muted2)] dark:text-slate-300 uppercase mb-2 font-mono">
                Branch (Optional)
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                className="w-full px-4 py-2.5 rounded-full glass-card-luxury text-[var(--ink)] dark:text-white placeholder-[var(--muted)] text-base sm:text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3.5 bg-[var(--cta)] dark:bg-[#1A2B45] hover:bg-[#162744] text-white font-semibold rounded-full text-sm shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-4 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting & Indexing...</span>
                </>
              ) : (
                <span>Start Indexing Codebase</span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleZipSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--muted2)] dark:text-slate-300 uppercase mb-2 font-mono">
                Select ZIP Archive (Max 50MB)
              </label>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[var(--accent)] rounded-2xl p-6 text-center bg-white/40 dark:bg-[#181C26]/40 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="zip-upload-input"
                />
                <label htmlFor="zip-upload-input" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-[var(--accent)] mx-auto mb-2" />
                  <p className="text-sm font-medium text-[var(--ink)] dark:text-white">
                    {zipFile ? zipFile.name : 'Click to select or drag & drop ZIP'}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-1 font-mono">.zip archives only</p>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !zipFile || success}
              className="w-full py-3.5 bg-[var(--cta)] dark:bg-[#1A2B45] hover:bg-[#162744] text-white font-semibold rounded-full text-sm shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-4 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading & Indexing...</span>
                </>
              ) : (
                <span>Upload & Index Codebase</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddRepoModal;
