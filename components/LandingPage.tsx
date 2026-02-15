
import React, { useState } from 'react';
import { ArrowRight, Globe, Heart } from 'lucide-react';
import { StorageService } from '../services/storage';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh', label: '中文' },
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
  { code: 'th', label: 'ไทย' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
];

interface LandingPageProps {
  onEnter: (lang: Language) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [name, setName] = useState('');
  const [selectedLang, setSelectedLang] = useState<Language>('en');
  
  const t = TRANSLATIONS[selectedLang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      StorageService.setNamespace(name);
      onEnter(selectedLang);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8 border border-stone-100">
        <div className="text-center mb-8">
          <div className="relative w-32 h-32 mx-auto mb-6 flex items-center justify-center animate-heartbeat">
             <Heart size={110} className="text-rose-600 fill-rose-600" />
             <span className={`absolute text-white font-serif font-bold mb-1 pointer-events-none ${selectedLang === 'vi' ? 'text-4xl' : 'text-2xl uppercase tracking-tighter'}`}>
               {selectedLang === 'vi' ? 'Ý' : 'Mano'}
             </span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-stone-800">{t.appTitle}</h1>
          <p className="text-stone-500 mt-2">{t.welcome}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-500 mb-2 flex items-center gap-2">
              <Globe size={16} /> {t.language}
            </label>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value as Language)}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-500 mb-2">
              {t.enterSite}
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. my-private-diary"
                className="w-full p-4 pr-12 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/50 outline-none transition-all font-medium text-stone-800"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-4 bg-amber-800 text-white rounded-lg font-bold hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.go}
            <ArrowRight size={20} />
          </button>
        </form>
        <p className="text-center text-xs text-stone-400 mt-8">Fully Offline • Private Storage • No Account</p>
      </div>
    </div>
  );
};
