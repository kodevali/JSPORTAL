
import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';

interface ManagedUser {
  email: string;
  role: UserRole;
  name?: string;
  lastLogin?: string;
}

const UserAdmin: React.FC = () => {
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.USER);

  useEffect(() => {
    const saved = localStorage.getItem('js_portal_user_registry');
    if (saved) {
      setManagedUsers(JSON.parse(saved));
    } else {
      // Default seeds
      const initial = [
        { email: 'kodev.ali@jsbl.com', role: UserRole.IT, name: 'Ali (Dev)' },
        { email: 'arsalan.mazhar@jsbl.com', role: UserRole.IT, name: 'Arsalan Mazhar' }
      ];
      setManagedUsers(initial);
      localStorage.setItem('js_portal_user_registry', JSON.stringify(initial));
    }
  }, []);

  const saveRegistry = (updated: ManagedUser[]) => {
    setManagedUsers(updated);
    localStorage.setItem('js_portal_user_registry', JSON.stringify(updated));
  };

  const handleProvision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;
    
    const exists = managedUsers.find(u => u.email.toLowerCase() === newUserEmail.toLowerCase());
    if (exists) {
      alert("User already exists in registry.");
      return;
    }

    const updated = [...managedUsers, { email: newUserEmail.toLowerCase(), role: newUserRole }];
    saveRegistry(updated);
    setNewUserEmail('');
  };

  const updateRole = (email: string, role: UserRole) => {
    const updated = managedUsers.map(u => u.email === email ? { ...u, role } : u);
    saveRegistry(updated);
  };

  const removeUser = (email: string) => {
    if (window.confirm(`Revoke access for ${email}?`)) {
      const updated = managedUsers.filter(u => u.email !== email);
      saveRegistry(updated);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Access Control</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Global User Permissions & Provisioning</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-2">
        {/* Provisioning Form */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#EF7A25] mb-6">Provision Access</h3>
            <form onSubmit={handleProvision} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={newUserEmail} 
                  onChange={e => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 text-xs font-bold focus:ring-2 focus:ring-[#044A8D]" 
                  placeholder="user@jsbl.com" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Assign Clearance</label>
                <select 
                  value={newUserRole} 
                  onChange={e => setNewUserRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 text-xs font-bold"
                >
                  <option value={UserRole.USER}>General Staff (USER)</option>
                  <option value={UserRole.MANAGER}>Management (MANAGER)</option>
                  <option value={UserRole.IT}>Administrator (IT_ADMIN)</option>
                </select>
              </div>
              <button type="submit" className="w-full py-4 bg-[#044A8D] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                Add to Registry
              </button>
            </form>
          </div>
        </div>

        {/* User Registry Table */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Identified User</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Clearance Level</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {managedUsers.map((u) => (
                  <tr key={u.email} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">{u.name || 'Pending Login'}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{u.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={u.role} 
                        onChange={e => updateRole(u.email, e.target.value as UserRole)}
                        className={`text-[9px] font-black px-2 py-1 rounded bg-transparent border border-slate-200 dark:border-slate-700 outline-none ${
                          u.role === UserRole.IT ? 'text-red-500' : u.role === UserRole.MANAGER ? 'text-blue-500' : 'text-green-500'
                        }`}
                      >
                        <option value={UserRole.USER}>USER</option>
                        <option value={UserRole.MANAGER}>MANAGER</option>
                        <option value={UserRole.IT}>IT_ADMIN</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => removeUser(u.email)} 
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        title="Revoke Access"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAdmin;
