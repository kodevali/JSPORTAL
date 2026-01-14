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
  onSyncRequest: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, accessToken, onSyncRequest }) => {
  const [greeting, setGreeting] = useState("Initializing JSBL workspace...");
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loadingEcosystem, setLoadingEcosystem] = useState(false);
  const [weather, setWeather] = useState({ temp: "28°C", desc: "Clear Sky", emoji: "☀️", sources: [] as any[] });

  useEffect(() => {
    const fetchData = async () => {
      const res = await getPersonalizedGreeting(user.name, user.role);
      setGreeting(res || `Welcome back, ${user.name}`);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const w = await getCurrentWeather(pos.coords.latitude, pos.coords.longitude);
          setWeather(w);
        });
      }

      if (accessToken) {
        setLoadingEcosystem(true);
        try {
          // 1. Fetch Top 5 'IMPORTANT' emails
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

          // 2. Fetch Pending Tasks
          const tasksRes = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?maxResults=5', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const tasksData = await tasksRes.json();
          setTasks(tasksData.items || []);

          // 3. Fetch Calendar Events
          const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=3&singleEvents=true&orderBy=startTime`, {
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

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Salam, {user.name.split(' ')[0]}</h1>
          <p className="text-slate-500 mt-2 text-lg font-medium leading-relaxed italic opacity-80">{greeting}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-white px-8 py-4 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center space-x-6 relative group">
            <div className="text-right">
              <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{time}</p>
              <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">Karachi, Pakistan</p>
            </div>
            <div className="flex flex-col items-center border-l border-slate-100 pl-6">
               <span className="text-2xl mb-1">{weather.emoji}</span>
               <span className="text-xs font-bold text-slate-700">{weather.temp}</span>
            </div>
            {weather.sources && weather.sources.length > 0 && (
              <div className="absolute top-full right-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-3 rounded-xl shadow-xl border border-slate-100 z-30 min-w-[200px]">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Verified Data Source</p>
                <div className="space-y-1">
                  {weather.sources.map((s, i) => s.web && (
                    <a key={i} href={s.web.uri} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-blue-600 truncate hover:underline">
                      {s.web.title || s.web.uri}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {!accessToken ? (
        <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-blue-100 flex flex-col items-center text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="w-20 h-20 bg-blue-600/10 text-blue-600 rounded-[2rem] flex items-center justify-center">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div className="max-w-md">
            <h2 className="text-2xl font-bold text-slate-900">Authorize Workspace Integration</h2>
            <p className="text-slate-500 mt-2">To view priority communications and schedules, please authorize secure ecosystem access.</p>
          </div>
          <button 
            onClick={onSyncRequest}
            className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 hover:-translate-y-1 active:scale-95 text-sm uppercase tracking-widest"
          >
            Reconnect Workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Gmail Priority Inbox */}
          <div className="md:col-span-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-3">
                <div className="p-3 bg-blue-600 text-white rounded-2xl">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                </div>
                <span>Priority Communications</span>
              </h2>
              <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                Top 5 Important
              </span>
            </div>
            
            <div className="space-y-4 flex-1">
              {loadingEcosystem ? (
                <div className="flex-1 flex items-center justify-center h-full min-h-[350px]">
                  <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              ) : emails.length > 0 ? (
                emails.map((email) => (
                  <div key={email.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-300 cursor-pointer group">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[11px] font-black text-blue-600 uppercase tracking-tight truncate max-w-[250px]">{email.from}</span>
                      <span className="text-[10px] font-bold text-slate-400">{email.date}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1.5">{email.subject}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1 font-medium opacity-80">{email.snippet}</p>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-24 opacity-40">
                  <svg className="w-16 h-16 mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <p className="text-sm font-black uppercase tracking-widest">No important items</p>
                </div>
              )}
            </div>
            
            <button className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-colors shadow-lg shadow-slate-200">
              Access Full Inbox
            </button>
          </div>

          {/* Schedule */}
          <div className="md:col-span-4 bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 text-white relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" /></svg>
            </div>
            <h2 className="text-xl font-bold mb-8 relative z-10 flex items-center space-x-2">
               <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
               <span>Today's Sessions</span>
            </h2>
            <div className="space-y-6 relative z-10 flex-1">
              {calendarEvents.length > 0 ? (
                calendarEvents.map((event, i) => (
                  <div key={i} className="flex items-center space-x-4 border-l-4 border-blue-600 pl-6 group cursor-default">
                    <div>
                      <h4 className="font-bold text-sm group-hover:text-blue-400 transition-colors">{event.summary}</h4>
                      <p className="text-[11px] text-slate-400 uppercase font-black tracking-widest mt-1">
                        {new Date(event.start.dateTime || event.start.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-30 py-24">
                  <p className="text-xs italic">Clear schedule</p>
                </div>
              )}
            </div>
            <button className="mt-8 relative z-10 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border border-white/10">
              JS Calendar
            </button>
          </div>

          {/* Tasks */}
          <div className="md:col-span-4 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center space-x-3">
               <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               <span>Task List</span>
            </h2>
            <div className="space-y-4">
              {tasks.length > 0 ? (
                tasks.map((task, i) => (
                  <div key={i} className="p-5 bg-slate-50 rounded-2xl flex items-center justify-between group hover:bg-green-50 transition-colors">
                    <span className="text-sm font-extrabold text-slate-700 group-hover:text-green-800 line-clamp-1">{task.title}</span>
                    <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-300 text-green-600 focus:ring-green-500 transition-all cursor-pointer" />
                  </div>
                ))
              ) : (
                <div className="py-24 flex flex-col items-center justify-center opacity-40">
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tasks Complete</p>
                </div>
              )}
            </div>
          </div>

          {/* Productivity Chart */}
          <div className="md:col-span-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-xl font-bold text-slate-900">Engagement Metrics</h2>
               <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">System Activity</span>
               </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{name: 'Mon', v: 400}, {name: 'Tue', v: 300}, {name: 'Wed', v: 600}, {name: 'Thu', v: 800}, {name: 'Fri', v: 500}]}>
                  <defs>
                    <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)', padding: '1rem' }}
                  />
                  <Area type="monotone" dataKey="v" stroke="#2563eb" fill="url(#usageGrad)" strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;