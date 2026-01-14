import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getPersonalizedGreeting, getCurrentWeather } from '../services/geminiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  const [greeting, setGreeting] = useState("Initializing workspace...");
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

          const tasksRes = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?maxResults=3', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const tasksData = await tasksRes.json();
          setTasks(tasksData.items || []);

          const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=4&singleEvents=true&orderBy=startTime`, {
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

  const cardStyle = "bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col";

  return (
    <div className="space-y-4 animate-fadeIn max-w-full">
      {/* Top Bar - More Compact */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-[#044A8D] tracking-tight">Salam, {user.name.split(' ')[0]}</h1>
          <p className="text-slate-400 text-xs font-medium truncate max-w-lg">{greeting}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="text-right border-r border-slate-100 pr-4">
              <p className="text-lg font-black text-slate-800 leading-none">{time}</p>
              <p className="text-[8px] text-[#044A8D] font-bold uppercase tracking-widest mt-0.5">Karachi HQ</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">{weather.emoji}</span>
              <span className="text-xs font-bold text-slate-700">{weather.temp}</span>
            </div>
          </div>
        </div>
      </div>

      {!accessToken && !isAuthorizing ? (
        <div className={`${cardStyle} p-8 items-center text-center space-y-4 h-64 justify-center bg-blue-50/50`}>
          <div className="p-3 bg-[#044A8D] text-white rounded-full">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900">Ecosystem Link Required</h2>
          <button onClick={onSyncRequest} className="px-6 py-2.5 bg-[#044A8D] text-white font-bold rounded-lg hover:bg-blue-800 transition-all shadow-md text-xs uppercase tracking-widest">Authorize Access</button>
        </div>
      ) : isAuthorizing ? (
        <div className={`${cardStyle} p-8 items-center justify-center space-y-4 h-64`}>
          <div className="w-8 h-8 border-3 border-slate-100 border-t-[#044A8D] rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-[#044A8D] uppercase tracking-widest animate-pulse">Syncing Services...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
          {/* Priority Feed - The main big square */}
          <div className={`${cardStyle} md:col-span-2 h-[380px]`}>
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-[#EF7A25]"></div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Priority Communications</h2>
              </div>
              <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase">GMAIL</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
              {loadingEcosystem ? (
                <div className="flex items-center justify-center h-full">
                   <div className="w-6 h-6 border-2 border-slate-100 border-t-[#044A8D] rounded-full animate-spin"></div>
                </div>
              ) : emails.map((email) => (
                <div key={email.id} className="p-3 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all cursor-pointer group shadow-sm">
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="text-[10px] font-black text-[#044A8D] uppercase truncate w-2/3">{email.from}</span>
                    <span className="text-[9px] font-bold text-slate-400">{email.date}</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1 mb-0.5 group-hover:text-[#EF7A25]">{email.subject}</h3>
                  <p className="text-[10px] text-slate-500 line-clamp-1 opacity-80">{email.snippet}</p>
                </div>
              ))}
            </div>
            
            <div className="p-3 bg-slate-50/50 border-t border-slate-50">
              <button className="w-full py-2 bg-[#044A8D] text-white text-[9px] font-black rounded-lg uppercase tracking-[0.15em] hover:bg-blue-800 transition-colors shadow-sm">Access All Mail</button>
            </div>
          </div>

          {/* Today's Sessions - Side Square */}
          <div className={`${cardStyle} h-[380px] bg-[#044A8D] text-white`}>
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-[#FAB51D]"></div>
                <h2 className="text-sm font-black uppercase tracking-widest">Calendar</h2>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {calendarEvents.length > 0 ? (
                calendarEvents.map((event, i) => (
                  <div key={i} className="flex items-start space-x-4 group border-l-2 border-[#FAB51D] pl-4">
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs line-clamp-1 group-hover:text-[#FAB51D] transition-colors">{event.summary}</h4>
                      <p className="text-[10px] text-blue-200 uppercase font-black tracking-wider mt-0.5">
                        {new Date(event.start.dateTime || event.start.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center opacity-30 italic text-xs">Clear schedule</div>
              )}
            </div>
            <div className="p-4">
              <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-white/10">Full Calendar</button>
            </div>
          </div>

          {/* Engagement Chart - Lower Tighter Tiles */}
          <div className={`${cardStyle} md:col-span-2 h-[250px]`}>
            <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between">
               <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Activity Metrics</h2>
               <div className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#044A8D]"></span>
                  <span className="text-[9px] font-black text-slate-400 uppercase">Load</span>
               </div>
            </div>
            <div className="flex-1 px-4 py-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{n: 'M', v: 40}, {n: 'T', v: 30}, {n: 'W', v: 60}, {n: 'T', v: 80}, {n: 'F', v: 50}]}>
                  <defs>
                    <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#044A8D" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#044A8D" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px'}} />
                  <Area type="monotone" dataKey="v" stroke="#044A8D" fill="url(#colorV)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Backlog Tile */}
          <div className={`${cardStyle} h-[250px]`}>
            <div className="px-5 py-3 border-b border-slate-50">
               <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Backlog</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {tasks.length > 0 ? (
                tasks.map((task, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 hover:bg-orange-50 rounded-lg flex items-center justify-between group transition-colors shadow-sm">
                    <span className="text-[11px] font-bold text-slate-700 truncate mr-2">{task.title}</span>
                    <input type="checkbox" className="w-3.5 h-3.5 rounded-md border-slate-300 text-[#EF7A25] focus:ring-[#EF7A25]" />
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center opacity-30 text-[10px] font-bold uppercase tracking-widest">All caught up</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;