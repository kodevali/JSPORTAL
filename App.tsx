
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import News from './components/News';
import Downloads from './components/Downloads';
import Tickets from './components/Tickets';

// Utility to decode Google ID Token (JWT)
const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("JWT Decode Error", e);
    return null;
  }
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Placeholder for real deployment. 
  // For standard localhost testing, any client ID works or GIS will show a popup.
  const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"; 

  const handleGoogleResponse = useCallback((response: any) => {
    setIsLoggingIn(true);
    
    // Slight delay to simulate security verification
    setTimeout(() => {
      const payload = decodeJwt(response.credential);
      
      if (payload && payload.email) {
        const email = payload.email.toLowerCase();
        let assignedRole: UserRole = UserRole.USER;

        // Specific Rule: System Admin
        if (email === 'kodev.ali@jsbl.com') {
          assignedRole = UserRole.IT;
        } 
        // Everyone else defaults to USER per request.
        // (Note: In a real bank, we would restrict to @jsbl.com domain here)

        setUser({
          id: payload.sub,
          name: payload.name,
          email: payload.email,
          role: assignedRole,
          avatar: payload.picture
        });
      }
      setIsLoggingIn(false);
    }, 800);
  }, []);

  useEffect(() => {
    /* global google */
    if (typeof window !== 'undefined' && (window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
      });

      const btn = document.getElementById("google-signin-btn");
      if (btn) {
        (window as any).google.accounts.id.renderButton(btn, {
          theme: "outline",
          size: "large",
          width: 320,
          text: "signin_with",
          shape: "pill"
        });
      }
    }
  }, [handleGoogleResponse, user]);

  const logout = () => {
    setUser(null);
    // Force re-render of button next time
    setTimeout(() => {
        const btn = document.getElementById("google-signin-btn");
        if (btn && (window as any).google) {
            (window as any).google.accounts.id.renderButton(btn, {
                theme: "outline", size: "large", width: 320, shape: "pill"
            });
        }
    }, 100);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2rem] p-12 max-w-md w-full shadow-2xl relative overflow-hidden text-center animate-fadeIn">
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-600 shadow-[0_4px_10px_rgba(37,99,235,0.3)]"></div>
          
          <div className="mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] mx-auto flex items-center justify-center text-white text-4xl font-bold shadow-2xl shadow-blue-500/30 mb-8 rotate-3 hover:rotate-0 transition-transform duration-500">JS</div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">JS Bank Portal</h1>
            <p className="text-slate-400 font-medium uppercase tracking-widest text-[10px]">Unified Corporate Intranet</p>
          </div>

          <div className="flex flex-col items-center space-y-6">
            <div id="google-signin-btn" className="min-h-[50px] flex items-center justify-center"></div>
            <div className="space-y-2">
              <p className="text-xs text-slate-500 font-medium">Internal SSO Authorization Required</p>
              <p className="text-[10px] text-slate-400 max-w-[250px] leading-relaxed mx-auto italic">Role is assigned automatically based on your JS Bank directory profile.</p>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-slate-50">
            <div className="flex items-center justify-center space-x-2 text-slate-300">
               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
               <span className="text-[10px] font-bold tracking-widest uppercase">Encrypted Session</span>
            </div>
          </div>

          {isLoggingIn && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center z-50">
              <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-6 text-slate-900 font-bold tracking-tight">Accessing Corporate Directory...</p>
              <p className="mt-2 text-xs text-slate-500">Verifying security clearances</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={user.role} />
      
      <main className="flex-1 ml-64 p-8 lg:p-12 transition-all duration-300">
        <header className="flex justify-end items-center mb-10">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 bg-white p-2 pr-6 rounded-2xl shadow-sm border border-slate-100 group cursor-default">
               <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" alt="User" />
               <div className="text-left">
                 <p className="text-sm font-bold text-slate-900 leading-none">{user.name}</p>
                 <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-1">{user.role.replace('_', ' ')}</p>
               </div>
            </div>
            <button 
              onClick={logout}
              className="p-3 bg-white text-slate-400 hover:text-red-600 rounded-2xl border border-slate-100 shadow-sm transition-all hover:bg-red-50 hover:shadow-md active:scale-95"
              title="Sign Out"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard user={user} />}
          {activeTab === 'news' && <News />}
          {activeTab === 'downloads' && <Downloads userRole={user.role} />}
          {activeTab === 'tickets' && <Tickets user={user} />}
        </div>
      </main>
    </div>
  );
};

export default App;
