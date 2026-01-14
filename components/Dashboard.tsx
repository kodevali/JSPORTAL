
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getPersonalizedGreeting, getCurrentWeather } from '../services/geminiService';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
  const [tasks, setTasks] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loadingEcosystem, setLoadingEcosystem] = useState(false);
  const [weather, setWeather] = useState({ temp: "26°C", desc: "Sunny", emoji: "☀️", sources: [] as any[] });

  /**
   * Ultra-strict deduplication for banking agenda accuracy.
   */
  const deduplicate = <T,>(arr: T[], signatureFn: (item: T) => string): T[] => {
    const seen = new Set<string>();
    return arr.filter(item => {
      const sig = signatureFn(item).toLowerCase().trim();
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
          // GMAIL SYNC
          const gmailListRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=label:IMPORTANT&maxResults=15', {
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
            setEmails(deduplicate(emailDetails, (e) => `${e.subject}-${e.from}-${e.date}`));
          }

          // TASKS SYNC
          const tasksRes = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?maxResults=15', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const tasksData = await tasksRes.json();
          setTasks(deduplicate((tasksData.items || []), (t: any) => t.title));

          // CALENDAR SYNC
          const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=50&singleEvents=true&orderBy=startTime`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const calData = await calRes.json();
          
          // STRICT DEDUPLICATION: Group by summary and actual start date only to catch all sync variants.
          setCalendarEvents(deduplicate((calData.items || []), (c: any) => {
            const summary = (c.summary || 'untitled').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
            const rawStart = c.start.dateTime || c.start.date || '';
            const dateOnly = rawStart.includes('T') ? rawStart.split('T')[0] : rawStart;
            return `${summary}-${dateOnly}`;
          }));
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

  const cardBase = "bg-white dark:bg-[#1E293B] rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col overflow-hidden transition-all duration-500 hover:shadow-[0_40px_100px_rgba(0,0,0,0.1)]";

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1400px] mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-3 mb-1">
             <span className="px-4 py-1.5 bg-[#EF7A25]/10 text-[#EF7A25] text-[10px] font-black uppercase tracking-[0.25em] rounded-full">Secure Session</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Regional Hub: Karachi</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black text-[#044A8D] dark:text-white tracking-tighter leading-none">Salam, {user.name.split(' ')[0]}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-base lg:text-lg max-w-xl">{greeting}</p>
        </div>
        
        <div className="flex items-center space-x-4 bg-white dark:bg-slate-900 p-3 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800">
          <div className="px-8 py-2 border-r border-slate-100 dark:border-slate-800">
             <p className="text-3xl font-black tabular-nums text-slate-900 dark:text-white tracking-tighter leading-none">{time}</p>
             <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#EF7A25] mt-2">Live Terminal</p>
          </div>
          <div className="flex items-center px-6 space-x-4">
            <span className="text-4xl">{weather.emoji}</span>
            <div className="text-left">
              <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{weather.temp}</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mt-1">{weather.desc}</p>
            </div>
          </div>
        </div>
      </div>

      {!accessToken && !isAuthorizing ? (
        <div className={`${cardBase} h-[500px] items-center justify-center text-center p-16 bg-gradient-to-br from-[#044A8D]/5 to-white dark:from-slate-900 dark:to-slate-800 border-dashed border-[#044A8D]/20`}>
          <div className="w-24 h-24 bg-[#044A8D] text-white rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_60px_rgba(4,74,141,0.3)] mb-10">
             <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h2 className="text-3xl font-black text-[#044A8D] dark:text-white mb-6 tracking-tight">Enterprise Infrastructure Offline</h2>
          <p className="text-slate-500 dark:text-slate-400 text-base max-w-md mb-12 font-bold leading-relaxed">Secure protocol initiated. Please synchronize your executive profile to activate the full-stack intelligence dashboard.</p>
          <button onClick={onSyncRequest} className="px-16 py-5 bg-[#044A8D] text-white font-black rounded-2xl hover:bg-blue-800 transition-all shadow-2xl shadow-blue-200 uppercase tracking-[0.2em] text-[12px] active:scale-95">Establish Secure Link</button>
        </div>
      ) : isAuthorizing ? (
        <div className={`${cardBase} h-[500px] items-center justify-center space-y-6`}>
          <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-800 border-t-[#EF7A25] rounded-full animate-spin"></div>
          <p className="text-xs font-black text-[#EF7A25] uppercase tracking-[0.5em] animate-pulse">Mounting Workspace...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4">
          
          {/* Main Communications - Bento Grid Item */}
          <div className={`${cardBase} lg:col-span-8 min-h-[450px]`}>
            <div className="px-10 py-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 rounded-full bg-[#EF7A25] shadow-[0_0_15px_#EF7A25]"></div>
                <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-[#044A8D] dark:text-blue-400">Communication Terminal</h2>
              </div>
              <div className="flex items-center space-x-2">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Encrypted</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-5 custom-scroll scrollbar-hide">
              {loadingEcosystem ? (
                <div className="h-full flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-200 border-t-[#044A8D] rounded-full animate-spin"></div></div>
              ) : emails.length > 0 ? (
                emails.map((email) => (
                  <div key={email.id} className="p-5 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-[2rem] transition-all cursor-pointer group shadow-sm hover:shadow-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-black text-[#044A8D] dark:text-[#FAB51D] uppercase tracking-tight truncate w-2/3">{email.from}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{email.date}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 mb-2 group-hover:text-[#EF7A25] transition-colors">{email.subject}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic font-medium opacity-80">{email.snippet}</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-40">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  <span className="text-xs font-black uppercase tracking-[0.4em]">Operational Queue Clear</span>
                </div>
              )}
            </div>
            
            <div className="p-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
              <a 
                href="https://mail.google.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full flex items-center justify-center py-4 bg-[#044A8D] hover:bg-blue-800 text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.25em] transition-all shadow-2xl shadow-blue-200 active:scale-95"
              >
                Access Full Gmail Dashboard
              </a>
            </div>
          </div>

          {/* Agenda Bento Card - Vertical Long */}
          <div className={`${cardBase} lg:col-span-4 min-h-[700px] h-full bg-[#044A8D] dark:bg-[#0F172A] border-none text-white shadow-[0_50px_100px_rgba(4,74,141,0.3)] relative lg:row-span-2`}>
            {/* Visual Glassmorphism Accents */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#EF7A25]/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none"></div>
            
            <div className="px-10 py-8 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 rounded-full bg-[#FAB51D] shadow-[0_0_15px_rgba(250,181,29,0.5)]"></div>
                <h2 className="text-[12px] font-black uppercase tracking-[0.3em]">JS Agenda</h2>
              </div>
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Live</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide flex flex-col">
              
              {/* COMPACT ALL-DAY SECTION - Fixes the space eating issue */}
              {allDayEvents.length > 0 && (
                <div className="mb-8 p-6 bg-white/10 rounded-[2rem] border border-white/10 backdrop-blur-md">
                   <div className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-200 mb-4 flex items-center">
                     <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
                     Special Occasions Today
                   </div>
                   <div className="space-y-3">
                     {allDayEvents.map(event => (
                       <div key={event.id} className="flex items-center space-x-3 group">
                         <div className="w-1.5 h-1.5 rounded-full bg-[#FAB51D]"></div>
                         <span className="text-[13px] font-bold tracking-tight text-white group-hover:text-[#FAB51D] transition-colors line-clamp-1">{event.summary}</span>
                       </div>
                     ))}
                   </div>
                </div>
              )}

              {/* TIMED TIMELINE */}
              <div className="flex-1">
                {timedEvents.length > 0 ? (
                  <div className="relative border-l-2 border-white/10 ml-2 space-y-10 pb-6">
                    {timedEvents.map((event) => (
                      <div key={event.id} className="relative pl-10 group">
                        {/* Timeline Node */}
                        <div className="absolute -left-[10px] top-1 w-4.5 h-4.5 rounded-full border-4 border-[#044A8D] dark:border-[#0F172A] bg-[#FAB51D] group-hover:scale-125 transition-transform shadow-[0_0_15px_#FAB51D]"></div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em]">{getTimeLabel(event)}</span>
                            {event.status === 'confirmed' && (
                              <span className="text-[8px] font-black bg-white/20 text-white px-2.5 py-1 rounded-full uppercase tracking-widest border border-white/10">Verified</span>
                            )}
                          </div>
                          <h4 className="text-[15px] font-black leading-tight group-hover:text-[#FAB51D] transition-colors tracking-tight">{event.summary}</h4>
                          {event.location && (
                            <div className="flex items-center space-x-2 text-[9px] font-bold text-white/50 uppercase tracking-widest">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                              <span className="truncate max-w-[180px]">{event.location.split(',')[0]}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !allDayEvents.length && (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-20">
                     <svg className="w-20 h-20 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                     <span className="text-[12px] font-black uppercase tracking-[0.5em]">Schedule Empty</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-10 bg-white/5 border-t border-white/10">
              <a 
                href="https://calendar.google.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full flex items-center justify-center py-5 bg-white hover:bg-[#FAB51D] text-[#044A8D] hover:text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95"
              >
                Launch JS Calendar Hub
              </a>
            </div>
          </div>

          {/* Metrics Card - Bento Grid Item */}
          <div className={`${cardBase} lg:col-span-4 h-[350px]`}>
            <div className="px-10 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
               <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-[#044A8D] dark:text-blue-400">HQ Resource Matrix</h2>
               <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Real-Time</span>
               </div>
            </div>
            <div className="flex-1 p-6 bg-slate-50/20 dark:bg-slate-900/20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{n: 'M', v: 40}, {n: 'T', v: 30}, {n: 'W', v: 60}, {n: 'T', v: 80}, {n: 'F', v: 50}]}>
                  <defs>
                    <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#044A8D" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#044A8D" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke="#044A8D" fill="url(#colorV)" strokeWidth={5} animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Task Card - Bento Grid Item */}
          <div className={`${cardBase} lg:col-span-4 h-[350px]`}>
            <div className="px-10 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
               <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-[#044A8D] dark:text-blue-400">Operational Backlog</h2>
               <div className="px-3 py-1 bg-[#EF7A25] text-white text-[10px] font-black rounded-lg shadow-lg shadow-orange-100 uppercase tracking-widest">{tasks.length} Items</div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-3.5 custom-scroll scrollbar-hide">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div key={task.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] flex items-center justify-between group hover:border-[#EF7A25] hover:shadow-lg transition-all">
                    <span className="text-[12px] font-black text-slate-700 dark:text-white truncate mr-4 tracking-tight">{task.title}</span>
                    <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-200 text-[#EF7A25] focus:ring-[#EF7A25] cursor-pointer dark:bg-transparent transition-all hover:scale-110" />
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center opacity-30 text-[11px] font-black uppercase tracking-[0.4em]">Queue Cleared</div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scroll::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </div>
  );
};

export default Dashboard;
