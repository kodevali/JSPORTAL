
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import News from './components/News';
import Downloads from './components/Downloads';
import Tickets from './components/Tickets';

// Fix: Moved AIStudio interface inside declare global and made property optional to avoid modifier/type mismatch errors
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
  // Restore both user and token from session storage to maintain seamless state
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
      // prompt: '' attempts a silent refresh/auth if the user has already consented
      tokenClientRef.current.requestAccessToken({ prompt: isSilent ? '' : 'consent' });
    } else {
      console.warn("Token client not initialized yet.");
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
        
        if (email.includes('admin') || email === 'kodev.ali@jsbl.com') {
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
        
        // Single Phase flow: Trigger Ecosystem authorization immediately
        requestEcosystemAccess(true);
      }
    } catch (err) {
      setAuthError("Identity verification failed. Please use your official JS Bank account.");
    } finally {
      setIsLoggingIn(false);
    }
  }, [requestEcosystemAccess]);

  // Initialize Token Client once
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
        
        // If we already have a user but no token (or just re-loading), try a silent refresh immediately
        if (user && !accessToken) {
          requestEcosystemAccess(true);
        }
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/20 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-[3rem] p-12 max-w-lg w-full shadow-2xl text-center border border-white/10">
          <div className="w-20 h-20 bg-blue-600 rounded-[2rem] mx-auto flex items-center justify-center text-white text-4xl font-black shadow-2xl mb-8">JS</div>
          <h1 className="text-3xl font-black text-slate-900 mb-4">Secure Boot Required</h1>
          <p className="text-slate-500 mb-8 text-lg font-medium leading-relaxed">
            The JS Bank Portal requires an active Project Key to initialize corporate AI security and search services.
          </p>
          <button 
            onClick={handleKeySelection}
            className="w-full py-5 bg-blue-600 text-white font-black rounded-[2rem] hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 uppercase tracking-widest text-sm"
          >
            Authenticate Portal Key
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-[3rem] p-12 max-w-lg w-full shadow-2xl text-center relative overflow-hidden animate-fadeIn">
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
          <div className="mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] mx-auto flex items-center justify-center text-white text-4xl font-black shadow-2xl mb-8">JS</div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">Internal Portal</h1>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Employee Access Point</p>
          </div>
          <div className="flex flex-col items-center space-y-8">
            <div id="google-signin-btn" className="min-h-[50px]"></div>
            {authError && (
              <div className="w-full p-5 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 flex items-center space-x-3 text-left">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <span>{authError}</span>
              </div>
            )}
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-medium">
              Official JS Bank Employee Access Only. Authorized personnel are monitored.
            </p>
          </div>
          {isLoggingIn && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-50">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-8 text-slate-900 font-black tracking-tight text-lg">AUTHENTICATING...</p>
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
            <div className="flex items-center space-x-4 bg-white p-2 pr-8 rounded-[2rem] shadow-sm border border-slate-100 transition-all hover:shadow-md">
               <img src={user.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-slate-200" alt="User" referrerPolicy="no-referrer" />
               <div className="text-left">
                 <p className="text-sm font-black text-slate-900 leading-none">{user.name}</p>
                 <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1.5">{user.role.replace('_', ' ')}</p>
               </div>
            </div>
            <button onClick={logout} className="p-4 bg-white text-slate-400 hover:text-red-600 rounded-2xl border border-slate-100 shadow-sm transition-all hover:bg-red-50 group">
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </header>
        <div className="max-w-7xl mx-auto">
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
