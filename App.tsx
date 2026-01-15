
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import News from './components/News';
import Downloads from './components/Downloads';
import Tickets from './components/Tickets';
import Logo from './components/Logo';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
    google?: any;
  }
}

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
  const [authError, setAuthError] = useState<string | null>(null);
  
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

  const handleAuthSuccess = async (token: string) => {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profile = await res.json();
      
      if (profile && profile.email) {
        const email = profile.email.toLowerCase();
        let assignedRole: UserRole = UserRole.USER;
        
        if (email.includes('admin') || email === 'kodev.ali@jsbl.com' || email.includes('ali')) {
          assignedRole = UserRole.IT;
        } else if (email.includes('manager')) {
          assignedRole = UserRole.MANAGER;
        }

        const newUser: User = {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          role: assignedRole,
          avatar: profile.picture
        };
        
        setUser(newUser);
        setAccessToken(token);
        sessionStorage.setItem('js_portal_user', JSON.stringify(newUser));
        sessionStorage.setItem('js_access_token', token);
      }
    } catch (err) {
      setAuthError("Failed to fetch user profile. Protocol error.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const initiateLogin = () => {
    if (tokenClientRef.current) {
      setIsLoggingIn(true);
      tokenClientRef.current.requestAccessToken();
    }
  };

  useEffect(() => {
    const initGoogle = () => {
      const g = window.google;
      if (!g || !g.accounts?.oauth2) return;

      if (!tokenClientRef.current) {
        tokenClientRef.current = g.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly',
          callback: (tokenRes: any) => {
            if (tokenRes.access_token) {
              handleAuthSuccess(tokenRes.access_token);
            } else {
              setIsLoggingIn(false);
            }
          },
        });
      }
    };

    const interval = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        initGoogle();
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-12 max-w-lg w-full shadow-2xl text-center relative overflow-hidden border border-white/10">
          <div className="absolute top-0 left-0 w-full h-3 bg-[#EF7A25]"></div>
          <Logo className="mb-10 scale-125" />
          <h1 className="text-4xl font-black text-[#044A8D] dark:text-white mb-1 tracking-tighter">Intranet Hub</h1>
          <p className="text-[#EF7A25] font-black uppercase tracking-[0.4em] text-[10px] mb-12">Corporate Terminal Access</p>
          
          <button 
            onClick={initiateLogin}
            disabled={isLoggingIn}
            className="w-full py-5 bg-[#044A8D] text-white font-black rounded-2xl hover:bg-blue-800 transition-all shadow-xl uppercase tracking-widest text-xs flex items-center justify-center space-x-3 active:scale-95 disabled:opacity-50"
          >
            {isLoggingIn ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            <span>Authorize Portal Access</span>
          </button>
          
          {authError && <p className="mt-4 text-xs font-black text-red-500 uppercase">{authError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0F172A] transition-colors duration-500">
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
            <div className="flex items-center space-x-5 bg-white/50 dark:bg-[#1E293B]/50 backdrop-blur-xl px-4 py-2 rounded-[2rem] shadow-xl border border-white/20">
               <img src={user.avatar} className="w-10 h-10 rounded-xl border-2 border-white shadow-md" alt="Profile" referrerPolicy="no-referrer" />
               <div className="text-left">
                 <p className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate max-w-[160px]">{user.name}</p>
                 <p className="text-[9px] text-[#EF7A25] font-black uppercase tracking-[0.2em]">{user.role.replace('_', ' ')}</p>
               </div>
            </div>
            <button onClick={logout} className="p-4 bg-white dark:bg-[#1E293B] text-slate-400 hover:text-red-500 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </header>
        <div className="max-w-[1400px] mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard 
              user={user} 
              accessToken={accessToken} 
              isAuthorizing={isLoggingIn} 
              onSyncRequest={initiateLogin} 
            />
          )}
          {activeTab === 'news' && <News />}
          {activeTab === 'downloads' && <Downloads userRole={user.role} />}
          {activeTab === 'tickets' && <Tickets user={user} />}
        </div>
      </main>
    </div>
  );
};

export default App;
