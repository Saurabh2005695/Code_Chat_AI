import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const RepoContext = createContext(null);

export const RepoProvider = ({ children }) => {
  const { token } = useAuth();
  const [repositories, setRepositories] = useState([]);
  const [activeRepo, setActiveRepo] = useState(() => {
    const saved = localStorage.getItem('codechat_active_repo');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const fetchRepositories = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get('/repos');
      setRepositories(res.data);
      
      // If current active repo is in list, update it
      if (activeRepo) {
        const found = res.data.find(r => r.id === activeRepo.id);
        if (found) {
          setActiveRepo(found);
          localStorage.setItem('codechat_active_repo', JSON.stringify(found));
        }
      } else if (res.data.length > 0) {
        setActiveRepo(res.data[0]);
        localStorage.setItem('codechat_active_repo', JSON.stringify(res.data[0]));
      }
    } catch (err) {
      console.error('Failed to load repositories:', err);
    } finally {
      setLoading(false);
    }
  }, [token, activeRepo?.id]);

  useEffect(() => {
    fetchRepositories();
  }, [token]);

  // Polling for any repo currently in "indexing" or "pending" status
  useEffect(() => {
    const hasIndexing = repositories.some(r => r.status === 'indexing' || r.status === 'pending');
    if (!hasIndexing) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get('/repos');
        setRepositories(res.data);
        if (activeRepo) {
          const updated = res.data.find(r => r.id === activeRepo.id);
          if (updated) {
            setActiveRepo(updated);
            localStorage.setItem('codechat_active_repo', JSON.stringify(updated));
          }
        }
      } catch (err) {
        console.error('Error polling repo status:', err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [repositories, activeRepo]);

  const selectRepo = (repo) => {
    setActiveRepo(repo);
    localStorage.setItem('codechat_active_repo', JSON.stringify(repo));
  };

  const deleteRepo = async (repoId) => {
    await api.delete(`/repos/${repoId}`);
    setRepositories(prev => prev.filter(r => r.id !== repoId));
    if (activeRepo?.id === repoId) {
      const remaining = repositories.filter(r => r.id !== repoId);
      const next = remaining.length > 0 ? remaining[0] : null;
      setActiveRepo(next);
      if (next) {
        localStorage.setItem('codechat_active_repo', JSON.stringify(next));
      } else {
        localStorage.removeItem('codechat_active_repo');
      }
    }
  };

  return (
    <RepoContext.Provider value={{
      repositories,
      activeRepo,
      loading,
      fetchRepositories,
      selectRepo,
      deleteRepo
    }}>
      {children}
    </RepoContext.Provider>
  );
};

export const useRepo = () => useContext(RepoContext);
