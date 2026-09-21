import React, { useEffect, useState, useRef } from 'react';
import { X, FileCode, Sparkles, Copy, Check, Loader2, Info, ChevronRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const CodeViewerModal = ({ repoId, filePath, highlightStart, highlightEnd, onClose }) => {
  const { theme } = useTheme();
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [explaining, setExplaining] = useState(false);
  const codeContainerRef = useRef(null);

  useEffect(() => {
    const fetchFile = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/repos/${repoId}/file`, {
          params: { path: filePath }
        });
        setFileData(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load file content.');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [repoId, filePath]);

  const handleCopy = () => {
    if (fileData?.content) {
      navigator.clipboard.writeText(fileData.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExplain = async () => {
    if (!fileData) return;
    setExplaining(true);
    setExplanation('');

    const lines = fileData.content.split('\n');
    const snippet = lines.slice((highlightStart || 1) - 1, highlightEnd || lines.length).join('\n');

    try {
      const res = await api.post(`/repos/${repoId}/explain-symbol`, {
        file_path: filePath,
        start_line: highlightStart || 1,
        end_line: highlightEnd || lines.length,
        code_snippet: snippet
      });
      setExplanation(res.data.explanation);
    } catch (err) {
      setExplanation('Failed to generate explanation. Please try again.');
    } finally {
      setExplaining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full h-full sm:h-[88vh] sm:max-w-5xl sm:rounded-[32px] glass-panel-luxury shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="h-16 border-b border-slate-200/50 dark:border-slate-800/60 px-6 flex items-center justify-between flex-shrink-0 bg-white/40 dark:bg-black/20">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[var(--accent)]/15 flex items-center justify-center text-[var(--accent)] flex-shrink-0">
              <FileCode className="w-4 h-4" />
            </div>
            <div className="truncate text-left">
              <span className="font-mono text-xs sm:text-sm text-[var(--ink)] dark:text-white font-semibold truncate">{filePath}</span>
              {highlightStart && highlightEnd && (
                <span className="ml-2 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 font-semibold">
                  L{highlightStart}-L{highlightEnd}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={handleExplain}
              disabled={explaining || loading}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-[var(--cta)] dark:bg-[#1A2B45] hover:bg-[#162744] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 active:scale-95"
            >
              {explaining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Explain with AI</span>
              <span className="sm:hidden">Explain</span>
            </button>

            <button
              onClick={handleCopy}
              className="p-2 rounded-full text-[var(--muted)] hover:text-[var(--ink)] dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800 transition-colors"
              title="Copy entire file"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-[var(--muted)] hover:text-[var(--ink)] dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Main Code View */}
          <div ref={codeContainerRef} className="flex-1 overflow-auto bg-[#070B14] p-4 sm:p-6 font-mono text-xs text-slate-100">
            {loading && (
              <div className="h-full flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
                <span className="text-xs text-slate-400 font-mono">Loading source code...</span>
              </div>
            )}

            {error && (
              <div className="p-4 text-rose-400 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-xs">
                {error}
              </div>
            )}

            {fileData && (
              <SyntaxHighlighter
                language={fileData.language || 'text'}
                style={vscDarkPlus}
                showLineNumbers={true}
                wrapLines={true}
                lineProps={(lineNumber) => {
                  const isHighlighted =
                    highlightStart &&
                    highlightEnd &&
                    lineNumber >= highlightStart &&
                    lineNumber <= highlightEnd;
                  return {
                    style: {
                      display: 'block',
                      backgroundColor: isHighlighted ? 'rgba(74, 120, 176, 0.32)' : 'transparent',
                      borderLeft: isHighlighted ? '3px solid #4A78B0' : '3px solid transparent',
                      paddingLeft: '6px'
                    }
                  };
                }}
                customStyle={{
                  margin: 0,
                  background: 'transparent',
                  padding: 0
                }}
              >
                {fileData.content}
              </SyntaxHighlighter>
            )}
          </div>

          {/* AI Explanation Drawer */}
          {explanation && (
            <aside className="w-full md:w-[380px] lg:w-[420px] max-h-[40vh] md:max-h-full border-t md:border-t-0 md:border-l border-slate-200/50 dark:border-slate-800/60 glass-panel-luxury p-5 sm:p-6 overflow-y-auto flex flex-col flex-shrink-0 shadow-2xl text-left">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center space-x-2 text-xs font-bold font-mono uppercase tracking-wider text-[var(--accent)]">
                  <Info className="w-4 h-4" />
                  <span>AI Code Explanation</span>
                </div>
                <button
                  onClick={() => setExplanation('')}
                  className="p-1 rounded-full text-[var(--muted)] hover:text-[var(--ink)] dark:hover:text-white"
                  title="Close explanation"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="prose dark:prose-invert prose-xs text-[var(--ink)] dark:text-slate-100 leading-relaxed max-w-none font-sans">
                <ReactMarkdown>{explanation}</ReactMarkdown>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeViewerModal;
