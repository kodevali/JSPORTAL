
import React, { useState, useEffect } from 'react';
import { User, UserRole, Ticket } from '../types';
import { getAITicketSuggestions } from '../services/geminiService';

interface TicketsProps {
  user: User;
}

const Tickets: React.FC<TicketsProps> = ({ user }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [formData, setFormData] = useState({ subject: '', description: '', priority: 'LOW' as Ticket['priority'], category: 'General' });

  const isIT = user.role === UserRole.IT;

  // Persistence: Load tickets
  useEffect(() => {
    const saved = localStorage.getItem('jsbl_tickets');
    if (saved) {
      try {
        setTickets(JSON.parse(saved));
      } catch (e) {
        console.error("Ticket load error:", e);
      }
    }
  }, []);

  // Persistence: Save tickets
  useEffect(() => {
    localStorage.setItem('jsbl_tickets', JSON.stringify(tickets));
  }, [tickets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTicket: Ticket = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
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

  const generateSuggestion = async (ticket: Ticket) => {
    setSuggesting(true);
    const suggestion = await getAITicketSuggestions(ticket.subject, ticket.description);
    setAiSuggestion(suggestion || null);
    setSuggesting(false);
  };

  const updateStatus = (id: string, status: Ticket['status']) => {
    setTickets(tickets.map(t => t.id === id ? { ...t, status } : t));
    if (selectedTicket?.id === id) setSelectedTicket({ ...selectedTicket, status });
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Support Desk</h1>
          <p className="text-slate-500 mt-1">{isIT ? 'Central Hub for Enterprise IT Resolution.' : 'Submit a request to our specialized IT team.'}</p>
        </div>
        {!isIT && !isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200 transition-all flex items-center space-x-3 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span>Raise Incident</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-4 max-h-[750px] overflow-y-auto pr-4 scroll-smooth">
          {tickets.length === 0 ? (
            <div className="bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-slate-100 text-center">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
               </div>
               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Active Incidents</p>
            </div>
          ) : (
            tickets.map(ticket => (
              <div 
                key={ticket.id} 
                onClick={() => {
                  setSelectedTicket(ticket);
                  setAiSuggestion(null);
                }}
                className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer group ${
                  selectedTicket?.id === ticket.id 
                    ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-100 text-white' 
                    : 'bg-white border-slate-50 hover:border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                    selectedTicket?.id === ticket.id ? 'bg-white/20 text-white' : 
                    ticket.priority === 'HIGH' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'
                  }`}>
                    {ticket.priority}
                  </span>
                  <span className={`text-[9px] font-bold ${selectedTicket?.id === ticket.id ? 'text-blue-100' : 'text-slate-300'}`}>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-black text-lg mb-2 line-clamp-1">{ticket.subject}</h3>
                <p className={`text-xs line-clamp-2 mb-6 font-medium ${selectedTicket?.id === ticket.id ? 'text-blue-100' : 'text-slate-500'}`}>
                  {ticket.description}
                </p>
                <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-3">
                     <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-sm ${selectedTicket?.id === ticket.id ? 'bg-white text-blue-600' : 'bg-slate-900 text-white'}`}>
                       {ticket.createdBy[0]}
                     </div>
                     <span className="text-[10px] font-bold tracking-tight uppercase">{ticket.createdBy.split(' ')[0]}</span>
                   </div>
                   <span className={`text-[10px] font-black tracking-[0.1em] uppercase ${selectedTicket?.id === ticket.id ? 'text-white' : ticket.status === 'OPEN' ? 'text-green-600' : 'text-slate-400'}`}>
                     {ticket.status}
                   </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-8">
          {isCreating ? (
            <div className="bg-white rounded-[3rem] p-10 shadow-2xl animate-fadeIn border border-slate-50">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Create Support Ticket</h2>
                <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="md:col-span-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Issue Subject</label>
                    <input 
                      required 
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-900"
                      placeholder="e.g. Access Denied to Swift Terminal"
                      value={formData.subject}
                      onChange={e => setFormData({...formData, subject: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Service Category</label>
                    <select 
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-blue-100 font-bold"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      <option>General Support</option>
                      <option>Hardware Replacement</option>
                      <option>Software Licensing</option>
                      <option>Authentication/SSO</option>
                      <option>Network Connectivity</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Business Impact</label>
                    <select 
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-blue-100 font-bold"
                      value={formData.priority}
                      onChange={e => setFormData({...formData, priority: e.target.value as any})}
                    >
                      <option value="LOW">Low - No impact to ops</option>
                      <option value="MEDIUM">Medium - Performance degraded</option>
                      <option value="HIGH">High - Service interrupted</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Describe the Problem</label>
                  <textarea 
                    required 
                    rows={6}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-medium text-slate-700 leading-relaxed"
                    placeholder="Provide as much detail as possible to help our technicians..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-[2rem] hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest text-sm">Submit Incident Report</button>
              </form>
            </div>
          ) : selectedTicket ? (
            <div className="bg-white rounded-[3rem] p-10 border border-slate-50 shadow-sm animate-fadeIn">
              <div className="flex items-start justify-between mb-10 border-b border-slate-50 pb-10">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                     <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{selectedTicket.category}</span>
                     <span className="text-slate-300">•</span>
                     <span className="text-[10px] font-bold text-slate-400">ID: #{selectedTicket.id}</span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 mb-2 leading-tight">{selectedTicket.subject}</h2>
                  <p className="text-slate-500 font-medium">Requested by {selectedTicket.createdBy} • {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-col items-end space-y-4">
                   <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedTicket.status === 'OPEN' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {selectedTicket.status}
                   </div>
                   {isIT && selectedTicket.status === 'OPEN' && (
                     <button 
                      onClick={() => generateSuggestion(selectedTicket)}
                      className="group p-3 bg-blue-50 text-blue-600 rounded-2xl flex items-center space-x-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      disabled={suggesting}
                     >
                       <svg className={`w-5 h-5 ${suggesting ? 'animate-spin' : 'group-hover:rotate-12'} transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                       <span className="text-[10px] font-black uppercase tracking-widest">{suggesting ? 'Consulting Gemini...' : 'AI Suggestions'}</span>
                     </button>
                   )}
                </div>
              </div>

              <div className="space-y-8 mb-12">
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                  <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>

                {aiSuggestion && (
                  <div className="bg-blue-600 p-8 rounded-[2.5rem] relative overflow-hidden text-white shadow-2xl shadow-blue-200">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                       <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" /></svg>
                    </div>
                    <div className="flex items-center space-x-3 font-black text-xs uppercase tracking-widest mb-4">
                      <div className="p-2 bg-white/20 rounded-lg">✨</div>
                      <span>Suggested IT Resolution</span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed opacity-90 italic">"{aiSuggestion}"</p>
                    <div className="mt-8 flex items-center space-x-4">
                       <button className="px-6 py-2 bg-white text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Apply Suggestion</button>
                       <button onClick={() => setAiSuggestion(null)} className="text-[10px] font-bold text-white/60 hover:text-white uppercase tracking-widest">Discard</button>
                    </div>
                  </div>
                )}
              </div>

              {isIT && selectedTicket.status === 'OPEN' && (
                <div className="border-t border-slate-50 pt-10">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Technician Response</h4>
                  <textarea 
                    rows={4}
                    className="w-full px-8 py-6 rounded-[2rem] bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-blue-100 mb-6 font-medium"
                    placeholder="Type official resolution or update..."
                  />
                  <div className="flex justify-end space-x-4">
                    <button 
                      onClick={() => updateStatus(selectedTicket.id, 'CLOSED')}
                      className="px-8 py-3 border-2 border-slate-100 text-slate-400 font-black rounded-2xl hover:bg-slate-50 hover:text-slate-600 transition-all text-xs uppercase tracking-widest"
                    >
                      Close Incident
                    </button>
                    <button className="px-10 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 text-xs uppercase tracking-widest">
                      Publish Response
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center p-20 bg-slate-50 border-2 border-slate-50 rounded-[3rem] border-dashed">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-sm">
                 <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Technical Command Center</h3>
              <p className="text-slate-400 font-medium max-w-xs leading-relaxed">Select a ticket from the registry to view logs, status, and AI resolution suggestions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tickets;
