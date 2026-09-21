import React, { useState, useEffect, useRef } from 'react';
import { Plus, MessageSquare, Trash2, FolderGit2, AlertCircle, Sparkles, Loader2, Menu, X, ChevronRight } from 'lucide-react';
import MessageList from './MessageList';
import PromptInput from './PromptInput';
import CodeViewerModal from '../code/CodeViewerModal';
import AddRepoModal from '../repo/AddRepoModal';
import IndexingProgress from '../repo/IndexingProgress';
import { useRepo } from '../../context/RepoContext';
import api from '../../services/api';
import { streamChatResponse } from '../../services/sse';

const VIDEO_POSTER = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260912_105822_bf7c2d53-9957-4521-bbbf-7c1ab7a70130.png";
const VIDEO_SRC = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260912_105953_21ad8049-9088-4a00-bad3-aee6b5575a2b.mp4";

const ChatWindow = () => {
  const { activeRepo, repositories, selectRepo, fetchRepositories } = useRepo();
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [error, setError] = useState('');
  const abortControllerRef = useRef(null);

  // Auto-select first repository if none is active but repos exist
  useEffect(() => {
    if (!activeRepo && repositories.length > 0) {
      selectRepo(repositories[0]);
    }
  }, [activeRepo, repositories, selectRepo]);

  // Fetch chat sessions whenever active repo changes
  useEffect(() => {
    if (!activeRepo) {
      setSessions([]);
      setActiveSessionId(null);
      setMessages([]);
      return;
    }

    const fetchSessions = async () => {
      try {
        const res = await api.get(`/chat/${activeRepo.id}/sessions`);
        setSessions(res.data);
        if (res.data.length > 0) {
          setActiveSessionId(res.data[0].id);
        } else {
          createNewSession(activeRepo.id);
        }
      } catch (err) {
        console.error('Error fetching sessions:', err);
      }
    };

    fetchSessions();
  }, [activeRepo?.id]);

  // Fetch messages when active session changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/chat/sessions/${activeSessionId}/messages`);
        setMessages(res.data);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchMessages();
  }, [activeSessionId]);

  const createNewSession = async (repoId = activeRepo?.id) => {
    if (!repoId) return null;
    try {
      const res = await api.post(`/chat/${repoId}/sessions`, { title: 'New Chat' });
      setSessions(prev => [res.data, ...prev.filter(s => s.id !== res.data.id)]);
      setActiveSessionId(res.data.id);
      setMessages([]);
      setIsMobileDrawerOpen(false);
      return res.data.id;
    } catch (err) {
      console.error('Error creating new session:', err);
      return null;
    }
  };

  const handleDeleteSession = async (sessionIdToDelete) => {
    try {
      await api.delete(`/chat/sessions/${sessionIdToDelete}`);
      setSessions(prev => {
        const updated = prev.filter(s => s.id !== sessionIdToDelete);
        if (activeSessionId === sessionIdToDelete) {
          if (updated.length > 0) {
            setActiveSessionId(updated[0].id);
          } else {
            setActiveSessionId(null);
            setMessages([]);
          }
        }
        return updated;
      });
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleSendMessage = async (query) => {
    if (!activeRepo || isStreaming) return;
    setError('');

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      currentSessionId = await createNewSession(activeRepo.id);
      if (!currentSessionId) {
        setError('Could not initialize chat session. Please refresh and try again.');
        return;
      }
    }

    const userMsg = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: query,
      citations: []
    };

    const assistantMsg = {
      id: `temp-assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      citations: []
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    let assistantContent = '';

    await streamChatResponse({
      sessionId: currentSessionId,
      query,
      onCitation: (citations) => {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'assistant') {
            last.citations = citations;
          }
          return updated;
        });
      },
      onToken: (token) => {
        assistantContent += token;
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'assistant') {
            last.content = assistantContent;
          }
          return updated;
        });
      },
      onComplete: () => {
        setIsStreaming(false);
      },
      onError: (err) => {
        setIsStreaming(false);
        setError(`Streaming error: ${err.message}`);
      }
    });
  };

  // If no repository is connected
  if (!activeRepo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto bg-[var(--frame)] dark:bg-[#070B14] transition-colors relative">
        <div className="w-16 h-16 rounded-[24px] glass-panel-luxury flex items-center justify-center text-[var(--accent)] mb-6 shadow-xl">
          <FolderGit2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-light text-[var(--ink)] dark:text-white mb-2">Connect a Codebase to Chat</h2>
        <p className="text-sm text-[var(--muted2)] dark:text-slate-400 mb-8 leading-relaxed">
          Index your code repository to chat with AST syntax awareness, hybrid vector retrieval, and exact line citations.
        </p>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-2 px-6 py-3.5 rounded-full bg-[var(--cta)] dark:bg-[#1A2B45] hover:bg-[#162744] text-white font-semibold text-sm shadow-xl transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Connect Repository / Upload ZIP</span>
        </button>

        {isAddModalOpen && <AddRepoModal onClose={() => setIsAddModalOpen(false)} />}
      </div>
    );
  }

  const isIndexing = activeRepo.status === 'indexing' || activeRepo.status === 'pending';

  return (
    <div className="flex-1 flex overflow-hidden w-full h-[calc(100dvh-4rem)] bg-[var(--frame)] dark:bg-[#070B14] transition-colors duration-200 relative">
      {/* Mobile Drawer Backdrop */}
      {isMobileDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      {/* Session Sidebar (Desktop + Mobile Slide Drawer) */}
      <aside className={`
        fixed top-16 bottom-0 left-0 z-40 w-72 glass-panel-luxury border-r border-slate-200/60 dark:border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out
        lg:static lg:w-64 lg:translate-x-0
        ${isMobileDrawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="p-3.5 border-b border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--muted)] font-mono uppercase tracking-wider">Conversations</span>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => createNewSession()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full glass-pill hover:bg-[var(--cta)] hover:text-white dark:hover:bg-[var(--cta)] text-[var(--ink)] dark:text-white text-xs font-semibold transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className="lg:hidden p-1.5 rounded-full text-[var(--muted)] hover:text-[var(--ink)] dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map(s => {
            const isActive = activeSessionId === s.id;
            return (
              <div
                key={s.id}
                className="group relative flex items-center"
              >
                <button
                  onClick={() => {
                    setActiveSessionId(s.id);
                    setIsMobileDrawerOpen(false);
                  }}
                  className={`w-full text-left p-2.5 pr-8 rounded-2xl text-xs flex items-center space-x-2.5 transition-all ${
                    isActive
                      ? 'bg-white/90 dark:bg-[#1A2B45] text-[var(--ink)] dark:text-white font-semibold shadow-sm border border-slate-200/80 dark:border-slate-700'
                      : 'text-[var(--muted2)] dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-[var(--ink)] dark:hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-[var(--accent)]" />
                  <span className="truncate flex-1">{s.title}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(s.id);
                  }}
                  title="Delete conversation"
                  className={`absolute right-2 p-1.5 rounded-full text-[var(--muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-all ${
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Active Repo Info Footer in Sidebar */}
        <div className="p-3 border-t border-slate-200/50 dark:border-slate-800/60 bg-white/40 dark:bg-black/20 text-xs">
          <div className="flex items-center space-x-2 text-[var(--ink)] dark:text-white font-medium truncate">
            <FolderGit2 className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" />
            <span className="truncate">{activeRepo.name}</span>
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-0.5 font-mono">
            {activeRepo.total_files} files • {activeRepo.total_chunks} chunks
          </div>
        </div>
      </aside>

      {/* Main Chat Container */}
      <main className="flex-1 flex flex-col bg-transparent overflow-hidden relative transition-colors">
        {/* Mobile Header Bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-2 border-b border-slate-200/60 dark:border-slate-800/80 glass-pill mx-2 my-1">
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex items-center space-x-2 text-xs font-semibold text-[var(--ink)] dark:text-white p-1"
          >
            <Menu className="w-4 h-4 text-[var(--accent)]" />
            <span>Chat History ({sessions.length})</span>
          </button>
          <button
            onClick={() => createNewSession()}
            className="flex items-center space-x-1 text-xs text-[var(--accent)] font-semibold px-2 py-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Live Indexing Progress Banner */}
        {isIndexing && (
          <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 glass-panel-luxury mx-4 my-2 rounded-2xl">
            <IndexingProgress repoId={activeRepo.id} onReady={() => fetchRepositories()} />
          </div>
        )}

        {error && (
          <div className="m-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <MessageList
          messages={messages}
          onCitationClick={(citation) => setSelectedCitation(citation)}
          onSelectSuggestion={(q) => handleSendMessage(q)}
          isStreaming={isStreaming}
        />

        {/* Chat input footer */}
        <div className="p-3 sm:p-4 bg-transparent max-w-4xl w-full mx-auto pb-20 md:pb-4">
          <PromptInput
            onSend={handleSendMessage}
            onStop={handleStopStreaming}
            disabled={isIndexing}
            isStreaming={isStreaming}
          />
        </div>
      </main>

      {/* Code Viewer Modal */}
      {selectedCitation && (
        <CodeViewerModal
          repoId={activeRepo.id}
          filePath={selectedCitation.file_path}
          highlightStart={selectedCitation.start_line}
          highlightEnd={selectedCitation.end_line}
          onClose={() => setSelectedCitation(null)}
        />
      )}

      {isAddModalOpen && <AddRepoModal onClose={() => setIsAddModalOpen(false)} />}
    </div>
  );
};

export default ChatWindow;
