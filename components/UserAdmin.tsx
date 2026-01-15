
import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';

interface ManagedUser {
  email: string;
  role: UserRole;
  name?: string;
}

const UserAdmin: React.FC = () => {
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.USER);

  // Constants for styling
  const ROLE_CONFIG = {
    [UserRole.IT]: { label: 'IT ADMIN', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200' },
    [UserRole.MANAGER]: { label: 'MANAGER', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200' },
    [UserRole.USER]: { label: 'GENERAL STAFF', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200' },
  };

  useEffect(() => {
    const saved = localStorage.getItem('js_portal_user_registry');
    if (saved) {
      setManagedUsers(JSON.parse(saved));
    } else {
      // Default Bootstrap Admins
      const initial = [
        { email: 'kodev.ali@jsbl.com', role: UserRole.IT, name: 'Ali (Bootstrap Admin)' },
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
    const cleanEmail = newUserEmail.trim().toLowerCase();
    if (!cleanEmail) return;
    
    const exists = managedUsers.find(u => u.email === cleanEmail);
    if (exists) {
      alert("This user is already registered. Please edit their role in the table below.");
      return;
    }

    const updated = [{ email: cleanEmail, role: newUserRole }, ...managedUsers];
    saveRegistry(updated);
    setNewUserEmail('');
    alert(`Access provisioned for ${cleanEmail}`);
  };

  const updateRole = (email: string, role: UserRole) => {
    const updated = managedUsers.map(u => u.email === email ? { ...u, role } : u);
    saveRegistry(updated);
  };

  const removeUser = (email: string) => {
    // Prevent accidental self-removal logic would happen here in a real app
    if (window.confirm(`Are you sure you want to revoke all portal access for ${email}?`)) {
      const updated = managedUsers.filter(u => u.email !== email);
      saveRegistry(updated);
    }
  };

  const filteredUsers = managedUsers.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Access Control Center</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Enterprise Governance & Role Provisioning</p>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search registry..." 
            className="pl-12 pr-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none w-full md:w-80 shadow-sm text-xs font-bold focus:ring-2 focus:ring-[#044A8D] transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-2">
        {/* Provisioning Card */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl sticky top-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#EF7A25] mb-8 flex items-center">
              <span className="w-2 h-2 bg-[#EF7A25] rounded-full mr-2"></span>
              Add User to Registry
            </h3>
            <form onSubmit={handleProvision} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Employee Email</label>
                <input 
                  type="email" 
                  required 
                  value={newUserEmail} 
                  onChange={e => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-[#044A8D] dark:text-white transition-all" 
                  placeholder="name@jsbl.com" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Initial Clearance</label>
                <div className="grid grid-cols-1 gap-2">
                  {[UserRole.USER, UserRole.MANAGER, UserRole.IT].map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setNewUserRole(role)}
                      className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 ${
                        newUserRole === role 
                        ? 'bg-[#044A8D] text-white border-[#044A8D] shadow-md' 
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-transparent hover:border-slate-200'
                      }`}
                    >
                      {role.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-[#EF7A25] hover:bg-[#d96a1d] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-4">
                Grant Portal Access
              </button>
            </form>
          </div>
        </div>

        {/* Global Registry Table */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Master Registry: {managedUsers.length} Identified Principals</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Principal Identity</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Clearance Tier</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                    <tr key={u.email} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-[#044A8D] dark:group-hover:text-blue-400 transition-colors">
                            {u.name || 'Access Pending Login'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold mt-0.5">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-3">
                          <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black border transition-all ${ROLE_CONFIG[u.role].color}`}>
                            {ROLE_CONFIG[u.role].label}
                          </span>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                            <button 
                              onClick={() => updateRole(u.email, UserRole.USER)} 
                              className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-black hover:bg-emerald-100"
                              title="Set to USER"
                            >U</button>
                            <button 
                              onClick={() => updateRole(u.email, UserRole.MANAGER)} 
                              className="w-5 h-5 rounded bg-blue-50 text-blue-600 border border-blue-100 text-[8px] font-black hover:bg-blue-100"
                              title="Set to MANAGER"
                            >M</button>
                            <button 
                              onClick={() => updateRole(u.email, UserRole.IT)} 
                              className="w-5 h-5 rounded bg-red-50 text-red-600 border border-red-100 text-[8px] font-black hover:bg-red-100"
                              title="Set to IT ADMIN"
                            >I</button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button 
                          onClick={() => removeUser(u.email)} 
                          className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                          title="Revoke Permission"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-20 text-center">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">No matching identity records found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAdmin;
