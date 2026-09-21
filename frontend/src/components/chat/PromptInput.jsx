import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Square, ChevronRight } from 'lucide-react';

const PromptInput = ({ onSend, onStop, disabled, isStreaming }) => {
  const [query, setQuery] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || disabled || isStreaming) return;
    onSend(query.trim());
    setQuery('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative rounded-[28px] glass-panel-luxury p-2.5 flex items-end shadow-2xl focus-within:ring-2 focus-within:ring-[var(--accent)] transition-all">
        <textarea
          ref={textareaRef}
          rows={1}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about this codebase in English or Hinglish... (e.g. 'Where is auth handled?')"
          disabled={disabled || isStreaming}
          className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-[var(--ink)] dark:text-white placeholder-[var(--muted)] text-base sm:text-sm px-4 py-2 resize-none max-h-44 disabled:opacity-50"
        />

        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="w-10 h-10 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-md transition-all flex items-center justify-center flex-shrink-0 active:scale-95"
            title="Stop generation"
          >
            <Square className="w-4 h-4 fill-white" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!query.trim() || disabled}
            className="w-10 h-10 rounded-full bg-[var(--cta)] dark:bg-[#1A2B45] hover:bg-[#162744] text-white shadow-md transition-all disabled:opacity-30 flex items-center justify-center flex-shrink-0 active:scale-95"
            title="Send query"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between px-4 mt-2 text-[11px] text-[var(--muted)] font-mono">
        <span className="hidden sm:inline">Press <kbd className="px-1.5 py-0.5 rounded bg-white/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-white/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">Shift + Enter</kbd> for newline</span>
        <span className="sm:hidden">ConSentinel AST Engine</span>
        <span className="flex items-center space-x-1 text-[var(--accent)] font-semibold">
          <Sparkles className="w-3 h-3" />
          <span>Hybrid AST + BM25 RRF</span>
        </span>
      </div>
    </form>
  );
};

export default PromptInput;
