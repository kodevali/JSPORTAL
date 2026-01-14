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
  const [greeting, setGreeting] = useState("Loading...");
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loadingEcosystem, setLoadingEcosystem] = useState(false);
  const [weather, setWeather] = useState({ temp: "28°C", desc: "Clear", emoji: "☀️", sources: [] as any[] });

  useEffect(() => {
    const fetchData = async () => {
      const res = await getPersonalizedGreeting(user.name, user.role);
      setGreeting(res || `Assalamu Alaikum, ${user.name}`);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const w = await getCurrentWeather(pos.coords.latitude, pos.coords.longitude);
          setWeather(w);
        });
      }

      if (accessToken) {
        setLoadingEcosystem(true);
        try {
          const gmailListRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=label:IMPORTANT&maxResults=5', {
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
            setEmails(emailDetails);
          }

          const tasksRes = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?maxResults=4', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const tasksData = await tasksRes.json();
          setTasks(tasksData.items || []);

          const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=5&singleEvents=true&orderBy=startTime`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const calData = await calRes.json();
          setCalendarEvents(calData.items || []);
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

  const cardBase = "bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden";
  const headerText = "text-[10px] font-black uppercase tracking-widest text-slate-400";

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Dynamic Header */}
      <div className="flex items-end justify-between px-1">
        <div>
          <h1 className="text-2xl font-black text-[#044A8D] tracking-tight">Salam, {user.name.split(' ')[0]}</h1>
          <p className="text-slate-400 text-[11px] font-bold italic max-w-xl truncate">{greeting}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-50 flex items-center space-x-4">
            <div className="text-right border-r border-slate-100 pr-4">
              <p className="text-lg font-black text-slate-800 leading-none tabular-nums">{time}</p>
              <p className="text-[8px] text-[#044A8D] font-black uppercase tracking-widest mt-1">Karachi HQ</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xl">{weather.emoji}</span>
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-700 leading-none">{weather.temp}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{weather.desc}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!accessToken && !isAuthorizing ? (
        <div className={`${cardBase} p-12 items-center text-center justify-center space-y-6 h-[450px]`}>
          <div className="w-16 h-16 bg-[#044A8D]/10 text-[#044A8D] rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div className="max-w-sm">
            <h2 className="text-xl font-black text-[#044A8D]">Secure Auth Needed</h2>
            <p className="text-slate-500 text-sm mt-2">Connect your official JS Bank Workspace to enable prioritized communications and schedule management.</p>
          </div>
          <button onClick={onSyncRequest} className="px-8 py-3 bg-[#044A8D] text-white font-black rounded-xl hover:bg-blue-800 transition-all shadow-xl shadow-blue-200 text-xs uppercase tracking-widest">Connect Workspace</button>
        </div>
      ) : isAuthorizing ? (
        <div className={`${cardBase} p-12 items-center justify-center space-y-6 h-[450px]`}>
          <div className="w-10 h-10 border-4 border-slate-100 border-t-[#044A8D] rounded-full animate-spin"></div>
          <p className="text-xs font-black text-[#044A8D] uppercase tracking-widest animate-pulse">Establishing Secure Session...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Priority Communications Tile */}
          <div className={`${cardBase} md:col-span-8 h-[360px]`}>
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#EF7A25]"></div>
                <h2 className={headerText}>Priority Feed</h2>
              </div>
              <div className="flex space-x-1">
                <span className="text-[8px] font-black text-slate-400 border border-slate-100 px-1.5 rounded-md uppercase">JS-SYNC</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scroll scrollbar-thin">
              {loadingEcosystem ? (
                <div className="h-full flex items-center justify-center">
                   <div className="w-6 h-6 border-2 border-slate-100 border-t-[#044A8D] rounded-full animate-spin"></div>
                </div>
              ) : emails.map((email) => (
                <div key={email.id} className="p-3 bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-100 rounded-xl transition-all cursor-pointer group shadow-sm">
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="text-[9px] font-black text-[#044A8D] uppercase truncate w-2/3">{email.from}</span>
                    <span className="text-[8px] font-bold text-slate-400">{email.date}</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1 mb-0.5 group-hover:text-[#EF7A25]">{email.subject}</h3>
                  <p className="text-[10px] text-slate-500 line-clamp-1 opacity-70 leading-tight">{email.snippet}</p>
                </div>
              ))}
            </div>
            
            <div className="p-3 bg-slate-50/50 border-t border-slate-50">
              <button className="w-full py-2 bg-[#044A8D] text-white text-[9px] font-black rounded-lg uppercase tracking-[0.2em] hover:bg-blue-800 transition-colors shadow-sm">Access Global Inbox</button>
            </div>
          </div>

          {/* Sessions/Calendar Tile */}
          <div className={`${cardBase} md:col-span-4 h-[360px] bg-[#044A8D] text-white relative overflow-hidden`}>
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" /></svg>
            </div>
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FAB51D]"></div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-200">Today's Schedule</h2>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 relative z-10 custom-scroll-white scrollbar-thin">
              {calendarEvents.length > 0 ? (
                calendarEvents.map((event, i) => (
                  <div key={i} className="flex items-start space-x-4 group border-l-2 border-[#FAB51D] pl-4 transition-all">
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs line-clamp-1 group-hover:text-[#FAB51D] transition-colors">{event.summary}</h4>
                      <p className="text-[9px] text-blue-200 uppercase font-black tracking-[0.15em] mt-1">
                        {new Date(event.start.dateTime || event.start.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center opacity-30 text-[10px] font-black uppercase tracking-widest">No Sessions</div>
              )}
            </div>
            <div className="p-4 relative z-10">
              <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-white/5">JS Calendar Hub</button>
            </div>
          </div>

          {/* Activity Metrics Tile */}
          <div className={`${cardBase} md:col-span-8 h-[240px]`}>
            <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between">
               <h2 className={headerText}>Engagement Metrics</h2>
               <div className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#044A8D]"></span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">System Load</span>
               </div>
            </div>
            <div className="flex-1 px-4 py-2 bg-slate-50/20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{n: 'M', v: 40}, {n: 'T', v: 30}, {n: 'W', v: 60}, {n: 'T', v: 80}, {n: 'F', v: 50}]}>
                  <defs>
                    <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#044A8D" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#044A8D" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold'}}
                  />
                  <Area type="monotone" dataKey="v" stroke="#044A8D" fill="url(#colorV)" strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Backlog Tile */}
          <div className={`${cardBase} md:col-span-4 h-[240px]`}>
            <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between">
               <h2 className={headerText}>Pending Backlog</h2>
               <span className="text-[8px] font-black text-[#EF7A25] bg-orange-50 px-1.5 rounded uppercase">{tasks.length} Active</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scroll scrollbar-thin">
              {tasks.length > 0 ? (
                tasks.map((task, i) => (
                  <div key={i} className="p-2.5 bg-slate-50/50 hover:bg-orange-50/50 rounded-xl flex items-center justify-between group transition-all border border-transparent hover:border-orange-100">
                    <span className="text-[10px] font-bold text-slate-700 truncate mr-2">{task.title}</span>
                    <input type="checkbox" className="w-3.5 h-3.5 rounded-md border-slate-300 text-[#EF7A25] focus:ring-[#EF7A25] transition-all" />
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center opacity-30 text-[9px] font-black uppercase tracking-[0.2em]">Queue Empty</div>
              )}
            </div>
          </div>

        </div>
      )}
      
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scroll-white::-webkit-scrollbar { width: 4px; }
        .custom-scroll-white::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll-white::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Dashboard;