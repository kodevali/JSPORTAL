
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
  const [greeting, setGreeting] = useState("Establishing workspace...");
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loadingEcosystem, setLoadingEcosystem] = useState(false);
  const [weather, setWeather] = useState({ temp: "26°C", desc: "Sunny", emoji: "☀️", sources: [] as any[] });

  /**
   * Universal deduplication logic.
   * Uses aggressive normalization to catch "birthday spam" and sync artifacts.
   */
  const deduplicate = <T,>(arr: T[], signatureFn: (item: T) => string): T[] => {
    const seen = new Set<string>();
    return arr.filter(item => {
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
          const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=60&singleEvents=true&orderBy=startTime`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const calData = await calRes.json();
          
          // STRICTEST DEDUPLICATION: Matches by Normalized Title + Date.
          // This merges all-day birthdays with any timed instances of the same event.
          setCalendarEvents(deduplicate((calData.items || []), (c: any) => {
            const summary = (c.summary || 'no-title').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
            const startStr = c.start.dateTime || c.start.date || '';
            const dateStr = startStr ? new Date(startStr).toISOString().split('T')[0] : 'no-date';
            return `${summary}-${dateStr}`;
          }));
        } catch (err) {
          console.error("Ecosystem sync error:", err);
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

  const cardStyle = "bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden transition-all duration-300";
  const labelText = "text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 flex items-center space-x-2";

  return (
    <div className="space-y-6 animate-fadeIn max-w-[1280px] mx-auto pb-12">
      {/* Personalized Header Section */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black text-[#044A8D] dark:text-white tracking-tight">Salam, {user.name.split(' ')[0]}</h1>
          <p className="text-slate-900 dark:text-slate-300 text-[11px] font-bold max-w-lg truncate mt-1">{greeting}</p>
        </div>
        
        <div className="flex items-center space-x-3 bg-white dark:bg-[#1E293B] p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
          <div className="px-4 py-1.5 border-r border-slate-200 dark:border-slate-800 text-right">
            <p className="text-xl font-black text-slate-900 dark:text-white leading-none tabular-nums tracking-tighter">{time}</p>
            <p className="text-[8px] text-[#044A8D] dark:text-[#FAB51D] font-black uppercase tracking-widest mt-1">Karachi HQ</p>
          </div>
          <div className="flex items-center space-x-3 pr-4 pl-1">
            <span className="text-2xl">{weather.emoji}</span>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900 dark:text-white leading-none">{weather.temp}</span>
              <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">{weather.desc}</span>
            </div>
          </div>
        </div>
      </div>

      {!accessToken && !isAuthorizing ? (
        <div className={`${cardStyle} h-[400px] items-center justify-center space-y-6 text-center bg-[#044A8D]/5 border-dashed border-[#044A8D]/40`}>
          <div className="w-16 h-16 bg-[#044A8D] text-white rounded-2xl flex items-center justify-center shadow-xl">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div className="max-w-xs px-4">
            <h2 className="text-xl font-black text-[#044A8D] dark:text-white">Workspace Sync Required</h2>
            <p className="text-slate-900 dark:text-slate-300 text-sm mt-2 font-bold leading-relaxed">Securely link your bank profile to synchronize your schedule, communications, and task backlog.</p>
          </div>
          <button onClick={onSyncRequest} className="px-10 py-3.5 bg-[#044A8D] text-white font-black rounded-xl hover:bg-blue-800 transition-all text-[11px] uppercase tracking-widest shadow-xl shadow-blue-200 active:scale-95">Link My Environment</button>
        </div>
      ) : isAuthorizing ? (
        <div className={`${cardStyle} h-[400px] items-center justify-center space-y-4`}>
          <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-[#044A8D] rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-[#044A8D] dark:text-[#FAB51D] uppercase tracking-[0.2em] animate-pulse">Establishing Session...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Priority Column */}
          <div className={`${cardStyle} lg:col-span-8 h-[360px]`}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 transition-colors">
              <div className={labelText}>
                <div className="w-2.5 h-2.5 rounded-full bg-[#EF7A25] shadow-[0_0_8px_#EF7A25]"></div>
                <span className="font-black text-slate-900 dark:text-white">Priority Communications</span>
              </div>
              <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase">GMAIL SECURE</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll scrollbar-hide">
              {loadingEcosystem ? (
                <div className="h-full flex items-center justify-center">
                   <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-700 border-t-[#044A8D] rounded-full animate-spin"></div>
                </div>
              ) : emails.length > 0 ? (
                emails.map((email) => (
                  <div key={email.id} className="p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer group hover:shadow-md">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black text-[#044A8D] dark:text-[#FAB51D] uppercase tracking-tight truncate w-2/3">{email.from}</span>
                      <span className="text-[9px] font-black text-slate-900 dark:text-slate-100">{email.date}</span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 mb-1 group-hover:text-[#EF7A25] transition-colors">{email.subject}</h3>
                    <p className="text-[10px] text-slate-900 dark:text-slate-400 line-clamp-1 leading-tight font-medium italic">{email.snippet}</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-slate-400">Inbox Zero</div>
              )}
            </div>
            
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <button className="w-full py-2.5 bg-[#044A8D] text-white text-[10px] font-black rounded-lg uppercase tracking-[0.15em] hover:bg-blue-800 transition-all shadow-md active:scale-[0.98]">Access All Mail</button>
            </div>
          </div>

          {/* JS SESSIONS - REFINED AGENDA VIEW */}
          <div className={`${cardStyle} lg:col-span-4 h-[360px] bg-white dark:bg-[#0F172A] border-l-4 border-[#044A8D] text-slate-900 dark:text-white shadow-xl`}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#EF7A25] dark:bg-[#FAB51D]"></div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-[#044A8D] dark:text-white">JS Sessions</h2>
              </div>
              <div className="flex items-center space-x-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[8px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Live Sync</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              {calendarEvents.length > 0 ? (
                <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-2 space-y-6 pb-2">
                  {calendarEvents.map((event) => (
                    <div key={event.id} className="relative pl-7 group">
                      {/* Timeline Dot Indicator */}
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#0F172A] bg-[#044A8D] dark:bg-[#FAB51D] group-hover:scale-110 transition-transform shadow-sm"></div>
                      
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-black text-[#044A8D] dark:text-[#FAB51D] uppercase tracking-widest">
                            {getTimeLabel(event)}
                          </span>
                          {event.status === 'confirmed' && (
                            <span className="text-[7px] font-black text-green-600 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded uppercase">Confirmed</span>
                          )}
                        </div>
                        <h4 className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-[#EF7A25] transition-colors">
                          {event.summary}
                        </h4>
                        {event.location && (
                          <div className="flex items-center space-x-1 text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                            <span>{event.location.split(',')[0]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-60">
                   <svg className="w-12 h-12 text-slate-200 dark:text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">No Meetings Scheduled</span>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <button className="w-full py-2.5 bg-[#044A8D] hover:bg-blue-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95">JS Calendar Hub</button>
            </div>
          </div>

          {/* Row 2: Metrics & Backlog - SQUARE 6/6 SPLIT */}
          <div className={`${cardStyle} lg:col-span-6 h-[300px]`}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 transition-colors">
               <h2 className={labelText}><span className="font-black text-slate-900 dark:text-white">Activity Metrics (HQ Load)</span></h2>
               <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#044A8D] dark:bg-[#FAB51D]"></span>
                  <span className="text-[8px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Real-Time</span>
               </div>
            </div>
            <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-900 transition-colors">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{n: 'M', v: 40}, {n: 'T', v: 30}, {n: 'W', v: 60}, {n: 'T', v: 80}, {n: 'F', v: 50}, {n: 'S', v: 25}]}>
                  <defs>
                    <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#044A8D" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#044A8D" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke="#044A8D" fill="url(#colorV)" strokeWidth={4} animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`${cardStyle} lg:col-span-6 h-[300px]`}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 transition-colors">
               <h2 className={labelText}><span className="font-black text-slate-900 dark:text-white">Personal Backlog</span></h2>
               <span className="text-[9px] font-black text-[#EF7A25] bg-orange-100 dark:bg-orange-900/50 px-2.5 py-1 rounded-lg uppercase tracking-widest">{tasks.length} Items</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-2.5 custom-scroll scrollbar-hide">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div key={task.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#EF7A25] dark:hover:border-[#EF7A25] rounded-xl flex items-center justify-between group transition-all shadow-sm">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate mr-4">{task.title}</span>
                    <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-300 dark:border-slate-600 text-[#EF7A25] focus:ring-[#EF7A25] cursor-pointer bg-slate-50 dark:bg-transparent transition-all" />
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Queue Clear</div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 10px; }
        .dark .custom-scroll::-webkit-scrollbar-thumb { background: #475569; }
      `}</style>
    </div>
  );
};

export default Dashboard;
