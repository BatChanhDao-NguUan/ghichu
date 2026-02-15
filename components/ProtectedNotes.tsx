import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Lock, Key, FileText, AlertTriangle, X, ShieldAlert, Check, Loader2, Save } from 'lucide-react';
import { TabbedNote, Language } from '../types';
import { StorageService } from '../services/storage';
import { CryptoService } from '../services/crypto';
import { TRANSLATIONS } from '../constants';
import { Editor } from './Editor';

interface CreateNotesProps {
  language: Language;
  accentColor: string;
  onBack: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export const CreateNotes: React.FC<CreateNotesProps> = ({ language, accentColor, onBack, onDirtyChange }) => {
  const [tabs, setTabs] = useState<TabbedNote[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [decryptedContent, setDecryptedContent] = useState('');
  
  // Trạng thái thay đổi chưa lưu
  const [isDirty, setIsDirty] = useState(false);
  const [unsavedData, setUnsavedData] = useState({ title: '', content: '' });
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{type: 'switch', id: string} | {type: 'new'} | null>(null);

  const [unlockStatus, setUnlockStatus] = useState<'none' | 'loading' | 'success' | 'error'>('none');
  const [errorMessage, setErrorMessage] = useState('');

  const [showNewTabModal, setShowNewTabModal] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [newTabPass, setNewTabPass] = useState('');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [renameTabId, setRenameTabId] = useState<string | null>(null);
  const [newNameInput, setNewNameInput] = useState('');

  const t = TRANSLATIONS[language];

  useEffect(() => {
    const saved = localStorage.getItem(StorageService.getKey('tabbed_notes'));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTabs(parsed);
          if (!activeTabId) handleSelectTab(parsed[0]);
        }
      } catch (e) {
        console.error("Lỗi parse dữ liệu ghi chú", e);
      }
    }
  }, []);

  const saveToStorage = (updatedTabs: TabbedNote[]) => {
    setTabs(updatedTabs);
    localStorage.setItem(StorageService.getKey('tabbed_notes'), JSON.stringify(updatedTabs));
  };

  const validateTabPassword = (input: string) => {
    const trimmedInput = input.trim();
    if (!trimmedInput) {
      setErrorMessage(t.passwordEmpty || "Mật khẩu không được để trống");
      setUnlockStatus('error');
      return;
    }

    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;

    setUnlockStatus('loading');
    setErrorMessage('');
    setIsUnlocked(false);

    setTimeout(() => {
        try {
          const decrypted = CryptoService.decrypt(tab.encryptedContent, trimmedInput);
          setDecryptedContent(decrypted || "");
          setUnsavedData({ title: tab.name, content: decrypted || "" });
          setUnlockStatus('success');
          
          setTimeout(() => {
            setIsUnlocked(true);
            setUnlockStatus('none');
            setIsDirty(false); 
            onDirtyChange?.(false);
          }, 300);
        } catch (e) {
          console.error("Decryption failed:", e);
          setErrorMessage(t.wrongPassword || "Mật khẩu không chính xác");
          setUnlockStatus('error');
          setTimeout(() => {
            setUnlockStatus('none');
          }, 2000);
        }
    }, 150);
  };

  const handleUnlock = () => {
    validateTabPassword(authPassword);
  };

  const handleSelectTab = (tab: TabbedNote) => {
    if (!tab) return;
    setActiveTabId(tab.id);
    setAuthPassword('');
    setUnlockStatus('none');
    setErrorMessage('');
    setIsDirty(false); 
    onDirtyChange?.(false);
    
    if (!tab.passwordHash) {
      setIsUnlocked(true);
      setDecryptedContent(tab.encryptedContent || '');
      setUnsavedData({ title: tab.name, content: tab.encryptedContent || '' });
    } else {
      setIsUnlocked(false);
      setDecryptedContent('');
    }
  };

  const handleTabClick = (tab: TabbedNote) => {
    if (activeTabId === tab.id) return;
    if (isDirty) {
      setPendingAction({ type: 'switch', id: tab.id });
      setShowUnsavedModal(true);
    } else {
      handleSelectTab(tab);
    }
  };

  const handleNewTabClick = () => {
    if (isDirty) {
      setPendingAction({ type: 'new' });
      setShowUnsavedModal(true);
    } else {
      setShowNewTabModal(true);
    }
  };

  const handleSaveContent = (title: string, content: string) => {
    const updated = tabs.map(t => {
      if (t.id === activeTabId) {
        return {
          ...t,
          name: title || t.name,
          encryptedContent: t.passwordHash ? CryptoService.encrypt(content, authPassword.trim()) : content,
          updatedAt: Date.now()
        };
      }
      return t;
    });
    saveToStorage(updated);
    setDecryptedContent(content);
    setIsDirty(false);
    onDirtyChange?.(false);
  };

  const handleConfirmUnsaved = (save: boolean) => {
    if (save) {
      handleSaveContent(unsavedData.title, unsavedData.content);
    }
    
    setShowUnsavedModal(false);
    
    if (pendingAction?.type === 'switch') {
      const targetTab = tabs.find(t => t.id === pendingAction.id);
      if (targetTab) handleSelectTab(targetTab);
    } else if (pendingAction?.type === 'new') {
      setShowNewTabModal(true);
    }
    
    setPendingAction(null);
  };

  const handleEditorChange = (title: string, content: string) => {
    if (content !== decryptedContent || title !== activeTab?.name) {
      setUnsavedData({ title, content });
      setIsDirty(true);
      onDirtyChange?.(true);
    }
  };

  const handleCreateTab = () => {
    if(!newTabName.trim()) return;
    const trimmedPass = newTabPass.trim();
    const newTab: TabbedNote = {
      id: Date.now().toString(),
      name: newTabName.trim(),
      encryptedContent: trimmedPass ? CryptoService.encrypt('', trimmedPass) : '',
      passwordHash: trimmedPass ? CryptoService.hashPassword(trimmedPass) : undefined,
      updatedAt: Date.now()
    };
    const updated = [...tabs, newTab];
    saveToStorage(updated);
    setShowNewTabModal(false);
    setNewTabName('');
    setNewTabPass('');
    handleSelectTab(newTab);
  };

  const handleRename = () => {
    if (!renameTabId || !newNameInput.trim()) return;
    const updated = tabs.map(t => t.id === renameTabId ? { ...t, name: newNameInput.trim(), updatedAt: Date.now() } : t);
    saveToStorage(updated);
    setRenameTabId(null);
  };

  const handleDeleteTab = () => {
    if (!confirmDeleteId) return;
    const updated = tabs.filter(t => t.id !== confirmDeleteId);
    saveToStorage(updated);
    if (activeTabId === confirmDeleteId) {
      if (updated.length > 0) handleSelectTab(updated[0]);
      else setActiveTabId(null);
    }
    setConfirmDeleteId(null);
  };

  const activeTab = tabs.find(t => t.id === activeTabId);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 shrink-0">
        {tabs.map(tab => (
          <div key={tab.id} className="relative group shrink-0">
            <button
              onClick={() => handleTabClick(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                activeTabId === tab.id 
                  ? 'bg-amber-800 text-white border-amber-900 shadow-lg' 
                  : 'bg-white text-stone-500 hover:bg-stone-50 border-stone-100'
              }`}
            >
              {tab.passwordHash && <Lock size={12}/>}
              <span className="max-w-[120px] truncate">{tab.name}</span>
            </button>
            <div className="absolute -top-1 -right-1 hidden group-hover:flex gap-1 z-10 scale-90">
               <button onClick={(e) => { e.stopPropagation(); setRenameTabId(tab.id); setNewNameInput(tab.name); }} className="p-1.5 bg-blue-500 text-white rounded-full shadow-md"><Edit3 size={10}/></button>
               <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(tab.id); }} className="p-1.5 bg-rose-500 text-white rounded-full shadow-md"><Trash2 size={10}/></button>
            </div>
          </div>
        ))}
        <button onClick={handleNewTabClick} className="p-2 bg-stone-100 text-stone-400 hover:bg-stone-200 rounded-xl transition-colors border border-dashed border-stone-300" title={t.createNewSpaceTitle}><Plus size={20} /></button>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-3xl overflow-hidden border border-stone-100 shadow-sm flex flex-col">
        {!activeTabId ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-300 space-y-4 opacity-40 py-20">
            <FileText size={80} />
            <p className="font-serif italic text-xl">{t.selectSpacePrompt}</p>
          </div>
        ) : !isUnlocked ? (
          <div className="h-full flex flex-col items-center justify-center p-8 bg-stone-50/50 animate-in fade-in duration-300 overflow-y-auto no-scrollbar py-20">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-all duration-300 shrink-0 ${unlockStatus === 'error' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-600'}`}>
              {unlockStatus === 'error' ? <ShieldAlert size={32} /> : unlockStatus === 'success' ? <Check size={32} className="text-emerald-500" /> : unlockStatus === 'loading' ? <Loader2 size={32} className="animate-spin" /> : <Key size={32} />}
            </div>
            
            <p className={`text-sm mb-8 transition-colors ${unlockStatus === 'error' ? 'text-rose-500 font-bold' : unlockStatus === 'success' ? 'text-emerald-500 font-bold' : 'text-stone-500'}`}>
              {unlockStatus === 'error' ? errorMessage : unlockStatus === 'success' ? t.unlockSuccess : t.accessPrompt}
            </p>

            <div className="w-full max-w-xs space-y-4 shrink-0">
               <div className="relative">
                  <input 
                    autoFocus
                    type="password" 
                    placeholder={t.enterPasswordPlaceholder} 
                    value={authPassword}
                    onChange={e => {
                      setAuthPassword(e.target.value);
                      if(unlockStatus !== 'none') setUnlockStatus('none');
                    }}
                    onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                    className={`w-full px-4 py-3 bg-white border rounded-xl outline-none text-center transition-all ${unlockStatus === 'error' ? 'border-rose-300 ring-2 ring-rose-500/10' : 'border-stone-200 focus:ring-2 focus:ring-amber-500/20 shadow-sm'}`}
                  />
               </div>
               <button 
                onClick={handleUnlock} 
                disabled={unlockStatus === 'loading'}
                className="w-full py-3 bg-amber-800 text-white rounded-xl font-bold shadow-lg shadow-amber-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
               >
                 {unlockStatus === 'success' ? <Check size={18}/> : unlockStatus === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Key size={18}/>}
                 {t.unlockButton}
               </button>
            </div>
          </div>
        ) : (
          <Editor 
            key={activeTabId} 
            initialTitle={activeTab?.name}
            initialContent={decryptedContent}
            language={language}
            onSave={handleSaveContent}
            onBack={onBack}
            hideTitleInput={true}
            onChange={handleEditorChange}
          />
        )}
      </div>

      {showUnsavedModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-stone-100 animate-in zoom-in-95">
             <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-4"><AlertTriangle size={32}/></div>
             <h4 className="text-xl font-bold text-stone-800 mb-2 text-center">{t.unsavedChangesTitle}</h4>
             <p className="text-sm text-stone-500 mb-8 text-center">{t.unsavedChangesMessage}</p>
             <div className="flex flex-col gap-3">
                <button onClick={() => handleConfirmUnsaved(true)} className="w-full py-4 bg-amber-800 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                   <Save size={18} /> {t.saveAndContinue}
                </button>
                <button onClick={() => handleConfirmUnsaved(false)} className="w-full py-3 text-rose-500 font-bold bg-rose-50 rounded-xl transition-all active:scale-95">
                   {t.discardAndContinue}
                </button>
                <button onClick={() => setShowUnsavedModal(false)} className="w-full py-3 text-stone-400 font-bold transition-all active:scale-95">
                   {t.cancel}
                </button>
             </div>
          </div>
        </div>
      )}

      {renameTabId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-sm w-full shadow-2xl border border-stone-100 animate-in zoom-in-95">
             <h4 className="text-xl font-bold text-stone-800 mb-6 font-serif">{t.renameSpaceTitle}</h4>
             <input autoFocus type="text" value={newNameInput} onChange={e => setNewNameInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRename()} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 mb-6" />
             <div className="flex gap-3">
                <button onClick={() => setRenameTabId(null)} className="flex-1 py-3 text-stone-500 font-bold bg-stone-50 rounded-xl">{t.cancel}</button>
                <button onClick={handleRename} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95">{t.save}</button>
             </div>
          </div>
        </div>
      )}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-sm w-full shadow-2xl border border-stone-100 animate-in zoom-in-95">
             <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-4"><AlertTriangle size={32}/></div>
             <h4 className="text-xl font-bold text-stone-800 mb-2 text-center">{t.deleteSpaceTitle}</h4>
             <p className="text-sm text-stone-500 mb-8 text-center">{t.deleteSpaceMessage}</p>
             <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-3 text-stone-500 font-bold bg-stone-50 rounded-xl">{t.cancel}</button>
                <button onClick={handleDeleteTab} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg">{t.delete}</button>
             </div>
          </div>
        </div>
      )}
      {showNewTabModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-sm w-full shadow-2xl border border-stone-100 relative animate-in zoom-in-95">
             <button onClick={() => setShowNewTabModal(false)} className="absolute top-6 right-6 text-stone-300 hover:text-stone-600"><X size={24}/></button>
             <h4 className="text-xl font-bold text-stone-800 mb-6 font-serif">{t.createNewSpaceTitle}</h4>
             <div className="space-y-4">
                <input type="text" value={newTabName} onChange={e => setNewTabName(e.target.value)} placeholder={t.spaceNamePlaceholder} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20" />
                <input type="password" value={newTabPass} onChange={e => setNewTabPass(e.target.value)} placeholder={t.passwordPlaceholder} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20" />
                <button onClick={handleCreateTab} className="w-full py-4 bg-amber-800 text-white rounded-xl font-bold shadow-lg mt-2 transition-all active:scale-95 hover:bg-amber-900">{t.createAction}</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};