import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import { Bot, Sparkles } from 'lucide-react';

const SUGGESTED_QUERIES = [
  "Explain the overall architecture and main entry point.",
  "Where and how is user authentication implemented?",
  "How does database connection and migration work?",
  "Show me all API endpoints defined in this project."
];

const MessageList = ({ messages, onCitationClick, onSelectSuggestion, isStreaming }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-2xl mx-auto my-auto">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white mb-5 shadow-lg shadow-brand-500/20">
          <Bot className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-2">How can I help with this codebase?</h3>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-6 max-w-md">
          Ask questions in natural English or Hindi/Hinglish. I'll search code chunks with hybrid vector retrieval and cite exact source lines.
        </p>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
          {SUGGESTED_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onSelectSuggestion(q)}
              className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-brand-500 hover:bg-[var(--bg-surface-hover)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-start space-x-2.5 shadow-sm group active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <span>{q}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
      {messages.map((msg, index) => (
        <MessageItem
          key={msg.id || index}
          message={msg}
          onCitationClick={onCitationClick}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
