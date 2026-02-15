import React, { useState } from 'react';
import { ArrowLeft, Library, Globe, ShieldCheck, Loader2 } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface BuddhismSectionProps {
  language: Language;
  onBack: () => void;
}

const NIKAYA_URL = "https://thienduongnikaya-chontintoan.com/danh-muc/chon-tin-toannikaya-phan-loai-1bon-bo-kinhxep-theo-chu-de-23.html";

export const BuddhismSection: React.FC<BuddhismSectionProps> = ({ language, onBack }) => {
  const t = TRANSLATIONS[language];
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] md:h-[calc(100vh-60px)] landscape:h-[calc(100vh-60px)] bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-stone-200 shadow-sm font-sans animate-in fade-in duration-500">
      {/* Header Optimized for Landscape */}
      <div className="px-4 md:px-6 py-2 md:py-4 border-b border-stone-100 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
          <button onClick={onBack} className="p-1.5 md:p-2 hover:bg-stone-50 rounded-full text-stone-400 transition-colors shrink-0">
            <ArrowLeft size={18} className="md:w-5 md:h-5" />
          </button>
          <div className="truncate">
            <h2 className="text-sm md:text-lg font-serif font-bold text-stone-800 flex items-center gap-2 truncate">
              <Library size={18} className="text-amber-700 shrink-0 md:w-5 md:h-5" />
              <span className="truncate">{t.qna}</span>
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-stone-400 font-bold whitespace-nowrap">Nikaya Library</span>
              <div className="hidden sm:flex items-center gap-1 px-1 py-0.5 bg-green-50 text-green-600 rounded text-[7px] font-bold">
                <ShieldCheck size={9} /> CHÁNH PHÁP
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative bg-stone-50 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white space-y-4">
             <div className="relative">
                <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-amber-100 border-t-amber-700 rounded-full animate-spin"></div>
                <Library className="absolute inset-0 m-auto text-amber-700 opacity-20" size={20} />
             </div>
             <div className="text-center">
                <p className="text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-widest">{t.loadingNikaya}</p>
             </div>
          </div>
        )}

        <div className="w-full h-full overflow-hidden">
          <iframe 
            src={NIKAYA_URL} 
            className="w-full h-full border-none"
            title="Nikaya Library"
            onLoad={() => setIsLoading(false)}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>

        <div className="hidden sm:flex absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/90 backdrop-blur shadow-lg rounded-xl border border-stone-200 items-center gap-2 animate-in fade-in slide-in-from-bottom-2 delay-1000">
           <Globe size={14} className="text-amber-700" />
           <p className="text-[10px] font-medium text-stone-600">
             Kết nối trực tiếp nguồn kinh tạng Nikaya.
           </p>
        </div>
      </div>
    </div>
  );
};