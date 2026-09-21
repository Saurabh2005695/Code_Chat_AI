import React, { useEffect, useState, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Loader2, Network, RefreshCw, Search, FileCode, Layers } from 'lucide-react';
import api from '../../services/api';
import { useRepo } from '../../context/RepoContext';
import { useTheme } from '../../context/ThemeContext';

const DependencyGraph = () => {
  const { activeRepo } = useRepo();
  const { theme } = useTheme();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isDark = theme === 'dark';

  const fetchGraph = async () => {
    if (!activeRepo) return;
    setLoading(true);
    try {
      const res = await api.get(`/repos/${activeRepo.id}/graph`);
      const { nodes: rawNodes, edges: rawEdges } = res.data;

      // Position nodes in a clean circular / grid layout
      const cols = Math.ceil(Math.sqrt(rawNodes.length || 1));
      const spacingX = 240;
      const spacingY = 130;

      const layoutNodes = rawNodes.map((node, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        return {
          id: node.id,
          data: { 
            label: `${node.label} (${node.line_count}L)`, 
            meta: node 
          },
          position: { x: col * spacingX + 60, y: row * spacingY + 60 },
          style: {
            background: isDark ? 'rgba(20, 32, 56, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            color: isDark ? '#F0F4FA' : '#020C21',
            border: isDark ? '1px solid rgba(74, 120, 176, 0.4)' : '1px solid rgba(120, 145, 180, 0.3)',
            borderRadius: '16px',
            padding: '10px 16px',
            fontSize: '12px',
            fontWeight: '600',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: isDark 
              ? '0 8px 24px rgba(0, 0, 0, 0.4)' 
              : '0 8px 24px rgba(28, 52, 92, 0.08)'
          }
        };
      });

      const layoutEdges = rawEdges.map((edge, index) => ({
        id: `e-${edge.source}-${edge.target}-${index}`,
        source: edge.source,
        target: edge.target,
        animated: true,
        style: { stroke: '#4A78B0', strokeWidth: 1.8 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#4A78B0'
        }
      }));

      setNodes(layoutNodes);
      setEdges(layoutEdges);
    } catch (err) {
      console.error('Error fetching graph data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [activeRepo?.id, isDark]);

  const onNodeClick = (_, node) => {
    setSelectedNode(node.data.meta);
  };

  // Filter nodes by search query
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    const q = searchQuery.toLowerCase();
    return nodes.map(n => ({
      ...n,
      style: {
        ...n.style,
        opacity: n.id.toLowerCase().includes(q) ? 1 : 0.15,
        borderColor: n.id.toLowerCase().includes(q) ? '#4A78B0' : n.style.borderColor
      }
    }));
  }, [nodes, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full relative bg-[var(--frame)] dark:bg-[#070B14] transition-colors duration-200">
      {/* Top Header Controls */}
      <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-[#070B14]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--ink)] dark:text-white">Module Dependency Network</h2>
            <p className="text-[11px] text-[var(--muted)] hidden sm:block font-mono">AST Architecture Topology & File Relationships</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-1 sm:flex-initial justify-end">
          <div className="relative w-full max-w-[220px]">
            <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter modules..."
              className="w-full pl-9 pr-3 py-1.5 rounded-full glass-card-luxury text-xs text-[var(--ink)] dark:text-white placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <button
            onClick={fetchGraph}
            disabled={loading}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-full glass-pill text-[var(--ink)] dark:text-white text-xs font-semibold transition-colors disabled:opacity-50 flex-shrink-0 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
            <span className="text-xs text-[var(--muted)] font-mono">Analyzing AST Import Map...</span>
          </div>
        ) : nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--muted)] text-sm p-6 text-center">
            <Layers className="w-12 h-12 mb-3 text-[var(--muted)] opacity-50" />
            <span className="font-semibold text-[var(--ink)] dark:text-white">No direct module imports detected</span>
            <span className="text-xs mt-1 text-[var(--muted)] font-mono">Import pathways will automatically render here as you index multi-file repositories.</span>
          </div>
        ) : (
          <ReactFlow
            nodes={filteredNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
          >
            <Background color={isDark ? '#1F2937' : '#BCC8DB'} gap={20} size={1} />
            <Controls className="!bg-white/80 dark:!bg-[#111827]/80 !border-slate-200 dark:!border-slate-700 !rounded-2xl !shadow-xl" />
            <MiniMap
              nodeColor={() => '#4A78B0'}
              className="!bg-white/80 dark:!bg-[#111827]/80 !border-slate-200 dark:!border-slate-700 !rounded-2xl !shadow-xl !overflow-hidden hidden sm:block"
            />
          </ReactFlow>
        )}

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-80 rounded-[28px] glass-panel-luxury p-6 shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--accent)] flex items-center space-x-1.5">
                <FileCode className="w-3.5 h-3.5" />
                <span>Module Inspector</span>
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-[var(--muted)] hover:text-[var(--ink)] dark:hover:text-white text-sm p-1 rounded-full hover:bg-white/50 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs text-[var(--muted2)] dark:text-slate-300">
              <div className="p-3 rounded-xl bg-white/70 dark:bg-[#181C26]/70 border border-slate-200/60 dark:border-slate-700/60 font-mono text-[var(--ink)] dark:text-white font-semibold break-all text-[11px]">
                {selectedNode.id}
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/50 dark:border-slate-700/50">
                <span>Language:</span>
                <span className="text-[var(--accent)] font-semibold capitalize">{selectedNode.language || 'Code'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span>Lines of Code:</span>
                <span className="font-mono text-[var(--ink)] dark:text-white font-semibold">{selectedNode.line_count} lines</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DependencyGraph;
