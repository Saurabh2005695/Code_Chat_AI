import React from 'react';
import { FileCode, ExternalLink } from 'lucide-react';

const CitationPill = ({ citation, onClick }) => {
  const fileName = citation.file_path.split('/').pop();

  return (
    <button
      onClick={() => onClick(citation)}
      className="inline-flex items-center space-x-1.5 px-2.5 py-1 my-1 mr-1.5 rounded-lg bg-[var(--bg-surface)] border border-brand-500/40 hover:border-brand-500 hover:bg-brand-500/10 text-[var(--text-primary)] text-xs font-mono transition-all group shadow-sm active:scale-95"
      title={`Open ${citation.file_path} (Lines ${citation.start_line}-${citation.end_line})`}
    >
      <FileCode className="w-3.5 h-3.5 text-brand-500 group-hover:scale-110 transition-transform flex-shrink-0" />
      <span className="font-medium text-[var(--text-primary)]">{fileName}</span>
      <span className="text-[var(--text-tertiary)] text-[11px]">
        :L{citation.start_line}-L{citation.end_line}
      </span>
      <ExternalLink className="w-3 h-3 text-[var(--text-tertiary)] group-hover:text-brand-500 ml-0.5 flex-shrink-0" />
    </button>
  );
};

export default CitationPill;
