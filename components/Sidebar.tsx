
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
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'news', label: 'News', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2' },
    { id: 'downloads', label: 'Downloads', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
    { id: 'tickets', label: 'Support', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  ];

  return (
    <div className="fixed left-6 top-6 bottom-6 w-20 lg:w-64 z-50 transition-all duration-500">
      <div className="h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden">
        {/* Header/Logo */}
        <div className="p-6 flex flex-col items-center border-b border-slate-100 dark:border-slate-800">
          <Logo className="scale-75 lg:scale-100" />
          <div className="hidden lg:flex flex-col items-center mt-2">
            <div className="h-1 w-8 bg-[#EF7A25] rounded-full"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#044A8D] dark:text-blue-400 mt-2">Executive</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-3 overflow-y-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-center lg:justify-start lg:space-x-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative ${
                activeTab === tab.id 
                  ? 'bg-[#044A8D] text-white shadow-xl shadow-[#044A8D]/20 translate-x-1' 
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <div className="relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={tab.icon} />
                </svg>
                {activeTab === tab.id && (
                  <span className="absolute -right-1 -top-1 w-2 h-2 bg-[#EF7A25] rounded-full border-2 border-[#044A8D]"></span>
                )}
              </div>
              <span className="hidden lg:block font-bold text-sm tracking-tight">{tab.label}</span>
              
              {/* Tooltip for mobile view */}
              <div className="lg:hidden absolute left-full ml-4 px-3 py-1 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl">
                {tab.label}
              </div>
            </button>
          ))}
        </nav>
        
        {/* Footer Actions */}
        <div className="p-4 space-y-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={toggleDarkMode}
            className="w-full aspect-square lg:aspect-auto lg:h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl transition-colors hover:bg-[#FAB51D]/10"
          >
            <svg className={`w-5 h-5 transition-transform duration-500 ${darkMode ? 'rotate-180 text-[#FAB51D]' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <span className="hidden lg:block ml-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Appearance</span>
          </button>
          
          <div className="hidden lg:block bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2 mb-2">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Clearance</span>
            </div>
            <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
