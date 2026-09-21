import React from 'react';
import DependencyGraph from '../components/graph/DependencyGraph';
import { useRepo } from '../context/RepoContext';
import { FolderGit2 } from 'lucide-react';

const GraphPage = () => {
  const { activeRepo } = useRepo();

  if (!activeRepo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <FolderGit2 className="w-16 h-16 text-slate-600 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Active Repository</h3>
        <p className="text-sm text-slate-400 max-w-sm">
          Please select an indexed repository from the top navigation bar to visualize its module dependency network.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <DependencyGraph />
    </div>
  );
};

export default GraphPage;
