
import React, { useState, useEffect } from 'react';
import { UserRole, DownloadItem } from '../types';
import { DOWNLOAD_ITEMS } from '../constants';

interface DownloadsProps {
  userRole: UserRole;
}

const Downloads: React.FC<DownloadsProps> = ({ userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [docs, setDocs] = useState<DownloadItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('js_portal_docs');
    setDocs(saved ? JSON.parse(saved) : DOWNLOAD_ITEMS);
  }, []);

  const roleWeight: Record<string, number> = {
    [UserRole.USER]: 1,
    [UserRole.MANAGER]: 2,
    [UserRole.IT]: 3
  };

  const filteredItems = docs.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const hasPermission = roleWeight[userRole] >= (roleWeight[item.minRole] || 1);
    return matchesSearch && hasPermission;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Document Repository</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Secure Internal Assets</p>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search documents..." 
            className="pl-12 pr-6 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none w-full md:w-80 shadow-sm text-xs font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden mx-2">
        {filteredItems.length > 0 ? (
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider">File Name</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider">Size</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-[#044A8D]/10 text-[#044A8D] dark:text-blue-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-black text-slate-500 uppercase">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[10px] text-slate-400 font-bold">{item.size}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#EF7A25] font-black text-[9px] uppercase tracking-widest inline-flex items-center space-x-1 group">
                      <span>Download</span>
                      <svg className="w-3 h-3 transform group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-24 text-center">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">No Documents Found</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default Downloads;
