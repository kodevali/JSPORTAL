
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getPersonalizedGreeting, getCurrentWeather } from '../services/geminiService';

interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
}

interface DashboardProps {
  user: User;
  accessToken: string | null;
  isAuthorizing: boolean;
  onSyncRequest: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, accessToken, isAuthorizing, onSyncRequest }) => {
  const [greeting, setGreeting] = useState("Establishing secure workspace...");
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loadingEcosystem, setLoadingEcosystem] = useState(false);
  const [weather, setWeather] = useState({ temp: "26°C", desc: "Sunny", emoji: "☀️", sources: [] as any[] });

  /**
   * Enhanced deduplication with aggressive string normalization to catch multi-calendar sync artifacts.
   */
  const deduplicate = <T,>(arr: T[], signatureFn: (item: T) => string): T[] => {
    const seen = new Set<string>();
    return arr.filter(item => {
      // Normalize by removing all non-alphanumeric and forcing lowercase
      const sig = signatureFn(item).toLowerCase().replace(/[^a-z0-9]/g, '').trim();
      if (!sig || seen.has(sig)) return false;
      seen.add(sig);
      return true;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await getPersonalizedGreeting(user.name, user.role);
      setGreeting(res || `Assalamu Alaikum, ${user.name.split(' ')[0]}`);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const w = await getCurrentWeather(pos.coords.latitude, pos.coords.longitude);
          setWeather(w);
        });
      }

      if (accessToken) {
        setLoadingEcosystem(true);
        try {
          // GMAIL SYNC - Strict Top 5
          const gmailListRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=label:IMPORTANT&maxResults=10', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const listData = await gmailListRes.json();
          if (listData.messages) {
            const emailDetails = await Promise.all(
              listData.messages.map(async (msg: any) => {
                const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
                  headers: { Authorization: `Bearer ${accessToken}` }
                });
                const detail = await detailRes.json();
                const headers = detail.payload?.headers || [];
                const fromHeader = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
                const subjectHeader = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';
                const dateHeader = headers.find((h: any) => h.name === 'Date')?.value || '';

                return {
                  id: msg.id,
                  subject: subjectHeader,
                  from: fromHeader.split('<')[0].trim().replace(/"/g, ''),
                  snippet: detail.snippet || '',
                  date: dateHeader ? new Date(dateHeader).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
                };
              })
            );
            setEmails(deduplicate(emailDetails, (e) => `${e.subject}-${e.from}`).slice(0, 5));
          }

          // CALENDAR SYNC - Strict Top 5 with aggressive birthday merging
          const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=50&singleEvents=true&orderBy=startTime`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const calData = await calRes.json();
          
          const processed = deduplicate((calData.items || []), (c: any) => {
            const summary = (c.summary || 'untitled').toLowerCase().trim();
            const rawStart = c.start.dateTime || c.start.date || '';
            const dateStr = rawStart.includes('T') ? rawStart.split('T')[0] : rawStart;
            return `${summary}-${dateStr}`;
          });
          
          setCalendarEvents(processed.slice(0, 5));
        } catch (err) {
          console.error("Workspace sync failure:", err);
        } finally {
          setLoadingEcosystem(false);
        }
      }
    };
    
    fetchData();
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, [user, accessToken]);

  const getTimeLabel = (event: any) => {
    if (event.start.date) return "ALL DAY";
    const date = new Date(event.start.dateTime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const allDayEvents = calendarEvents.filter(e => e.start.date);
  const timedEvents = calendarEvents.filter(e => e.start.dateTime);

  const cardBase = "bg-white dark:bg-[#1E293B] rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col overflow-hidden transition-all duration-500 hover:shadow-xl";

  return (
    <div className="space-y-6 animate-fadeIn max-w-[1200px] mx-auto pb-12">
      {/* Header Section - Compact */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
             <span className="px-2 py-0.5 bg-[#EF7A25]/10 text-[#EF7A25] text-[9px] font-black uppercase tracking-widest rounded-md">JS Secure</span>
             <h1 className="text-3xl font-black text-[#044A8D] dark:text-white tracking-tighter">Salam, {user.name.split(' ')[0]}</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs max-w-lg">{greeting}</p>
        </div>
        
        <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800">
          <div className="px-4 py-1 border-r border-slate-100 dark:border-slate-800">
             <p className="text-xl font-black tabular-nums text-slate-900 dark:text-white tracking-tighter">{time}</p>
          </div>
          <div className="flex items-center px-2 space-x-2">
            <span className="text-2xl">{weather.emoji}</span>
            <div className="text-left">
              <p className="text-xs font-black text-slate-900 dark:text-white leading-none">{weather.temp}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase">{weather.desc}</p>
            </div>
          </div>
        </div>
      </div>

      {!accessToken && !isAuthorizing ? (
        <div className={`${cardBase} h-[300px] items-center justify-center text-center p-8 bg-gradient-to-br from-[#044A8D]/5 to-white dark:from-slate-900 dark:to-slate-800 border-dashed border-[#044A8D]/20`}>
          <div className="w-16 h-16 bg-[#044A8D] text-white rounded-2xl flex items-center justify-center shadow-lg mb-6">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h2 className="text-xl font-black text-[#044A8D] dark:text-white mb-2">Sync Required</h2>
          <button onClick={onSyncRequest} className="px-10 py-3 bg-[#044A8D] text-white font-black rounded-xl hover:bg-blue-800 transition-all uppercase tracking-widest text-[10px] active:scale-95">Link Assets</button>
        </div>
      ) : isAuthorizing ? (
        <div className={`${cardBase} h-[300px] items-center justify-center space-y-4`}>
          <div className="w-10 h-10 border-4 border-slate-100 dark:border-slate-800 border-t-[#EF7A25] rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-[#EF7A25] uppercase tracking-[0.3em] animate-pulse">Connecting...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4">
          
          {/* Communications - Compact Bento Card */}
          <div className={`${cardBase} lg:col-span-7 min-h-[400px]`}>
            <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#EF7A25] shadow-[0_0_8px_#EF7A25]"></div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#044A8D] dark:text-blue-400">Important Directives</h2>
              </div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Top 5</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scroll scrollbar-hide">
              {loadingEcosystem ? (
                <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-slate-200 border-t-[#044A8D] rounded-full animate-spin"></div></div>
              ) : emails.length > 0 ? (
                emails.map((email) => (
                  <div key={email.id} className="p-4 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl transition-all cursor-pointer group shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-black text-[#044A8D] dark:text-[#FAB51D] uppercase tracking-tight truncate w-2/3">{email.from}</span>
                      <span className="text-[8px] font-black text-slate-400 uppercase">{email.date}</span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 mb-1 group-hover:text-[#EF7A25]">{email.subject}</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">{email.snippet}</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-40 py-12">
                  <span className="text-[10px] font-black uppercase tracking-widest">Inbox Zero</span>
                </div>
              )}
            </div>
            
            <div className="p-5 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
              <a 
                href="https://mail.google.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full flex items-center justify-center py-2.5 bg-[#044A8D] hover:bg-blue-800 text-white text-[9px] font-black rounded-lg uppercase tracking-widest transition-all shadow-md active:scale-95"
              >
                Access Gmail Dashboard
              </a>
            </div>
          </div>

          {/* Agenda - Compact Bento Card */}
          <div className={`${cardBase} lg:col-span-5 min-h-[400px] bg-[#044A8D] dark:bg-[#0F172A] border-none text-white relative`}>
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FAB51D] shadow-[0_0_10px_rgba(250,181,29,0.5)]"></div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">JS Agenda</h2>
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Verified</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide flex flex-col">
              
              {/* COMPACT ALL-DAY SECTION - Integrated & Small */}
              {allDayEvents.length > 0 && (
                <div className="mb-4 space-y-1.5">
                   {allDayEvents.map(event => (
                     <div key={event.id} className="p-2.5 bg-white/10 rounded-xl border border-white/5 flex items-center space-x-3 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FAB51D]"></div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-bold text-white group-hover:text-[#FAB51D] transition-colors truncate block">{event.summary}</span>
                        </div>
                        <span className="text-[7px] font-black uppercase opacity-40">All Day</span>
                     </div>
                   ))}
                </div>
              )}

              {/* TIMED TIMELINE - Compacter spacing */}
              <div className="flex-1">
                {timedEvents.length > 0 ? (
                  <div className="relative border-l border-white/20 ml-2 space-y-6 pb-2">
                    {timedEvents.map((event) => (
                      <div key={event.id} className="relative pl-6 group">
                        <div className="absolute -left-[4px] top-1 w-2 h-2 rounded-full border border-[#044A8D] dark:border-[#0F172A] bg-[#FAB51D] group-hover:scale-125 transition-transform shadow-[0_0_8px_#FAB51D]"></div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-blue-200 uppercase tracking-widest">{getTimeLabel(event)}</span>
                          </div>
                          <h4 className="text-[12px] font-bold leading-tight group-hover:text-[#FAB51D] transition-colors tracking-tight">{event.summary}</h4>
                          {event.location && (
                            <div className="flex items-center space-x-1.5 text-[8px] font-bold text-white/50 uppercase tracking-widest">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                              <span className="truncate max-w-[140px]">{event.location.split(',')[0]}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !allDayEvents.length && (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 py-12">
                     <span className="text-[10px] font-black uppercase tracking-[0.4em]">Empty</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 bg-white/5 border-t border-white/10">
              <a 
                href="https://calendar.google.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full flex items-center justify-center py-3 bg-white hover:bg-[#FAB51D] text-[#044A8D] hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
              >
                Launch Hub
              </a>
            </div>
          </div>

        </div>
      )}
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scroll::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </div>
  );
};

export default Dashboard;
