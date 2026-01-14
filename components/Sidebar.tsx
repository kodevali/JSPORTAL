
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
    { id: 'news', label: 'Media & Updates', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2' },
    { id: 'downloads', label: 'Downloads', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
    { id: 'tickets', label: 'Support Tickets', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  ];

  return (
    <div className="w-64 bg-[#0F172A] h-screen flex flex-col fixed left-0 top-0 text-white shadow-2xl z-20 border-r border-slate-800">
      <div className="p-8 flex flex-col items-center bg-white dark:bg-slate-900 mb-6 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <Logo className="mb-2" />
        <div className="flex flex-col items-center">
          <div className="h-0.5 w-6 bg-[#EF7A25] rounded-full mb-1"></div>
          <span className="text-[9px] font-black tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400">Intranet Portal</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
              activeTab === tab.id 
                ? 'bg-[#044A8D] text-white shadow-lg shadow-[#044A8D]/30' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-white/10' : 'bg-slate-800'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={tab.icon} />
              </svg>
            </div>
            <span className="font-bold text-sm tracking-tight">{tab.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-6 space-y-4">
        <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-[#FAB51D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dark Mode</span>
          </div>
          <button 
            onClick={toggleDarkMode}
            className={`relative w-10 h-5 rounded-full transition-colors duration-300 focus:outline-none ${darkMode ? 'bg-[#044A8D]' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm ${darkMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
          </button>
        </div>

        <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-800">
          <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-2">Access Profile</p>
          <div className="flex items-center space-x-3">
             <div className="w-2 h-2 rounded-full bg-[#FAB51D] animate-pulse shadow-[0_0_8px_#FAB51D]"></div>
             <p className="text-xs font-black text-white uppercase tracking-tight">{role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
