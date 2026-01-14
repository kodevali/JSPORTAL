
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getPersonalizedGreeting, getCurrentWeather } from '../services/geminiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { COLORS } from '../constants';

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
  const [weather, setWeather] = useState({ temp: "28°C", desc: "Clear", emoji: "☀️", sources: [] as any[] });

  /**
   * Enhanced deduplication that normalizes strings to catch identical events
   * with slight metadata differences (e.g. trailing spaces, different IDs).
   */
  const deduplicate = <T,>(arr: T[], signatureFn: (item: T) => string): T[] => {
    const seen = new Set<string>();
    return arr.filter(item => {
      const sig = signatureFn(item).toLowerCase().trim();
      if (seen.has(sig)) return false;
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
          // GMAIL
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
            setEmails(deduplicate(emailDetails, (e) => e.subject + e.date));
          }

          // TASKS
          const tasksRes = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?maxResults=10', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const tasksData = await tasksRes.json();
          setTasks(deduplicate((tasksData.items || []), (t: any) => t.title));

          // CALENDAR
          const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=15&singleEvents=true&orderBy=startTime`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const calData = await calRes.json();
          // Calendar deduplication using Summary + Normalized Start Time
          setCalendarEvents(deduplicate((calData.items || []), (c: any) => {
            const startStr = c.start.dateTime || c.start.date || '';
            return `${c.summary}-${startStr}`;
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

  const cardStyle = "bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden transition-all duration-300";
  const labelText = "text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-200 flex items-center space-x-2";

  return (
    <div className="space-y-4 animate-fadeIn max-w-[1280px] mx-auto">
      <div className="flex items-center justify-between pb-2">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black text-[#044A8D] dark:text-white tracking-tight">Salam, {user.name.split(' ')[0]}</h1>
          <p className="text-slate-800 dark:text-slate-200 text-xs font-semibold max-w-lg truncate mt-1">{greeting}</p>
        </div>
        
        <div className="flex items-center space-x-3 bg-white dark:bg-[#1E293B] p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
          <div className="px-4 py-1.5 border-r border-slate-200 dark:border-slate-800 text-right">
            <p className="text-xl font-black text-slate-900 dark:text-white leading-none tabular-nums tracking-tighter">{time}</p>
            <p className="text-[8px] text-[#044A8D] dark:text-[#FAB51D] font-black uppercase tracking-widest mt-1">Karachi HQ</p>
          </div>
          <div className="flex items-center space-x-3 pr-4 pl-1">
            <span className="text-2xl">{weather.emoji}</span>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-800 dark:text-white leading-none">{weather.temp}</span>
              <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">{weather.desc}</span>
            </div>
          </div>
        </div>
      </div>

      {!accessToken && !isAuthorizing ? (
        <div className={`${cardStyle} h-[420px] items-center justify-center space-y-6 text-center bg-[#044A8D]/5 border-dashed border-[#044A8D]/20`}>
          <div className="w-16 h-16 bg-[#044A8D] text-white rounded-2xl flex items-center justify-center shadow-lg">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div className="max-w-xs px-4">
            <h2 className="text-xl font-black text-[#044A8D] dark:text-white">Workspace Sync Required</h2>
            <p className="text-slate-900 dark:text-slate-300 text-sm mt-2 font-medium">Link your JS Bank environment to synchronize your real-time schedule, backlog, and priority communications.</p>
          </div>
          <button onClick={onSyncRequest} className="px-10 py-3.5 bg-[#044A8D] text-white font-black rounded-xl hover:bg-blue-800 transition-all text-[11px] uppercase tracking-widest shadow-xl shadow-blue-200 active:scale-95">Link My Environment</button>
        </div>
      ) : isAuthorizing ? (
        <div className={`${cardStyle} h-[420px] items-center justify-center space-y-4`}>
          <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-[#044A8D] rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-[#044A8D] dark:text-[#FAB51D] uppercase tracking-[0.2em] animate-pulse">Establishing Session...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-full">
          {/* Priority Communications */}
          <div className={`${cardStyle} md:col-span-8 h-[380px]`}>
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900 transition-colors">
              <div className={labelText}>
                <div className="w-2 h-2 rounded-full bg-[#EF7A25] shadow-[0_0_5px_#EF7A25]"></div>
                <span className="text-slate-900 dark:text-white font-black">Priority Communications</span>
              </div>
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-tighter">GMAIL SECURE</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scroll scrollbar-hide">
              {loadingEcosystem ? (
                <div className="h-full flex items-center justify-center">
                   <div className="w-6 h-6 border-2 border-slate-200 dark:border-slate-800 border-t-[#044A8D] rounded-full animate-spin"></div>
                </div>
              ) : emails.length > 0 ? (
                emails.map((email) => (
                  <div key={email.id} className="p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 rounded-xl transition-all cursor-pointer group hover:shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black text-[#044A8D] dark:text-[#FAB51D] uppercase tracking-tight truncate w-2/3">{email.from}</span>
                      <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">{email.date}</span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 mb-1 group-hover:text-[#EF7A25] transition-colors">{email.subject}</h3>
                    <p className="text-[10px] text-slate-700 dark:text-slate-400 line-clamp-1 leading-tight italic">{email.snippet}</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">Inbox Zero</div>
              )}
            </div>
            
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <button className="w-full py-2.5 bg-[#044A8D] text-white text-[10px] font-black rounded-lg uppercase tracking-[0.15em] hover:bg-blue-800 transition-all shadow-md active:scale-[0.98]">Access All Mail</button>
            </div>
          </div>

          {/* JS Calendar (Sessions) Card - Theme Responsive */}
          <div className={`${cardStyle} md:col-span-4 h-[380px] bg-white dark:bg-[#044A8D] border-l-4 border-l-[#044A8D] dark:border-l-transparent text-slate-900 dark:text-white shadow-xl transition-all duration-300`}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/20 flex items-center justify-between bg-slate-50 dark:bg-transparent">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-[#EF7A25] dark:bg-[#FAB51D] shadow-[0_0_8px_rgba(0,0,0,0.2)]"></div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-[#044A8D] dark:text-white">JS Sessions</h2>
              </div>
              <span className="text-[8px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest">Today</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide">
              {calendarEvents.length > 0 ? (
                calendarEvents.map((event) => (
                  <div key={event.id} className="flex items-start space-x-4 border-l-2 border-slate-200 dark:border-white/20 hover:border-[#044A8D] dark:hover:border-[#FAB51D] pl-4 transition-all group cursor-pointer">
                    <div className="flex flex-col">
                      <h4 className="font-bold text-xs line-clamp-2 leading-tight text-slate-900 dark:text-white group-hover:text-[#044A8D] dark:group-hover:text-[#FAB51D] transition-colors">{event.summary}</h4>
                      <p className="text-[9px] text-slate-500 dark:text-blue-100 uppercase font-black tracking-widest mt-1.5 flex items-center space-x-2">
                        <span className="bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded">{new Date(event.start.dateTime || event.start.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center space-y-2">
                   <svg className="w-8 h-8 text-slate-200 dark:text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/50">Queue Clear</span>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-blue-900 border-t border-slate-200 dark:border-transparent">
              <button className="w-full py-2.5 bg-[#044A8D] dark:bg-white/10 hover:bg-blue-800 dark:hover:bg-white/20 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-sm border border-transparent dark:border-white/20">Launch JS Calendar</button>
            </div>
          </div>

          {/* Activity Metrics */}
          <div className={`${cardStyle} md:col-span-8 h-[240px]`}>
            <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
               <h2 className={labelText}><span className="text-slate-900 dark:text-white font-black">Activity Metrics (HQ Load)</span></h2>
               <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#044A8D] dark:bg-[#FAB51D]"></span>
                  <span className="text-[8px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Load Monitor</span>
               </div>
            </div>
            <div className="flex-1 p-2 bg-slate-50 dark:bg-slate-900 transition-colors">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{n: 'M', v: 40}, {n: 'T', v: 30}, {n: 'W', v: 60}, {n: 'T', v: 80}, {n: 'F', v: 50}]}>
                  <defs>
                    <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#044A8D" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#044A8D" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    labelFormatter={(label) => `Day: ${label}`}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.15)', fontSize: '10px', fontWeight: 'bold', backgroundColor: '#0F172A', color: '#fff'}}
                    itemStyle={{color: '#FAB51D'}}
                  />
                  <Area type="monotone" dataKey="v" stroke="#044A8D" fill="url(#colorV)" strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Personal Backlog */}
          <div className={`${cardStyle} md:col-span-4 h-[240px]`}>
            <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 transition-colors">
               <h2 className={labelText}><span className="text-slate-900 dark:text-white font-black">Personal Backlog</span></h2>
               <span className="text-[8px] font-black text-[#EF7A25] bg-orange-100 dark:bg-orange-950 px-2 py-0.5 rounded uppercase tracking-tighter">{tasks.length} Sync'd</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div key={task.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#EF7A25] dark:hover:border-[#EF7A25] rounded-xl flex items-center justify-between group transition-all shadow-sm">
                    <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate mr-3">{task.title}</span>
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-400 dark:border-slate-500 text-[#EF7A25] focus:ring-[#EF7A25] cursor-pointer bg-white dark:bg-transparent transition-colors" />
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">Queue Clear</div>
              )}
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
