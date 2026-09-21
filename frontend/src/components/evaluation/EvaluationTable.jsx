import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, XCircle, Clock, Award, Target, BarChart2, Loader2, Plus, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useRepo } from '../../context/RepoContext';

const DEFAULT_TEST_CASES = [
  {
    query: "Where is user authentication and JWT validation implemented?",
    expected_files: ["auth.py", "security.py", "dependencies.py"]
  },
  {
    query: "How does the database connection and session management work?",
    expected_files: ["database.py", "models.py", "db.py"]
  },
  {
    query: "Where are the tree-sitter AST chunking and language detection rules defined?",
    expected_files: ["parser_service.py", "file_filters.py"]
  },
  {
    query: "Where is the hybrid retrieval and Reciprocal Rank Fusion implemented?",
    expected_files: ["rag_service.py", "vector_service.py", "bm25_service.py"]
  }
];

const EvaluationTable = () => {
  const { activeRepo } = useRepo();
  const [testCases, setTestCases] = useState(DEFAULT_TEST_CASES);
  const [loading, setLoading] = useState(false);
  const [currentRun, setCurrentRun] = useState(null);
  const [history, setHistory] = useState([]);
  const [newQuery, setNewQuery] = useState('');
  const [newExpected, setNewExpected] = useState('');

  const fetchHistory = async () => {
    if (!activeRepo) return;
    try {
      const res = await api.get(`/repos/${activeRepo.id}/eval/history`);
      setHistory(res.data);
      if (res.data.length > 0) {
        setCurrentRun(res.data[0]);
      }
    } catch (err) {
      console.error('Error loading eval history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [activeRepo?.id]);

  const handleRunEvaluation = async () => {
    if (!activeRepo || testCases.length === 0) return;
    setLoading(true);

    try {
      const res = await api.post(`/repos/${activeRepo.id}/eval/run`, {
        test_cases: testCases
      });
      setCurrentRun(res.data);
      fetchHistory();
    } catch (err) {
      console.error('Error running evaluation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTestCase = (e) => {
    e.preventDefault();
    if (!newQuery.trim() || !newExpected.trim()) return;

    const files = newExpected.split(',').map(s => s.trim()).filter(Boolean);
    setTestCases(prev => [...prev, { query: newQuery.trim(), expected_files: files }]);
    setNewQuery('');
    setNewExpected('');
  };

  const handleRemoveTestCase = (idx) => {
    setTestCases(prev => prev.filter((_, i) => i !== idx));
  };

  if (!activeRepo) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-[var(--muted)] font-mono">
        Please select a repository from the navbar to view evaluation benchmarks.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-6xl mx-auto w-full pb-24 md:pb-8 bg-[var(--frame)] dark:bg-[#070B14] transition-colors duration-200">
      {/* Header & Run Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-[32px] glass-panel-luxury shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-[var(--accent)] font-mono text-xs font-semibold uppercase">
            <BarChart2 className="w-4 h-4" />
            <span>Retrieval Quality Benchmark</span>
          </div>
          <h2 className="text-2xl font-light text-[var(--ink)] dark:text-white">
            Hybrid Search <span className="font-semibold text-[var(--accent)]">Precision & Latency</span>
          </h2>
          <p className="text-xs text-[var(--muted2)] dark:text-slate-300">
            Automated verification evaluating Precision@5, Mean Reciprocal Rank (MRR), and Dense+Sparse latency.
          </p>
        </div>

        <button
          onClick={handleRunEvaluation}
          disabled={loading || activeRepo.status !== 'ready'}
          className="flex items-center justify-center space-x-2 px-6 py-3.5 rounded-full bg-[var(--cta)] dark:bg-[#1A2B45] hover:bg-[#162744] text-white font-semibold text-xs sm:text-sm shadow-xl transition-all disabled:opacity-50 flex-shrink-0 active:scale-95"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
          <span>Run Retrieval Benchmark</span>
        </button>
      </div>

      {/* Metrics Cards */}
      {currentRun && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 rounded-[28px] glass-card-luxury text-left space-y-2">
            <div className="flex items-center justify-between text-[var(--muted)] text-xs font-mono font-semibold uppercase">
              <span>Precision @ 5</span>
              <Target className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-4xl font-extralight text-[var(--ink)] dark:text-white">
              {(currentRun.precision_at_5 * 100).toFixed(1)}%
            </div>
            <p className="text-[11px] text-[var(--muted2)] dark:text-slate-400 font-mono">
              Target files retrieved within top 5 AST chunks.
            </p>
          </div>

          <div className="p-6 rounded-[28px] glass-card-luxury text-left space-y-2">
            <div className="flex items-center justify-between text-[var(--muted)] text-xs font-mono font-semibold uppercase">
              <span>Mean Reciprocal Rank (MRR)</span>
              <Award className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <div className="text-4xl font-extralight text-[var(--ink)] dark:text-white">
              {currentRun.mrr_score.toFixed(2)}
            </div>
            <p className="text-[11px] text-[var(--muted2)] dark:text-slate-400 font-mono">
              Rank proximity of highest-match chunk to spot #1.
            </p>
          </div>

          <div className="p-6 rounded-[28px] glass-card-luxury text-left space-y-2">
            <div className="flex items-center justify-between text-[var(--muted)] text-xs font-mono font-semibold uppercase">
              <span>Avg Latency</span>
              <Clock className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <div className="text-4xl font-extralight text-[var(--ink)] dark:text-white">
              {currentRun.avg_latency_ms.toFixed(1)} <span className="text-sm font-normal text-[var(--muted)]">ms</span>
            </div>
            <p className="text-[11px] text-[var(--muted2)] dark:text-slate-400 font-mono">
              Vector + BM25 RRF execution time.
            </p>
          </div>
        </div>
      )}

      {/* Benchmark Query Suite */}
      <div className="rounded-[32px] glass-panel-luxury overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-200/50 dark:border-slate-800/60 bg-white/40 dark:bg-black/20 flex items-center justify-between">
          <span className="text-xs font-bold font-mono text-[var(--muted)] uppercase tracking-wider">Evaluation Test Suite ({testCases.length} queries)</span>
        </div>

        <div className="divide-y divide-slate-200/40 dark:divide-slate-800/40">
          {testCases.map((tc, idx) => {
            const resultMatch = currentRun?.results?.find(r => r.query === tc.query);
            return (
              <div key={idx} className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors">
                <div className="space-y-2 flex-1 text-left">
                  <div className="flex items-start space-x-2.5">
                    {resultMatch ? (
                      resultMatch.is_hit ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                      )
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-[var(--accent)] ml-1 mr-1 mt-1.5" />
                    )}
                    <span className="text-sm font-medium text-[var(--ink)] dark:text-white">{tc.query}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pl-6 text-xs">
                    <span className="text-[var(--muted)] font-mono">Expected:</span>
                    {tc.expected_files.map((f, i) => (
                      <span key={i} className="px-2.5 py-0.5 rounded-full bg-white/70 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[var(--ink-soft)] dark:text-slate-300 font-mono text-[11px]">
                        {f}
                      </span>
                    ))}

                    {resultMatch && (
                      <span className="ml-2 text-[11px] text-[var(--muted)] font-mono">
                        Latency: {resultMatch.latency_ms}ms
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveTestCase(idx)}
                  className="p-2 rounded-full text-[var(--muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  title="Delete test case"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Add custom test case */}
        <form onSubmit={handleAddTestCase} className="p-4 bg-white/40 dark:bg-black/20 border-t border-slate-200/50 dark:border-slate-800/60 grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            type="text"
            value={newQuery}
            onChange={(e) => setNewQuery(e.target.value)}
            placeholder="Custom natural language query..."
            className="md:col-span-2 px-4 py-2.5 rounded-full glass-card-luxury text-base sm:text-xs text-[var(--ink)] dark:text-white placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
          />
          <div className="flex space-x-2">
            <input
              type="text"
              value={newExpected}
              onChange={(e) => setNewExpected(e.target.value)}
              placeholder="Expected files (comma separated)..."
              className="flex-1 px-4 py-2.5 rounded-full glass-card-luxury text-base sm:text-xs text-[var(--ink)] dark:text-white placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-[var(--cta)] dark:bg-[#1A2B45] text-white rounded-full text-xs font-semibold flex items-center space-x-1 shadow-md active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EvaluationTable;
