
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getPersonalizedGreeting } from '../services/geminiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  user: User;
}

const data = [
  { name: 'Mon', usage: 400 },
  { name: 'Tue', usage: 300 },
  { name: 'Wed', usage: 200 },
  { name: 'Thu', usage: 278 },
  { name: 'Fri', usage: 189 },
];

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [greeting, setGreeting] = useState("Loading greeting...");
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const fetchGreeting = async () => {
      const res = await getPersonalizedGreeting(user.name, user.role);
      setGreeting(res || `Welcome, ${user.name}`);
    };
    fetchGreeting();

    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, [user]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Good Day, {user.name}</h1>
          <p className="text-slate-500 mt-1 italic">"{greeting}"</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-3">
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-800">{time}</p>
            <p className="text-xs text-slate-400 uppercase font-bold">Karachi, PK</p>
          </div>
          <div className="text-3xl">☀️</div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gmail Style Notifications */}
        <div className="md:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
              <span>Recent Communications</span>
            </h2>
            <button className="text-blue-600 text-sm font-medium hover:underline">Mark all read</button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">HR</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">HR Department</h3>
                    <span className="text-xs text-slate-400">2h ago</span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-1">Reminder: Annual performance reviews are starting next week. Please prepare your documentation.</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tasks */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            <span>Your Tasks</span>
          </h2>
          <div className="space-y-3">
            {['Approve Expense Reports', 'Review Q4 Budget', 'Update Security Policy'].map((task, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                <span className="text-sm text-slate-700">{task}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors">Add New Task</button>
        </div>

        {/* Usage Analytics */}
        <div className="md:col-span-3 bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Portal Activity</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="usage" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsage)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
