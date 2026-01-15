
import React from 'react';
import { MOCK_NEWS } from '../constants';

const News: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Media Center</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Corporate Archives & Releases</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
        {MOCK_NEWS.map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col hover:shadow-lg transition-all">
            <div className="relative h-40 overflow-hidden">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover"/>
              <div className="absolute top-3 left-3 bg-[#044A8D] px-2 py-0.5 rounded text-[8px] font-black text-white uppercase">{item.date}</div>
            </div>
            <div className="p-4 flex flex-col flex-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 leading-tight">{item.title}</h3>
              <p className="text-slate-500 text-[10px] leading-relaxed mb-4 line-clamp-2">{item.summary}</p>
              <a href={item.link} target="_blank" className="mt-auto text-[#EF7A25] font-black text-[9px] uppercase tracking-widest flex items-center space-x-1">
                <span>Access Bulletin</span>
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default News;
