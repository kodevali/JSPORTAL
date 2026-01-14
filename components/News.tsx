
import React, { useState, useEffect } from 'react';
import { getLatestBankNews } from '../services/geminiService';
import { MOCK_NEWS } from '../constants';

const News: React.FC = () => {
  const [news, setNews] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      const res = await getLatestBankNews();
      if (res && res.articles && res.articles.length > 0) {
        setNews(res.articles);
        setSources(res.sources);
      } else {
        setNews(MOCK_NEWS);
        setSources([]);
      }
      setLoading(false);
    };
    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-blue-600 font-bold text-[10px]">JS</div>
        </div>
        <p className="text-slate-500 font-black uppercase tracking-[0.2em] animate-pulse text-xs">Accessing jsbl.com archives...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Media Center</h1>
          <p className="text-slate-500 mt-2">Latest announcements, financial reports, and corporate updates.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white px-5 py-2.5 rounded-full border border-slate-100 shadow-sm">
           <span className="flex h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
           <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Real-time Feed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {news.map((item, idx) => (
          <div key={idx} className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-50 flex flex-col hover:-translate-y-2">
            <div className="relative h-64 overflow-hidden">
              <img 
                src={item.image || `https://picsum.photos/seed/${idx}js/600/400`} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-60"></div>
              <div className="absolute bottom-6 left-6 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-xl text-[10px] font-black text-white uppercase tracking-widest">
                {item.date || "Just Now"}
              </div>
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors leading-tight">{item.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-1 line-clamp-3 font-medium">{item.summary}</p>
              <a 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-3 text-blue-600 font-black text-xs uppercase tracking-widest hover:translate-x-2 transition-transform"
              >
                <span>View Full Article</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Grounding Sources extraction - Required by Gemini Guidelines */}
      {sources.length > 0 && (
        <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Verified Sources via Google Search</h3>
          <div className="flex flex-wrap gap-2">
            {sources.map((source, i) => source.web && (
              <a 
                key={i} 
                href={source.web.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 transition-all"
              >
                {source.web.title || source.web.uri}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Corporate Communications Banner */}
      <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
           </svg>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-xl">
            <h2 className="text-3xl font-black mb-4">Internal Communications Hub</h2>
            <p className="text-slate-400 font-medium text-lg">Stay aligned with our corporate mission. Access strategic documents and leadership messages directly in the downloads tab.</p>
          </div>
          <div className="flex flex-col items-center space-y-4">
             <button className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-900/40 active:scale-95">
               Corporate Calendar
             </button>
             <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Verified Corporate Channel</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default News;
