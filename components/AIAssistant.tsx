
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
    { role: 'system', content: 'Welcome to your JS Executive Assistant. How can I facilitate your operations today?' }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Voice State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isProcessing]);

  // Voice Handlers
  const toggleVoice = async () => {
    if (isVoiceActive) {
      sessionRef.current?.close();
      setIsVoiceActive(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

      sessionRef.current = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
          systemInstruction: 'You are a professional JS Bank executive assistant. Respond concisely and professionally in voice conversation.'
        },
        callbacks: {
          onopen: () => {
            setIsVoiceActive(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              const base64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)));
              sessionRef.current?.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg) => {
            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
              const binary = atob(audioData);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
              const dataInt16 = new Int16Array(bytes.buffer);
              const buffer = audioContextRef.current.createBuffer(1, dataInt16.length, 24000);
              const channelData = buffer.getChannelData(0);
              for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

              const source = audioContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextRef.current.destination);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onclose: () => setIsVoiceActive(false),
          onerror: () => setIsVoiceActive(false),
        }
      });
    } catch (err) {
      console.error("Voice connection error:", err);
    }
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
          config: { systemInstruction: 'You are a professional assistant for a JS Bank employee. Be efficient, helpful, and banking-oriented.' }
        });
        setMessages(prev => [...prev, { role: 'assistant', content: response.text || '' }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection timeout. Please retry.' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Floating Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-8 bottom-8 z-[60] w-16 h-16 bg-[#044A8D] text-white rounded-[1.5rem] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
      >
        <div className="absolute inset-0 bg-white/20 rounded-[1.5rem] scale-0 group-hover:scale-100 transition-transform"></div>
        {isOpen ? (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <div className="relative">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#EF7A25] rounded-full animate-ping"></span>
          </div>
        )}
      </button>

      {/* Assistant Panel */}
      <div className={`fixed right-8 bottom-28 z-50 w-[400px] h-[600px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden border border-white/20 transition-all duration-500 origin-bottom-right ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-12 pointer-events-none'}`}>
        {/* Header */}
        <div className="p-6 bg-[#044A8D] text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-lg tracking-tighter uppercase">AI Intelligence Hub</h3>
            <div className="flex space-x-2">
              <button onClick={() => setMode('chat')} className={`p-2 rounded-xl transition-colors ${mode === 'chat' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'}`} title="Direct Chat"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg></button>
              <button onClick={() => setMode('think')} className={`p-2 rounded-xl transition-colors ${mode === 'think' ? 'bg-[#FAB51D] text-[#044A8D]' : 'hover:bg-white/10'}`} title="Deep Reasoning Mode"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg></button>
              <button onClick={() => setMode('voice')} className={`p-2 rounded-xl transition-colors ${mode === 'voice' ? 'bg-[#EF7A25] shadow-inner' : 'hover:bg-white/10'}`} title="Live Voice API"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg></button>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest opacity-80">
            <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-orange-400 animate-pulse' : 'bg-green-400'}`}></span>
            <span>{mode === 'think' ? 'Advanced Reasoning Engaged' : mode === 'voice' ? 'Voice Link Ready' : 'Secure Terminal Active'}</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950">
          {mode === 'voice' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8">
              <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-700 ${isVoiceActive ? 'border-[#EF7A25] shadow-[0_0_50px_rgba(239,122,37,0.3)] scale-110' : 'border-slate-200 shadow-none'}`}>
                {isVoiceActive ? (
                  <div className="flex space-x-1 items-end h-8">
                    {[1,2,3,4,3,2,1].map((h, i) => (
                      <div key={i} className="w-1.5 bg-[#EF7A25] rounded-full animate-bounce" style={{ height: `${h * 25}%`, animationDelay: `${i * 0.1}s` }}></div>
                    ))}
                  </div>
                ) : (
                  <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                )}
              </div>
              <div>
                <h4 className="font-black text-xl text-slate-900 dark:text-white mb-2">{isVoiceActive ? 'Listening...' : 'Ready for Voice Interaction'}</h4>
                <p className="text-sm text-slate-500 px-6">Have a real-time conversation with the JS Intelligence Hub. High-speed voice streaming via Gemini 2.5.</p>
              </div>
              <button 
                onClick={toggleVoice}
                className={`px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95 ${isVoiceActive ? 'bg-red-500 text-white shadow-red-200' : 'bg-[#EF7A25] text-white shadow-orange-200'}`}
              >
                {isVoiceActive ? 'Terminate Session' : 'Establish Voice Link'}
              </button>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-medium ${
                      m.role === 'user' 
                        ? 'bg-[#044A8D] text-white rounded-tr-none shadow-lg' 
                        : m.role === 'system'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 text-center w-full rounded-none uppercase text-[9px] font-black tracking-widest'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-none shadow-md border border-slate-100 dark:border-slate-700'
                    }`}>
                      {m.isThinking && (
                        <div className="flex items-center space-x-2 mb-2 text-[10px] font-black text-[#FAB51D] uppercase">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          <span>Reasoned Response</span>
                        </div>
                      )}
                      {m.content}
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl rounded-tl-none shadow-md flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={mode === 'think' ? 'Ask a complex query...' : 'Send a message...'}
                    className="flex-1 bg-transparent border-none outline-none px-2 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isProcessing}
                    className="p-3 bg-[#044A8D] text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AIAssistant;
