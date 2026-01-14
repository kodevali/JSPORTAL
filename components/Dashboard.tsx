
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
   * Ultra-aggressive deduplication to catch subtle sync variations in titles (especially birthdays).
   */
  const deduplicate = <T,>(arr: T[], signatureFn: (item: T) => string): T[] => {
    const seen = new Set<string>();
    return arr.filter(item => {
      // Strips everything except letters and numbers for a pure collision check
      const sig = signatureFn(item).toLowerCase().replace(/[^a-z0-9]/g, '');
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
          const gmailListRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=label:IMPORTANT&maxResults=8', {
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

          const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=40&singleEvents=true&orderBy=startTime`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const calData = await calRes.json();
          
          const processed = deduplicate((calData.items || []), (c: any) => {
            const summary = (c.summary || 'untitled');
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

  const cardBase = "bg-white dark:bg-[#1E293B] rounded-[1.5rem] border border-slate-200/40 dark:border-slate-800/50 shadow-sm flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg";

  return (
    <div className="space-y-4 animate-fadeIn max-w-[1100px] mx-auto pb-8">
      {/* Header Section - High Density */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-2">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
             <span className="px-1.5 py-0.5 bg-[#EF7A25]/10 text-[#EF7A25] text-[8px] font-black uppercase tracking-widest rounded">LIVE</span>
             <h1 className="text-2xl font-black text-[#044A8D] dark:text-white tracking-tight">Salam, {user.name.split(' ')[0]}</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-[11px] opacity-80 leading-tight">{greeting}</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="px-3 border-r border-slate-100 dark:border-slate-800">
             <p className="text-sm font-black tabular-nums text-slate-900 dark:text-white">{time}</p>
          </div>
          <div className="flex items-center px-2 space-x-1.5">
            <span className="text-xl">{weather.emoji}</span>
            <p className="text-[10px] font-black text-slate-900 dark:text-white">{weather.temp}</p>
          </div>
        </div>
      </div>

      {!accessToken && !isAuthorizing ? (
        <div className={`${cardBase} h-[200px] items-center justify-center text-center p-6 bg-slate-50/50`}>
          <button onClick={onSyncRequest} className="px-8 py-2.5 bg-[#044A8D] text-white font-black rounded-xl uppercase tracking-widest text-[9px] active:scale-95 transition-all">Enable Workspace Link</button>
        </div>
      ) : isAuthorizing ? (
        <div className={`${cardBase} h-[200px] items-center justify-center`}>
          <div className="w-8 h-8 border-2 border-slate-100 dark:border-slate-800 border-t-[#EF7A25] rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-2">
          
          {/* Gmail - High Density List */}
          <div className={`${cardBase} lg:col-span-7`}>
            <div className="px-5 py-3 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-[#044A8D] dark:text-blue-400 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF7A25] mr-2"></span>
                Gmail
              </h2>
              <span className="text-[8px] font-black uppercase text-slate-400">Secure</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scroll">
              {loadingEcosystem ? (
                <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-slate-200 border-t-[#044A8D] rounded-full animate-spin"></div></div>
              ) : emails.length > 0 ? (
                emails.map((email) => (
                  <div key={email.id} className="p-3 bg-white dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl transition-all cursor-pointer group">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[9px] font-black text-[#044A8D] dark:text-[#FAB51D] uppercase tracking-tight truncate w-3/4">{email.from}</span>
                      <span className="text-[8px] font-bold text-slate-400">{email.date}</span>
                    </div>
                    <h3 className="text-[11px] font-bold text-slate-900 dark:text-white truncate group-hover:text-[#EF7A25]">{email.subject}</h3>
                    <p className="text-[10px] text-slate-400 line-clamp-1 italic font-medium">{email.snippet}</p>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">Inbox Zero</div>
              )}
            </div>
            
            <div className="p-3 border-t border-slate-50 dark:border-slate-800">
              <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center py-2 bg-slate-100 dark:bg-slate-800 hover:bg-[#044A8D] hover:text-white text-slate-500 text-[9px] font-black rounded-lg uppercase tracking-widest transition-all">Open Gmail</a>
            </div>
          </div>

          {/* Today's Agenda - Slim Vertical Card */}
          <div className={`${cardBase} lg:col-span-5 bg-[#044A8D] dark:bg-[#0F172A] border-none text-white`}>
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-widest flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FAB51D] mr-2"></span>
                Today's Agenda
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 scrollbar-hide space-y-3">
              {/* COMPACT ALL-DAY MERGED ITEMS */}
              {allDayEvents.length > 0 && (
                <div className="space-y-1.5">
                   {allDayEvents.map(event => (
                     <div key={event.id} className="p-2 bg-white/5 rounded-lg border border-white/5 flex items-center space-x-2">
                        <div className="w-1 h-1 rounded-full bg-[#FAB51D]"></div>
                        <span className="text-[10px] font-bold truncate flex-1">{event.summary}</span>
                        <span className="text-[7px] font-black opacity-40">All-Day</span>
                     </div>
                   ))}
                </div>
              )}

              {/* TIMELINE */}
              <div className="space-y-4 pt-1">
                {timedEvents.length > 0 ? (
                  <div className="border-l border-white/10 ml-1 space-y-4">
                    {timedEvents.map((event) => (
                      <div key={event.id} className="relative pl-4 group">
                        <div className="absolute -left-[3.5px] top-1 w-1.5 h-1.5 rounded-full bg-[#FAB51D]"></div>
                        <div className="flex justify-between items-start">
                          <span className="text-[8px] font-black text-blue-200/60 uppercase">{getTimeLabel(event)}</span>
                        </div>
                        <h4 className="text-[11px] font-bold truncate group-hover:text-[#FAB51D] transition-colors">{event.summary}</h4>
                      </div>
                    ))}
                  </div>
                ) : !allDayEvents.length && (
                  <div className="py-10 text-center text-[10px] font-black opacity-30 uppercase">Empty</div>
                )}
              </div>
            </div>
            
            <div className="p-3 bg-white/5 border-t border-white/10">
              <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center py-2 bg-white text-[#044A8D] hover:bg-[#FAB51D] hover:text-white text-[9px] font-black rounded-lg uppercase tracking-widest transition-all">Open Calendar</a>
            </div>
          </div>

        </div>
      )}
      
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 3px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scroll::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </div>
  );
};

export default Dashboard;
