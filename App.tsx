
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import News from './components/News';
import Downloads from './components/Downloads';
import Tickets from './components/Tickets';

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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Using the primary Client ID provided for the JS Portal
  const GOOGLE_CLIENT_ID = "936145652014-tq1mdn7q8gj2maa677vi2e1k13o0ub4b.apps.googleusercontent.com"; 

  const requestEcosystemAccess = useCallback(() => {
    /* global google */
    if (typeof window !== 'undefined' && (window as any).google) {
      try {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/tasks.readonly https://www.googleapis.com/auth/calendar.readonly',
          callback: (tokenRes: any) => {
            if (tokenRes.access_token) {
              setAccessToken(tokenRes.access_token);
              sessionStorage.setItem('js_access_token', tokenRes.access_token);
            }
          },
        });
        // We request consent to ensure all scopes (Gmail, Tasks, Calendar) are authorized by the user
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        console.error("Token client failed:", err);
      }
    }
  }, [GOOGLE_CLIENT_ID]);

  const handleGoogleResponse = useCallback((response: any) => {
    setIsLoggingIn(true);
    setAuthError(null);
    
    try {
      const payload = decodeJwt(response.credential);
      if (payload && payload.email) {
        const email = payload.email.toLowerCase();
        let assignedRole: UserRole = UserRole.USER;

        // Simple role check based on provided IT account
        if (email.includes('admin') || email === 'kodev.ali@jsbl.com') {
          assignedRole = UserRole.IT;
        } 

        setUser({
          id: payload.sub,
          name: payload.name,
          email: payload.email,
          role: assignedRole,
          avatar: payload.picture
        });
        
        // Trigger the second-step OAuth flow for Google Ecosystem data
        requestEcosystemAccess();
      }
    } catch (err) {
      setAuthError("Identity verification failed. Please check your JSBL account.");
    } finally {
      setIsLoggingIn(false);
    }
  }, [requestEcosystemAccess]);

  useEffect(() => {
    /* global google */
    const initGoogleAuth = () => {
      if (typeof window !== 'undefined' && (window as any).google) {
        try {
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
        } catch (err) {
          console.error("GSI Initialization failed:", err);
        }
      }
    };

    const timer = setTimeout(initGoogleAuth, 800);
    return () => clearTimeout(timer);
  }, [handleGoogleResponse, GOOGLE_CLIENT_ID]);

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    sessionStorage.removeItem('js_access_token');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl relative overflow-hidden text-center animate-fadeIn border border-white/10">
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
          
          <div className="mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl font-bold shadow-xl mb-6">JS</div>
            <h1 className="text-3xl font-black text-slate-900 mb-1">JS Bank Portal</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Secure Employee Gateway</p>
          </div>

          <div className="flex flex-col items-center space-y-6">
            <div id="google-signin-btn" className="min-h-[50px]"></div>
            
            {authError && (
              <div className="w-full p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 flex items-center space-x-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <span>{authError}</span>
              </div>
            )}
            
            <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
              Login with your official bank credentials. You will be asked to authorize access to your professional Gmail, Tasks, and Calendar.
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-50">
             <p className="text-[10px] text-slate-300 font-medium tracking-wide">© 2024 JS BANK LTD. ALL RIGHTS RESERVED.</p>
          </div>

          {isLoggingIn && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center z-50">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-6 text-slate-900 font-bold">Verifying JSBL Identity...</p>
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
            <div className="flex items-center space-x-3 bg-white p-2 pr-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
               <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover shadow-sm border border-slate-200" alt="User" referrerPolicy="no-referrer" />
               <div className="text-left">
                 <p className="text-sm font-bold text-slate-900 leading-none">{user.name}</p>
                 <p className="text-[10px] text-blue-600 font-black uppercase tracking-wider mt-1">{user.role.replace('_', ' ')}</p>
               </div>
            </div>
            <button onClick={logout} className="p-3 bg-white text-slate-400 hover:text-red-600 rounded-2xl border border-slate-100 shadow-sm transition-all hover:bg-red-50 group">
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </header>
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard 
              user={user} 
              accessToken={accessToken} 
              onSyncRequest={requestEcosystemAccess}
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
