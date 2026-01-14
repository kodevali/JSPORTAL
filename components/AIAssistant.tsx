
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { getDeepThinkingResponse } from '../services/geminiService';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isThinking?: boolean;
}

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'chat' | 'voice' | 'think'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: 'JS Intelligence Terminal active. Specify facilitator needs.' }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isProcessing]);

  const toggleVoice = async () => {
    if (mode !== 'voice') {
      setMode('voice');
      return;
    }
    // Simple toggle logic for voice session
    setIsOpen(true);
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsProcessing(true);

    try {
      if (mode === 'think') {
        const response = await getDeepThinkingResponse(userMsg);
        setMessages(prev => [...prev, { role: 'assistant', content: response || '', isThinking: true }]);
      } else {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: userMsg,
          config: { systemInstruction: 'You are a professional JS Bank assistant. Be extremely concise and efficient.' }
        });
        setMessages(prev => [...prev, { role: 'assistant', content: response.text || '' }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sync error.' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-6 bottom-6 z-[60] w-12 h-12 bg-[#044A8D] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
      >
        {isOpen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        )}
      </button>

      <div className={`fixed right-6 bottom-20 z-50 w-[340px] h-[520px] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-white/10 transition-all duration-400 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-75 opacity-0 pointer-events-none'}`}>
        <div className="px-5 py-4 bg-[#044A8D] text-white flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">AI Hub</span>
            <span className="text-[8px] font-bold opacity-60 uppercase tracking-tight">Active Terminal</span>
          </div>
          <div className="flex space-x-1.5">
            <button onClick={() => setMode('chat')} className={`p-1.5 rounded-lg transition-all ${mode === 'chat' ? 'bg-white/20' : 'hover:bg-white/10'}`}><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeWidth={2.5}/></svg></button>
            <button onClick={() => setMode('think')} className={`p-1.5 rounded-lg transition-all ${mode === 'think' ? 'bg-[#FAB51D] text-[#044A8D]' : 'hover:bg-white/10'}`}><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeWidth={2.5}/></svg></button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] px-3.5 py-2.5 rounded-2xl text-[12px] font-medium leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-[#044A8D] text-white rounded-tr-none shadow-sm' 
                    : m.role === 'system'
                    ? 'bg-transparent text-slate-400 text-center w-full uppercase text-[8px] font-black'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-700'
                }`}>
                  {m.isThinking && (
                    <div className="text-[8px] font-black text-[#FAB51D] uppercase mb-1">Deep Reasoned Result</div>
                  )}
                  {m.content}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl rounded-tl-none shadow-sm flex space-x-1">
                  <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={mode === 'think' ? 'Deep query...' : 'Message...'}
                className="flex-1 bg-transparent border-none outline-none px-2 text-[12px] font-bold text-slate-900 dark:text-white"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
                className="p-2 bg-[#044A8D] text-white rounded-lg transition-all active:scale-90 disabled:opacity-30"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIAssistant;
