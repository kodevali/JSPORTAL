import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import News from './components/News';
import Downloads from './components/Downloads';
import Tickets from './components/Tickets';

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
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAuthorizingEcosystem, setIsAuthorizingEcosystem] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  const tokenClientRef = useRef<any>(null);
  const isGsiInitRef = useRef(false);
  const isTokenClientInitRef = useRef(false);
  
  const GOOGLE_CLIENT_ID = "936145652014-tq1mdn7q8gj2maa677vi2e1k13o0ub4b.apps.googleusercontent.com"; 

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
    if (isTokenClientInitRef.current) return;
    const initClient = () => {
      if ((window as any).google?.accounts?.oauth2) {
        tokenClientRef.current = (window as any).google.accounts.oauth2.initTokenClient({
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
        isTokenClientInitRef.current = true;
        if (user && !accessToken) requestEcosystemAccess(true);
      } else {
        setTimeout(initClient, 500);
      }
    };
    initClient();
  }, [GOOGLE_CLIENT_ID, user, accessToken, requestEcosystemAccess]);

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

  useEffect(() => {
    if (!hasApiKey || user || isGsiInitRef.current) return;
    const timer = setTimeout(() => {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false
        });
        const btn = document.getElementById("google-signin-btn");
        if (btn) {
          (window as any).google.accounts.id.renderButton(btn, {
            theme: "outline", size: "large", width: 320, shape: "pill"
          });
          isGsiInitRef.current = true;
        }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [hasApiKey, handleGoogleResponse, GOOGLE_CLIENT_ID, user]);

  if (hasApiKey === null) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/10 border-t-[#044A8D] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] p-12 max-w-lg w-full shadow-2xl text-center">
          <img src="https://jsbl.com/wp-content/uploads/2021/06/js-bank-logo.png" className="w-48 mx-auto mb-10" alt="Logo" />
          <h1 className="text-2xl font-black text-[#044A8D] mb-4 uppercase tracking-tighter">Security Protocol Required</h1>
          <p className="text-slate-500 mb-8 text-sm font-bold leading-relaxed">
            Portal initialization requires a verified AI Project Key to enable bank-wide search and intelligence protocols.
          </p>
          <button 
            onClick={handleKeySelection}
            className="w-full py-4 bg-[#044A8D] text-white font-black rounded-xl hover:bg-blue-800 transition-all shadow-xl shadow-blue-100 active:scale-95 uppercase tracking-widest text-xs"
          >
            Authenticate Key
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="bg-white rounded-[3rem] p-12 max-w-lg w-full shadow-2xl text-center relative overflow-hidden animate-fadeIn">
          <div className="absolute top-0 left-0 w-full h-2 bg-[#EF7A25]"></div>
          <div className="mb-10">
            <img src="https://jsbl.com/wp-content/uploads/2021/06/js-bank-logo.png" className="w-48 mx-auto mb-8" alt="Logo" />
            <h1 className="text-3xl font-black text-[#044A8D] mb-1">Internal Hub</h1>
            <p className="text-[#FAB51D] font-black uppercase tracking-[0.3em] text-[9px]">Corporate Access Control</p>
          </div>
          <div className="flex flex-col items-center space-y-6">
            <div id="google-signin-btn" className="min-h-[50px]"></div>
            {authError && (
              <div className="w-full p-4 bg-red-50 text-red-600 rounded-xl text-[10px] font-black border border-red-100 uppercase tracking-widest">
                {authError}
              </div>
            )}
            <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed font-bold uppercase tracking-widest opacity-60">
              Employee Single Sign-On • Domain Restricted
            </p>
          </div>
          {isLoggingIn && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center z-50">
              <div className="w-10 h-10 border-4 border-[#044A8D] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-8 text-[#044A8D] font-black tracking-widest text-xs uppercase animate-pulse">Verifying Credentials...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={user.role} />
      <main className="flex-1 ml-64 p-8 transition-all duration-300">
        <header className="flex justify-end items-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-white pl-1.5 pr-6 py-1.5 rounded-2xl shadow-sm border border-slate-100">
               <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-inner" alt="User" referrerPolicy="no-referrer" />
               <div className="text-left">
                 <p className="text-xs font-black text-slate-900 leading-none truncate max-w-[120px]">{user.name}</p>
                 <p className="text-[8px] text-[#EF7A25] font-black uppercase tracking-widest mt-1.5">{user.role.replace('_', ' ')}</p>
               </div>
            </div>
            <button onClick={logout} className="p-3 bg-white text-slate-400 hover:text-red-600 rounded-xl border border-slate-50 shadow-sm transition-all hover:bg-red-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </header>
        <div className="max-w-6xl mx-auto">
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
    </div>
  );
};

export default App;