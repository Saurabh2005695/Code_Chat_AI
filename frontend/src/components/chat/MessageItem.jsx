import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Copy, Check, BookOpen } from 'lucide-react';
import CitationPill from './CitationPill';
import { useTheme } from '../../context/ThemeContext';

const MessageItem = ({ message, onCitationClick }) => {
  const isUser = message.role === 'user';
  const { theme } = useTheme();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`py-4 sm:py-5 px-4 sm:px-6 rounded-[28px] transition-all ${
      isUser 
        ? 'glass-pill ml-auto max-w-2xl border-slate-200/80 dark:border-slate-700' 
        : 'glass-panel-luxury shadow-lg'
    }`}>
      <div className="flex items-start space-x-3.5 max-w-4xl mx-auto">
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
          isUser
            ? 'bg-[var(--cta)] text-white'
            : 'bg-white dark:bg-[#1A2B45] text-[var(--accent)] border border-white/60 dark:border-slate-700'
        }`}>
          {isUser ? (
            <User className="w-4 h-4" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 30 39" fill="none" stroke="currentColor">
              <path d="M15 1.2 1.6 6.6v13.1c0 6.6 5.1 12.6 13.4 17.9 8.3-5.3 13.4-11.3 13.4-17.9V6.6z" strokeWidth="2.2" strokeLinejoin="round"/>
            </svg>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[var(--muted2)] dark:text-slate-300 font-mono">
              {isUser ? 'Developer' : 'Sentinel Assistant'}
            </span>
            {!isUser && message.content && (
              <button
                onClick={handleCopy}
                className="text-[var(--muted)] hover:text-[var(--ink)] dark:hover:text-white text-xs flex items-center space-x-1 p-1 rounded-full hover:bg-white/40 dark:hover:bg-slate-800 transition-colors"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline font-mono">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          {/* Citations section */}
          {!isUser && message.citations && message.citations.length > 0 && (
            <div className="mb-4 p-3 rounded-2xl bg-white/60 dark:bg-[#181C26]/70 border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
              <div className="flex items-center space-x-1.5 text-xs font-mono font-semibold text-[var(--accent)] mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Verified AST Citations ({message.citations.length})</span>
              </div>
              <div className="flex flex-wrap items-center">
                {message.citations.map((c, idx) => (
                  <CitationPill
                    key={`${c.file_path}-${c.start_line}-${idx}`}
                    citation={c}
                    onClick={onCitationClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Markdown Content */}
          <div className="prose dark:prose-invert text-sm max-w-none text-[var(--ink)] dark:text-slate-100 leading-relaxed break-words font-sans">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <div className="rounded-2xl overflow-hidden my-3 border border-slate-200 dark:border-slate-800 shadow-lg">
                      <div className="bg-slate-900 px-4 py-1.5 text-[11px] font-mono text-slate-400 border-b border-slate-800 flex justify-between items-center">
                        <span className="font-semibold text-slate-200">{match[1]}</span>
                      </div>
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{
                          margin: 0,
                          padding: '1.1rem',
                          background: '#0B0F19',
                          fontSize: '0.85rem'
                        }}
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code className="px-2 py-0.5 rounded-md bg-white/70 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-[var(--accent)] font-mono text-xs font-semibold" {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
