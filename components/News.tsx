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
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#044A8D] rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Updating news-stream...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Media Center</h1>
          <p className="text-slate-500 text-sm">Official updates and corporate press releases.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
           <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
           <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">LIVE FEED</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {news.map((item, idx) => (
          <div key={idx} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-50 flex flex-col hover:-translate-y-1">
            <div className="relative h-48 overflow-hidden">
              <img src={item.image || `https://picsum.photos/seed/${idx}js/600/400`} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
              <div className="absolute top-4 left-4 bg-[#044A8D] px-3 py-1 rounded-lg text-[9px] font-black text-white uppercase tracking-widest">
                {item.date || "News"}
              </div>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <h3 className="text-md font-bold text-slate-900 mb-2 leading-tight group-hover:text-[#044A8D]">{item.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-2">{item.summary}</p>
              <div className="mt-auto">
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[#EF7A25] font-black text-[10px] uppercase tracking-widest flex items-center space-x-2 hover:translate-x-1 transition-transform">
                  <span>Read Article</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sources.length > 0 && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Sources</p>
          <div className="flex flex-wrap gap-2">
            {sources.map((source, i) => source.web && (
              <a key={i} href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold text-[#044A8D] bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 hover:underline">
                {source.web.title || source.web.uri}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="bg-[#044A8D] rounded-3xl p-10 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-md">
            <h2 className="text-2xl font-black mb-2">Internal Hub</h2>
            <p className="text-blue-100 text-sm">Access strategic archives and leadership comms directly from the document repository.</p>
          </div>
          <button className="bg-[#EF7A25] hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95">
            JS Archive
          </button>
        </div>
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" /></svg>
        </div>
      </div>
    </div>
  );
};

export default News;