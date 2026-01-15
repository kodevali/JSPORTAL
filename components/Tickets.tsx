
import React, { useState, useEffect } from 'react';
import { User, UserRole, Ticket } from '../types';

interface TicketsProps {
  user: User;
}

const Tickets: React.FC<TicketsProps> = ({ user }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [formData, setFormData] = useState({ subject: '', description: '', priority: 'LOW' as Ticket['priority'], category: 'General' });

  const isIT = user.role === UserRole.IT;

  useEffect(() => {
    const saved = localStorage.getItem('jsbl_tickets');
    if (saved) {
      try { setTickets(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('jsbl_tickets', JSON.stringify(tickets));
  }, [tickets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTicket: Ticket = {
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      ...formData,
      status: 'OPEN',
      createdBy: user.name,
      createdAt: new Date().toISOString(),
      responses: []
    };
    setTickets([newTicket, ...tickets]);
    setIsCreating(false);
    setFormData({ subject: '', description: '', priority: 'LOW', category: 'General' });
  };

  const updateStatus = (id: string, status: Ticket['status']) => {
    setTickets(tickets.map(t => t.id === id ? { ...t, status } : t));
    if (selectedTicket?.id === id) setSelectedTicket({ ...selectedTicket, status });
  };

  return (
    <div className="space-y-6 px-2 animate-fadeIn pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Support Desk</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Incident Registry & IT Resolution</p>
        </div>
        {!isIT && !isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-[#044A8D] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95"
          >
            Log New Ticket
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scroll">
          {tickets.length === 0 ? (
            <div className="p-10 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase">System Clear</p>
            </div>
          ) : (
            tickets.map(ticket => (
              <div 
                key={ticket.id} 
                onClick={() => setSelectedTicket(ticket)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedTicket?.id === ticket.id ? 'bg-[#044A8D] text-white border-[#044A8D]' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded ${selectedTicket?.id === ticket.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{ticket.priority}</span>
                  <span className="text-[8px] opacity-60 font-bold">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-xs truncate mb-1">{ticket.subject}</h3>
                <div className="flex justify-between items-center mt-3">
                   <span className="text-[9px] font-black uppercase opacity-60">{ticket.status}</span>
                   <span className="text-[9px] font-bold">#{ticket.id}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-8">
          {isCreating ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
              <h2 className="text-lg font-black mb-6 uppercase tracking-tight">New Incident</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input required className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 outline-none text-xs font-bold" placeholder="Subject" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}/>
                <textarea required rows={4} className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 outline-none text-xs font-medium" placeholder="Describe problem" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}/>
                <button type="submit" className="w-full py-4 bg-[#044A8D] text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg">Submit Ticket</button>
              </form>
            </div>
          ) : selectedTicket ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm h-full">
              <div className="flex justify-between items-start mb-6 border-b border-slate-50 dark:border-slate-800 pb-6">
                <div>
                  <h2 className="text-xl font-black">{selectedTicket.subject}</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Ref: #{selectedTicket.id} • {selectedTicket.category}</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${selectedTicket.status === 'OPEN' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{selectedTicket.status}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl mb-6">
                <p className="text-xs font-medium leading-relaxed">{selectedTicket.description}</p>
              </div>
              {isIT && selectedTicket.status === 'OPEN' && (
                <div className="flex justify-end space-x-3">
                  <button onClick={() => updateStatus(selectedTicket.id, 'CLOSED')} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Mark Resolved</button>
                </div>
              )}
            </div>
          ) : <div className="h-full flex items-center justify-center p-20 bg-slate-50 dark:bg-slate-800/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 text-[10px] font-black uppercase tracking-widest">Select Ticket Logs</div>}
        </div>
      </div>
    </div>
  );
};

export default Tickets;
