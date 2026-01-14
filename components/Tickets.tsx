
import React, { useState } from 'react';
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

  // Form State
  const [formData, setFormData] = useState({ subject: '', description: '', priority: 'LOW' as Ticket['priority'], category: 'General' });

  // Fix: Property 'IT_ADMIN' does not exist on type 'typeof UserRole'. Use 'IT' instead.
  const isIT = user.role === UserRole.IT;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTicket: Ticket = {
      id: Math.random().toString(36).substr(2, 9),
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

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Support Center</h1>
          <p className="text-slate-500">{isIT ? 'Manage incoming IT support requests.' : 'Submit and track your support tickets.'}</p>
        </div>
        {!isIT && !isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span>New Ticket</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket List */}
        <div className={`lg:col-span-1 space-y-4 max-h-[700px] overflow-y-auto pr-2`}>
          {tickets.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-300 text-center">
              <p className="text-slate-400">No tickets found.</p>
            </div>
          ) : (
            tickets.map(ticket => (
              <div 
                key={ticket.id} 
                onClick={() => {
                  setSelectedTicket(ticket);
                  setAiSuggestion(null);
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  selectedTicket?.id === ticket.id 
                    ? 'bg-blue-50 border-blue-200 shadow-md ring-1 ring-blue-500' 
                    : 'bg-white border-slate-100 shadow-sm hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    ticket.priority === 'HIGH' ? 'bg-red-100 text-red-600' : 
                    ticket.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {ticket.priority}
                  </span>
                  <span className="text-[10px] text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-1 line-clamp-1">{ticket.subject}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">{ticket.description}</p>
                <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-2">
                     <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-bold">
                       {ticket.createdBy[0]}
                     </div>
                     <span className="text-xs text-slate-600">{ticket.createdBy}</span>
                   </div>
                   <span className={`text-xs font-bold ${ticket.status === 'OPEN' ? 'text-green-600' : 'text-slate-400'}`}>{ticket.status}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* View/Create Section */}
        <div className="lg:col-span-2">
          {isCreating ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-lg animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Create Support Ticket</h2>
                <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief summary of the issue"
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      <option>General</option>
                      <option>Hardware</option>
                      <option>Software</option>
                      <option>Access/SSO</option>
                      <option>Network</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Priority</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.priority}
                      onChange={e => setFormData({...formData, priority: e.target.value as any})}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Detailed Description</label>
                  <textarea 
                    required 
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Please describe your problem in detail..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20">Submit Ticket</button>
              </form>
            </div>
          ) : selectedTicket ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">{selectedTicket.subject}</h2>
                  <p className="text-slate-500 text-sm">#{selectedTicket.id} &bull; {selectedTicket.category} &bull; Created by {selectedTicket.createdBy}</p>
                </div>
                <div className="flex flex-col items-end">
                   <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{selectedTicket.status}</span>
                   {isIT && (
                     <button 
                      onClick={() => generateSuggestion(selectedTicket)}
                      className="mt-4 text-xs font-bold text-blue-600 flex items-center space-x-1 hover:text-blue-800"
                      disabled={suggesting}
                     >
                       <svg className={`w-4 h-4 ${suggesting ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                       <span>{suggesting ? 'Analyzing...' : 'Get AI Reply Suggestion'}</span>
                     </button>
                   )}
                </div>
              </div>

              <div className="space-y-6 mb-8">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>

                {aiSuggestion && (
                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 relative overflow-hidden">
                    <div className="flex items-center space-x-2 text-blue-800 font-bold text-sm mb-3">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.95a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM16.243 17.243a1 1 0 11-1.414-1.414l.707-.707a1 1 0 111.414 1.414l-.707.707z" /></svg>
                      <span>AI Response Suggestion</span>
                    </div>
                    <p className="text-blue-900 text-sm italic">{aiSuggestion}</p>
                    <button 
                      onClick={() => setAiSuggestion(null)}
                      className="absolute top-4 right-4 text-blue-300 hover:text-blue-500"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-8">
                <h4 className="font-bold text-slate-900 mb-4">Reply to Ticket</h4>
                <textarea 
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  placeholder="Type your response here..."
                />
                <div className="flex justify-end space-x-3">
                  {isIT && <button className="px-6 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">Close Ticket</button>}
                  <button className="px-8 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">Send Reply</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-slate-50 border border-slate-100 rounded-3xl border-dashed">
              <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                 <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Select a ticket to view details</h3>
              <p className="text-slate-500 max-w-xs">Choose a conversation from the left panel to manage or respond to the support request.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tickets;
