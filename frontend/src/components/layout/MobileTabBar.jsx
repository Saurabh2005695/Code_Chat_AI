import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MessageSquare, FolderGit2, Network, FileText, BarChart2 } from 'lucide-react';

const MobileTabBar = () => {
  const location = useLocation();

  const tabs = [
    { name: 'Chats', path: '/chat', icon: MessageSquare },
    { name: 'Repos', path: '/dashboard', icon: FolderGit2 },
    { name: 'Graph', path: '/graph', icon: Network },
    { name: 'Eval', path: '/eval', icon: BarChart2 },
    { name: 'Docs', path: '/docs', icon: FileText },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#070B14]/85 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 flex items-center justify-around pb-safe">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;
        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all ${
              isActive
                ? 'text-[var(--accent)] font-bold'
                : 'text-[var(--muted)] hover:text-[var(--ink)] dark:hover:text-white'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
            <span className="text-[10px] mt-0.5 font-mono">{tab.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default MobileTabBar;
