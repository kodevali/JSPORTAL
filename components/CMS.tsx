
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, NewsCard, DownloadItem, SensitivityLevel } from '../types';
import { MOCK_NEWS, DOWNLOAD_ITEMS } from '../constants';

interface CMSProps {
  user: User;
}

const CMS: React.FC<CMSProps> = ({ user }) => {
  const [activeSubTab, setActiveSubTab] = useState<'news' | 'docs'>('news');
  const [news, setNews] = useState<NewsCard[]>([]);
  const [docs, setDocs] = useState<DownloadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // News Form State
  const [newsForm, setNewsForm] = useState<NewsCard>({
    title: '', summary: '', link: '#', date: new Date().toLocaleDateString(), image: 'https://picsum.photos/seed/bank/600/400'
  });

  // Docs Form State
  const [docForm, setDocForm] = useState<Partial<DownloadItem>>({
    name: '', 
    category: 'General', 
    sensitivity: 'INTERNAL',
    minRole: UserRole.USER
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const savedNews = localStorage.getItem('js_portal_news');
    const savedDocs = localStorage.getItem('js_portal_docs');
    setNews(savedNews ? JSON.parse(savedNews) : MOCK_NEWS);
    
    // Add default sensitivity to existing mock items if missing
    const initialDocs = savedDocs ? JSON.parse(savedDocs) : DOWNLOAD_ITEMS.map(d => ({
      ...d,
      sensitivity: d.minRole === UserRole.IT ? 'RESTRICTED' : d.minRole === UserRole.MANAGER ? 'CONFIDENTIAL' : 'INTERNAL'
    }));
    setDocs(initialDocs);
  }, []);

  const saveNews = (updated: NewsCard[]) => {
    setNews(updated);
    localStorage.setItem('js_portal_news', JSON.stringify(updated));
  };

  const saveDocs = (updated: DownloadItem[]) => {
    setDocs(updated);
    localStorage.setItem('js_portal_docs', JSON.stringify(updated));
  };

  const handleAddNews = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = [newsForm, ...news];
    saveNews(updated);
    setNewsForm({ title: '', summary: '', link: '#', date: new Date().toLocaleDateString(), image: 'https://picsum.photos/seed/bank/600/400' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) { // 2MB limit for localStorage safety
        alert("File too large for demo storage (Max 2MB). Please select a smaller file.");
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
      setDocForm(prev => ({ ...prev, name: file.name }));
    }
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !docForm.name) return;

    setIsUploading(true);

    try {
      let fileData = '';
      let mimeType = '';
      let sizeText = docForm.size || '0.1 MB';

      if (selectedFile) {
        fileData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedFile);
        });
        mimeType = selectedFile.type;
        sizeText = (selectedFile.size / (1024 * 1024)).toFixed(2) + ' MB';
      }

      // Map sensitivity to roles
      const sensitivityRoleMap: Record<SensitivityLevel, UserRole> = {
        'PUBLIC': UserRole.USER,
        'INTERNAL': UserRole.USER,
        'CONFIDENTIAL': UserRole.MANAGER,
        'RESTRICTED': UserRole.IT
      };

      const newItem: DownloadItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: docForm.name || selectedFile?.name || 'Untitled',
        category: docForm.category || 'General',
        size: sizeText,
        sensitivity: docForm.sensitivity as SensitivityLevel || 'INTERNAL',
        minRole: sensitivityRoleMap[docForm.sensitivity as SensitivityLevel || 'INTERNAL'],
        updatedAt: new Date().toISOString().split('T')[0],
        fileData: fileData || undefined,
        mimeType: mimeType || undefined
      };

      const updated = [newItem, ...docs];
      saveDocs(updated);
      
      // Reset
      setDocForm({ name: '', category: 'General', sensitivity: 'INTERNAL', minRole: UserRole.USER });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert("File successfully added to repository.");
    } catch (err) {
      alert("Failed to process file.");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteNews = (index: number) => saveNews(news.filter((_, i) => i !== index));
  const deleteDoc = (id: string) => saveDocs(docs.filter(d => d.id !== id));

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Content Management</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Authorized Portal Editor</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setActiveSubTab('news')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'news' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#044A8D] dark:text-white' : 'text-slate-400'}`}
          >
            News Manager
          </button>
          <button 
            onClick={() => setActiveSubTab('docs')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'docs' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#044A8D] dark:text-white' : 'text-slate-400'}`}
          >
            Document Hub
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-2">
        {/* Editor Form */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#EF7A25] mb-6">
              Create New {activeSubTab === 'news' ? 'Bulletin' : 'Entry'}
            </h3>
            
            {activeSubTab === 'news' ? (
              <form onSubmit={handleAddNews} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Title</label>
                  <input required value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-[#044A8D]" placeholder="e.g. Annual Gala 2024" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Summary</label>
                  <textarea required rows={3} value={newsForm.summary} onChange={e => setNewsForm({...newsForm, summary: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-xs font-medium" placeholder="Brief description..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Image URL</label>
                  <input value={newsForm.image} onChange={e => setNewsForm({...newsForm, image: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-xs font-medium" />
                </div>
                <button type="submit" className="w-full py-4 bg-[#044A8D] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Publish Bulletin</button>
              </form>
            ) : (
              <form onSubmit={handleAddDoc} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Select File</label>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-xs font-bold file:bg-transparent file:border-none file:text-[9px] file:font-black file:uppercase file:text-[#044A8D] dark:file:text-blue-400" 
                  />
                  <p className="text-[8px] text-slate-400 font-bold px-1 italic">Note: Files are stored locally in your browser session.</p>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Display Name</label>
                  <input required value={docForm.name} onChange={e => setDocForm({...docForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-xs font-bold" placeholder="e.g. Audit_Report_Q4.pdf" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Category</label>
                    <input value={docForm.category} onChange={e => setDocForm({...docForm, category: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-xs font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Sensitivity</label>
                    <select 
                      value={docForm.sensitivity} 
                      onChange={e => setDocForm({...docForm, sensitivity: e.target.value as SensitivityLevel})} 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-xs font-bold"
                    >
                      <option value="PUBLIC">Public</option>
                      <option value="INTERNAL">Internal</option>
                      <option value="CONFIDENTIAL">Confidential</option>
                      <option value="RESTRICTED">Restricted</option>
                    </select>
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="w-full py-4 bg-[#EF7A25] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isUploading ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span>Add to Repository</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* List View */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">{activeSubTab === 'news' ? 'Headline' : 'Document'}</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">{activeSubTab === 'news' ? 'Date' : 'Sensitivity'}</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeSubTab === 'news' ? (
                    news.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[300px]">{item.title}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold text-slate-400">{item.date}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => deleteNews(idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    docs.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[300px]">{item.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{item.category} • {item.size}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${
                            item.sensitivity === 'RESTRICTED' ? 'bg-red-50 text-red-600 border-red-200' : 
                            item.sensitivity === 'CONFIDENTIAL' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                            'bg-emerald-50 text-emerald-600 border-emerald-200'
                          }`}>
                            {item.sensitivity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => deleteDoc(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CMS;
