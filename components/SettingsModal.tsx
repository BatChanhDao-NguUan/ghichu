import React from 'react';
import { X, Check } from 'lucide-react';
import { AppSettings, Language, Theme } from '../types';
import { TRANSLATIONS } from '../constants';

interface SettingsModalProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  onClose: () => void;
}

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

const THEMES: { code: Theme; label: string; color: string }[] = [
  { code: 'stone', label: 'Stone', color: '#a8a29e' },
  { code: 'slate', label: 'Slate', color: '#94a3b8' },
  { code: 'rose', label: 'Rose', color: '#fb7185' },
  { code: 'amber', label: 'Amber', color: '#fbbf24' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, updateSettings, onClose }) => {
  const t = TRANSLATIONS[settings.language];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 md:p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-2xl max-w-md w-full max-h-[90vh] md:max-h-auto overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-stone-100 shrink-0">
          <h2 className="text-lg md:text-xl font-serif font-bold text-stone-800">{t.settings}</h2>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-50 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 space-y-6 md:space-y-8">
          {/* Language Selection */}
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-stone-400 mb-3 uppercase tracking-widest">
              {t.language}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => updateSettings({ language: lang.code })}
                  className={`px-2 py-2 rounded-xl text-xs border transition-all truncate active:scale-95 ${
                    settings.language === lang.code
                      ? 'bg-amber-800 text-white border-amber-800 shadow-md'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Selection */}
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-stone-400 mb-3 uppercase tracking-widest">
              {t.theme}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((theme) => (
                <button
                  key={theme.code}
                  onClick={() => updateSettings({ theme: theme.code })}
                  className={`px-4 py-3 rounded-xl text-xs border flex items-center justify-between transition-all active:scale-95 ${
                    settings.theme === theme.code
                      ? 'bg-stone-100 border-amber-600 text-stone-900 shadow-inner font-bold'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span>{theme.label}</span>
                  <div 
                    className="w-4 h-4 rounded-full border border-white/50 shadow-sm" 
                    style={{ backgroundColor: theme.color }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 text-center text-[10px] text-stone-300 font-bold uppercase tracking-[0.2em] pb-2">
             Life Notes • Private & Offline
          </div>
        </div>
      </div>
    </div>
  );
};