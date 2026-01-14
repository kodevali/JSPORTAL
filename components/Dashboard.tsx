
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
  const [greeting, setGreeting] = useState("Loading workspace...");
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loadingEcosystem, setLoadingEcosystem] = useState(false);
  const [weather, setWeather] = useState({ temp: "28°C", desc: "Clear", emoji: "☀️", sources: [] as any[] });

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

          const tasksRes = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?maxResults=5', {
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

  return (
    <div className="space-y-5 animate-fadeIn max-w-[1400px] mx-auto">
      {/* Compact Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline space-x-3">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Salam, {user.name.split(' ')[0]}</h1>
          <span className="text-slate-400 text-sm font-medium border-l border-slate-200 pl-3 leading-none truncate max-w-md">{greeting}</span>
        </div>
        
        <div className="bg-white px-5 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="text-right border-r border-slate-100 pr-4">
            <p className="text-xl font-black text-slate-900 leading-none">{time}</p>
            <p className="text-[9px] text-blue-600 font-bold uppercase tracking-widest mt-0.5">Karachi HQ</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xl">{weather.emoji}</span>
            <span className="text-xs font-bold text-slate-700">{weather.temp}</span>
          </div>
        </div>
      </div>

      {isAuthorizing ? (
        <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-4 h-[500px]">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
          <h2 className="text-lg font-black text-slate-900">Synchronizing Workspace...</h2>
        </div>
      ) : !accessToken ? (
        <div className="bg-white rounded-3xl p-12 shadow-sm border border-blue-100 flex flex-col items-center text-center space-y-6 relative overflow-hidden h-[400px] justify-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="w-16 h-16 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div className="max-w-sm">
            <h2 className="text-xl font-bold text-slate-900">Workspace Authorization Required</h2>
            <p className="text-slate-500 text-sm mt-1">Connect your secure bank ecosystem to access priority communications and schedules.</p>
          </div>
          <button 
            onClick={onSyncRequest}
            className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-xs uppercase tracking-widest"
          >
            Authorize Access
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-full">
          {/* Priority Communications - Fixed Height Scrollable */}
          <div className="md:col-span-8 bg-white rounded-3xl shadow-sm border border-slate-100 p-5 flex flex-col h-[420px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 text-white rounded-xl">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                </div>
                <h2 className="text-lg font-bold text-slate-900">Priority Feed</h2>
              </div>
              <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider">GMAIL API</span>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-thin">
              {loadingEcosystem ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              ) : emails.length > 0 ? (
                emails.map((email) => (
                  <div key={email.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-tight truncate max-w-[200px]">{email.from}</span>
                      <span className="text-[9px] font-bold text-slate-400">{email.date}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-0.5">{email.subject}</h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1 opacity-80">{email.snippet}</p>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 h-full">
                  <p className="text-xs font-bold uppercase tracking-widest">Inbox Zero</p>
                </div>
              )}
            </div>
            
            <button className="mt-4 w-full py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors">
              Access Full Inbox
            </button>
          </div>

          {/* Today's Sessions - Side Tile */}
          <div className="md:col-span-4 bg-slate-900 rounded-3xl shadow-sm p-5 text-white flex flex-col h-[420px] relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-600/10 rounded-full blur-xl"></div>
            <h2 className="text-lg font-bold mb-5 flex items-center space-x-2 relative z-10">
               <span className="w-2 h-2 rounded-full bg-blue-500"></span>
               <span>Sessions</span>
            </h2>
            <div className="space-y-4 flex-1 overflow-y-auto pr-1 relative z-10">
              {calendarEvents.length > 0 ? (
                calendarEvents.map((event, i) => (
                  <div key={i} className="flex items-center space-x-4 border-l-2 border-blue-600 pl-4 group cursor-default">
                    <div>
                      <h4 className="font-bold text-xs group-hover:text-blue-400 transition-colors">{event.summary}</h4>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">
                        {new Date(event.start.dateTime || event.start.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-30 h-full">
                  <p className="text-xs italic">Clear schedule</p>
                </div>
              )}
            </div>
            <button className="mt-5 w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors border border-white/5">
              Launch Calendar
            </button>
          </div>

          {/* Engagement Chart - Compact Height */}
          <div className="md:col-span-8 bg-white rounded-3xl shadow-sm border border-slate-100 p-5 flex flex-col h-[280px]">
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-bold text-slate-900">Activity Metrics</h2>
               <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">System Load</span>
               </div>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{name: 'Mon', v: 400}, {name: 'Tue', v: 300}, {name: 'Wed', v: 600}, {name: 'Thu', v: 800}, {name: 'Fri', v: 500}]}>
                  <defs>
                    <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="v" stroke="#2563eb" fill="url(#usageGrad)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Task List - Squarer Tile */}
          <div className="md:col-span-4 bg-white rounded-3xl shadow-sm border border-slate-100 p-5 flex flex-col h-[280px]">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Backlog</h2>
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {tasks.length > 0 ? (
                tasks.map((task, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between group hover:bg-green-50 transition-colors">
                    <span className="text-xs font-bold text-slate-700 group-hover:text-green-800 line-clamp-1">{task.title}</span>
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer" />
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-30 h-full">
                   <p className="text-[10px] font-black uppercase tracking-widest">Tasks Complete</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
