
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import News from './components/News';
import Downloads from './components/Downloads';
import Tickets from './components/Tickets';
import Logo from './components/Logo';
import AIAssistant from './components/AIAssistant';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

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
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('js_portal_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => sessionStorage.getItem('js_access_token'));
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('js_portal_theme');
    return saved === 'dark';
  });
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAuthorizingEcosystem, setIsAuthorizingEcosystem] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  const tokenClientRef = useRef<any>(null);
  
  const GOOGLE_CLIENT_ID = "936145652014-tq1mdn7q8gj2maa677vi2e1k13o0ub4b.apps.googleusercontent.com"; 

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('js_portal_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('js_portal_theme', 'light');
    }
  }, [darkMode]);

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    sessionStorage.removeItem('js_access_token');
    sessionStorage.removeItem('js_portal_user');
  };

  const requestEcosystemAccess = useCallback((isSilent: boolean = true) => {
    if (tokenClientRef.current) {
      setIsAuthorizingEcosystem(true);
      tokenClientRef.current.requestAccessToken({ prompt: isSilent ? '' : 'consent' });
    }
  }, []);

  const handleGoogleResponse = useCallback((response: any) => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const payload = decodeJwt(response.credential);
      if (payload && payload.email) {
        const email = payload.email.toLowerCase();
        let assignedRole: UserRole = UserRole.USER;
        
        if (email.includes('admin') || email === 'kodev.ali@jsbl.com' || email.includes('ali')) {
          assignedRole = UserRole.IT;
        } else if (email.includes('manager')) {
          assignedRole = UserRole.MANAGER;
        }

        const newUser: User = {
          id: payload.sub,
          name: payload.name,
          email: payload.email,
          role: assignedRole,
          avatar: payload.picture
        };
        
        setUser(newUser);
        sessionStorage.setItem('js_portal_user', JSON.stringify(newUser));
        requestEcosystemAccess(true);
      }
    } catch (err) {
      setAuthError("Identity verification failed. Please use official JS credentials.");
    } finally {
      setIsLoggingIn(false);
    }
  }, [requestEcosystemAccess]);

  useEffect(() => {
    const checkGsiReady = () => {
      const g = (window as any).google;
      if (g?.accounts?.id && g?.accounts?.oauth2) {
        g.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false
        });

        const btnContainer = document.getElementById("google-signin-btn");
        if (btnContainer) {
          g.accounts.id.renderButton(btnContainer, {
            theme: darkMode ? "filled_blue" : "outline", 
            size: "large", 
            width: 320, 
            shape: "pill"
          });
        }

        if (!tokenClientRef.current) {
          tokenClientRef.current = g.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/tasks.readonly https://www.googleapis.com/auth/calendar.readonly',
            callback: (tokenRes: any) => {
              setIsAuthorizingEcosystem(false);
              if (tokenRes.access_token) {
                setAccessToken(tokenRes.access_token);
                sessionStorage.setItem('js_access_token', tokenRes.access_token);
              }
            },
          });
          if (user && !accessToken) requestEcosystemAccess(true);
        }
        return true;
      }
      return false;
    };

    if (!checkGsiReady()) {
      const interval = setInterval(() => {
        if (checkGsiReady()) clearInterval(interval);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [darkMode, handleGoogleResponse, user, accessToken, requestEcosystemAccess]);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        try {
          const result = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(result);
        } catch (e) {
          setHasApiKey(false);
        }
      } else {
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  const handleKeySelection = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        setHasApiKey(true);
      } catch (err) {
        console.error("Key selection failed:", err);
      }
    }
  };

  if (hasApiKey === null) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/10 border-t-[#044A8D] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 max-w-lg w-full shadow-2xl text-center border border-white/10 transition-colors">
          <Logo className="mb-10" />
          <h1 className="text-2xl font-black text-[#044A8D] dark:text-white mb-4 uppercase tracking-tighter">Security Protocol</h1>
          <p className="text-slate-700 dark:text-slate-300 mb-8 text-sm font-bold leading-relaxed">
            Portal initialization requires a verified AI Project Key to enable bank-wide intelligence protocols.
          </p>
          <button 
            onClick={handleKeySelection}
            className="w-full py-5 bg-[#044A8D] text-white font-black rounded-2xl hover:bg-blue-800 transition-all shadow-xl shadow-blue-100 dark:shadow-none active:scale-95 uppercase tracking-widest text-xs"
          >
            Authenticate Environment
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-12 max-w-lg w-full shadow-2xl text-center relative overflow-hidden animate-fadeIn border border-white/10">
          <div className="absolute top-0 left-0 w-full h-3 bg-[#EF7A25]"></div>
          <div className="mb-10">
            <Logo className="mb-10 scale-125" />
            <h1 className="text-4xl font-black text-[#044A8D] dark:text-white mb-1 tracking-tighter">Intranet Hub</h1>
            <p className="text-[#EF7A25] font-black uppercase tracking-[0.4em] text-[10px]">Corporate Terminal Access</p>
          </div>
          <div className="flex flex-col items-center space-y-6">
            <div id="google-signin-btn" className="min-h-[50px]"></div>
            {authError && (
              <div className="w-full p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-[10px] font-black border border-red-100 dark:border-red-900/50 uppercase tracking-widest">
                {authError}
              </div>
            )}
            <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed font-bold uppercase tracking-widest">
              Standard Bank Credentials Required
            </p>
          </div>
          {isLoggingIn && (
            <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center z-50">
              <div className="w-12 h-12 border-4 border-[#044A8D] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-8 text-[#044A8D] dark:text-[#FAB51D] font-black tracking-widest text-xs uppercase animate-pulse">Establishing Session...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0F172A] transition-colors duration-500 selection:bg-[#EF7A25]/30">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        role={user.role} 
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
      />
      <main className="flex-1 lg:ml-80 ml-32 p-12 transition-all duration-500">
        <header className="flex justify-end items-center mb-16">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-5 bg-white/50 dark:bg-[#1E293B]/50 backdrop-blur-xl pl-2 pr-10 py-2 rounded-[2rem] shadow-xl border border-white/20 transition-all hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]">
               <img src={user.avatar} className="w-12 h-12 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-xl" alt="Profile" referrerPolicy="no-referrer" />
               <div className="text-left">
                 <p className="text-base font-black text-slate-900 dark:text-white leading-tight truncate max-w-[160px] tracking-tight">{user.name}</p>
                 <p className="text-[10px] text-[#EF7A25] font-black uppercase tracking-[0.2em] mt-1.5">{user.role.replace('_', ' ')}</p>
               </div>
            </div>
            <button onClick={logout} className="p-5 bg-white dark:bg-[#1E293B] text-slate-400 hover:text-red-500 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl transition-all hover:scale-110 active:scale-95 group">
              <svg className="w-7 h-7 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </header>
        <div className="max-w-[1400px] mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard 
              user={user} 
              accessToken={accessToken} 
              isAuthorizing={isAuthorizingEcosystem} 
              onSyncRequest={() => requestEcosystemAccess(false)} 
            />
          )}
          {activeTab === 'news' && <News />}
          {activeTab === 'downloads' && <Downloads userRole={user.role} />}
          {activeTab === 'tickets' && <Tickets user={user} />}
        </div>
      </main>
      
      {/* Universal Personal AI Assistant Overlay */}
      <AIAssistant />
    </div>
  );
};

export default App;
