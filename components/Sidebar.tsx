
import React from 'react';
import { UserRole } from '../types';
import Logo from './Logo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: UserRole;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, role, darkMode, toggleDarkMode }) => {
  const isManager = role === UserRole.IT || role === UserRole.MANAGER;
  const isIT = role === UserRole.IT;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'news', label: 'News', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2' },
    { id: 'downloads', label: 'Downloads', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
    { id: 'tickets', label: 'Support', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  ];

  if (isManager) {
    tabs.push({ id: 'cms', label: 'CMS Studio', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' });
  }

  if (isIT) {
    tabs.push({ id: 'user-admin', label: 'User Admin', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' });
  }

  return (
    <div className="fixed left-6 top-6 bottom-6 w-20 lg:w-64 z-50 transition-all duration-500">
      <div className="h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 rounded-[2.5rem] shadow-xl flex flex-col overflow-hidden">
        <div className="p-6 flex flex-col items-center border-b border-slate-100 dark:border-slate-800">
          <Logo className="scale-75 lg:scale-100" />
          <div className="hidden lg:flex flex-col items-center mt-2">
            <div className="h-1 w-8 bg-[#EF7A25] rounded-full"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#044A8D] mt-2">Executive</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-3 overflow-y-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-center lg:justify-start lg:space-x-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${
                activeTab === tab.id 
                  ? 'bg-[#044A8D] text-white shadow-lg' 
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={tab.icon} />
              </svg>
              <span className="hidden lg:block font-bold text-sm">{tab.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 space-y-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-center h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl"
          >
            <svg className={`w-5 h-5 ${darkMode ? 'text-[#FAB51D]' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
