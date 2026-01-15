
import React, { useState, useEffect } from 'react';
import { User } from '../types';

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
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const deduplicate = <T,>(arr: T[], signatureFn: (item: T) => string): T[] => {
    const seen = new Set<string>();
    return arr.filter(item => {
      const sig = signatureFn(item).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!sig || seen.has(sig)) return false;
      seen.add(sig);
      return true;
    });
  };

  useEffect(() => {
    const fetchEcosystemData = async () => {
      if (!accessToken) return;
      setLoading(true);
      try {
        const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=label:IMPORTANT&maxResults=5', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const gmailData = await gmailRes.json();
        if (gmailData.messages) {
          const details = await Promise.all(
            gmailData.messages.map(async (msg: any) => {
              const d = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
                headers: { Authorization: `Bearer ${accessToken}` }
              });
              const meta = await d.json();
              const headers = meta.payload?.headers || [];
              return {
                id: msg.id,
                subject: headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)',
                from: (headers.find((h: any) => h.name === 'From')?.value || 'Unknown').split('<')[0].trim(),
                snippet: meta.snippet || '',
                date: new Date(headers.find((h: any) => h.name === 'Date')?.value || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
            })
          );
          setEmails(deduplicate(details, e => e.subject).slice(0, 5));
        }

        const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=10&singleEvents=true&orderBy=startTime`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const calData = await calRes.json();
        if (calData.items) {
          setCalendarEvents(deduplicate(calData.items as any[], (c: any) => c.summary || 'e').slice(0, 5));
        }
      } catch (err) {
        console.error("Sync failure", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEcosystemData();
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, [accessToken]);

  const cardBase = "bg-white dark:bg-[#1E293B] rounded-[1.5rem] border border-slate-200/40 dark:border-slate-800/50 shadow-sm flex flex-col overflow-hidden";

  return (
    <div className="space-y-4 max-w-[1100px] mx-auto animate-fadeIn">
      <div className="flex justify-between items-center px-2">
        <div>
          <h1 className="text-2xl font-black text-[#044A8D] dark:text-white">Assalamu Alaikum, {user.name.split(' ')[0]}</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Operational Workspace Control</p>
        </div>
        <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
          <p className="text-sm font-black tabular-nums text-slate-900 dark:text-white">{time}</p>
        </div>
      </div>

      {!accessToken ? (
        <div className={`${cardBase} h-40 items-center justify-center p-6 bg-slate-50/50 border-dashed`}>
          <button onClick={onSyncRequest} className="px-8 py-2.5 bg-[#044A8D] text-white font-black rounded-xl uppercase tracking-widest text-[10px] active:scale-95 transition-all">Enable Gmail & Calendar Hub</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-2">
          {/* Gmail Card */}
          <div className={`${cardBase} lg:col-span-7 h-[420px]`}>
            <div className="px-5 py-3 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-[#044A8D] dark:text-blue-400">Gmail</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scroll">
              {loading ? (
                <div className="h-full flex items-center justify-center"><div className="w-5 h-5 border-2 border-slate-200 border-t-[#044A8D] rounded-full animate-spin"></div></div>
              ) : emails.length > 0 ? (
                emails.map(e => (
                  <div key={e.id} className="p-3 bg-white dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl transition-colors cursor-pointer">
                    <div className="flex justify-between mb-0.5"><span className="text-[9px] font-black text-[#044A8D] dark:text-[#FAB51D]">{e.from}</span><span className="text-[8px] font-bold text-slate-400">{e.date}</span></div>
                    <h3 className="text-[11px] font-bold truncate text-slate-900 dark:text-white">{e.subject}</h3>
                    <p className="text-[10px] text-slate-400 line-clamp-1 italic">{e.snippet}</p>
                  </div>
                ))
              ) : <div className="py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">Inbox Zero</div>}
            </div>
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 text-center">
              <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer" className="text-[9px] font-black uppercase text-[#044A8D] dark:text-blue-400 hover:underline">Launch Gmail Dashboard</a>
            </div>
          </div>

          {/* Today's Agenda Card */}
          <div className={`${cardBase} lg:col-span-5 h-[420px]`}>
            <div className="px-5 py-3 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-[#044A8D] dark:text-blue-400">Today's Agenda</h2>
            </div>
            <div className="flex-1 p-5 space-y-4 overflow-y-auto custom-scroll">
              {loading ? (
                <div className="h-full flex items-center justify-center"><div className="w-5 h-5 border-2 border-slate-200 border-t-[#044A8D] rounded-full animate-spin"></div></div>
              ) : calendarEvents.length > 0 ? (
                <div className="border-l-2 border-slate-100 dark:border-slate-800 ml-1 space-y-4">
                  {calendarEvents.map(ev => (
                    <div key={ev.id} className="relative pl-4 group">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#EF7A25]"></div>
                      <span className="text-[8px] font-black text-[#044A8D] dark:text-blue-300 uppercase tracking-tighter">
                        {ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All Day'}
                      </span>
                      <h4 className="text-[11px] font-bold truncate text-slate-900 dark:text-white group-hover:text-[#EF7A25] transition-colors">{ev.summary}</h4>
                    </div>
                  ))}
                </div>
              ) : <div className="py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">No Events Scheduled</div>}
            </div>
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 text-center">
              <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" className="text-[9px] font-black uppercase text-[#044A8D] dark:text-blue-400 hover:underline">Open Full Schedule</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
