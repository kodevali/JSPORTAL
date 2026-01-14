import React from 'react';
import { UserRole } from '../types';
import { COLORS } from '../constants';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: UserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, role }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'news', label: 'Media & Updates', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2' },
    { id: 'downloads', label: 'Downloads', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
    { id: 'tickets', label: 'Support Tickets', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  ];

  return (
    <div className="w-64 bg-[#0f172a] h-screen flex flex-col fixed left-0 top-0 text-white shadow-2xl z-20 border-r border-white/5">
      <div className="p-8 flex flex-col items-center border-b border-white/5 bg-white mb-2">
        <img 
          src="https://jsbl.com/wp-content/uploads/2021/06/js-bank-logo.png" 
          alt="JS Bank Logo" 
          className="w-full h-auto object-contain px-2"
        />
        <span className="text-[10px] font-black tracking-[0.3em] uppercase mt-4 text-[#044A8D] opacity-60">Internal Portal</span>
      </div>
      
      <nav className="flex-1 mt-4 px-4 space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
              activeTab === tab.id 
                ? 'bg-[#044A8D] text-white shadow-lg shadow-[#044A8D]/20' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-white/10' : 'bg-transparent group-hover:bg-white/10'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={tab.icon} />
              </svg>
            </div>
            <span className="font-bold text-sm tracking-tight">{tab.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-6">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
          <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-2">Access Clearance</p>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-[#FAB51D] animate-pulse"></div>
            <p className="text-xs font-black text-white uppercase">{role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;