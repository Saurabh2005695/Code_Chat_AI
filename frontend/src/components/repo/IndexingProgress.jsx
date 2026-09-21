import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const IndexingProgress = ({ repoId, onReady }) => {
  const [statusData, setStatusData] = useState(null);

  useEffect(() => {
    let interval;
    const fetchStatus = async () => {
      try {
        const res = await api.get(`/repos/${repoId}/status`);
        setStatusData(res.data);
        if (res.data.status === 'ready' && onReady) {
          onReady();
        }
      } catch (err) {
        console.error('Error fetching repo status:', err);
      }
    };

    fetchStatus();
    interval = setInterval(fetchStatus, 2000);

    return () => clearInterval(interval);
  }, [repoId, onReady]);

  if (!statusData) return null;

  return (
    <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {statusData.status === 'indexing' && <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />}
          {statusData.status === 'ready' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          {statusData.status === 'failed' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
          <span className="text-sm font-semibold text-[var(--text-primary)] capitalize">
            {statusData.status === 'indexing' ? 'Indexing in progress...' : statusData.status}
          </span>
        </div>
        <span className="text-xs font-mono font-bold text-brand-500">
          {statusData.progress_percentage}%
        </span>
      </div>

      {/* Progress track */}
      <div className="w-full h-2 rounded-full bg-[var(--bg-app)] overflow-hidden mb-2">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            statusData.status === 'failed'
              ? 'bg-rose-500'
              : 'bg-gradient-to-r from-brand-600 via-indigo-500 to-accent-cyan'
          }`}
          style={{ width: `${Math.max(5, statusData.progress_percentage)}%` }}
        />
      </div>

      <p className="text-xs text-[var(--text-secondary)] flex items-center justify-between">
        <span>{statusData.current_step || 'Processing files...'}</span>
        {statusData.error_message && (
          <span className="text-rose-500 font-medium">{statusData.error_message}</span>
        )}
      </p>
    </div>
  );
};

export default IndexingProgress;
