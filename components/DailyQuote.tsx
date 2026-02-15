
import React, { useEffect } from 'react';
import { X, History, Bookmark } from 'lucide-react';
import { DailyQuoteData, Language } from '../types';
import { TRANSLATIONS, QUOTES } from '../constants';

interface DailyQuoteProps {
  language: Language;
  onClose: () => void;
  onViewHistory: () => void;
  accentColorClass: string;
}

export const DailyQuote: React.FC<DailyQuoteProps> = ({ language, onClose, onViewHistory, accentColorClass }) => {
  const t = TRANSLATIONS[language];
  
  // Logic chọn câu theo ngày (Hash theo YYYYMMDD)
  const getDailyQuote = () => {
    const today = new Date();
    const dateString = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const hash = Array.from(dateString).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = hash % QUOTES.length;
    return QUOTES[index];
  };

  const quote = getDailyQuote();
  const content = quote.content[language] || quote.content['vi'];

  // Fix: Ẩn thanh cuộn của body khi modal hiển thị
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-md p-4 animate-in fade-in duration-500">
      <div className="bg-[#fdfbf7] rounded-[2rem] shadow-2xl max-w-4xl w-full relative overflow-hidden flex flex-col md:flex-row max-h-[90vh] border border-stone-200">
        
        {/* Left: Content Section */}
        <div className="p-8 md:p-12 flex-1 flex flex-col overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Bookmark className="text-amber-700" size={20} />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">
                {t.dailyQuote}
              </span>
            </div>
            <button onClick={onClose} className="text-stone-300 hover:text-stone-600 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-8">
            {/* Pali Section */}
            <div className="relative">
              <div className="absolute -left-4 top-0 w-1 h-full bg-amber-100 rounded-full"></div>
              <p className="font-serif italic text-2xl text-amber-900 leading-relaxed pl-4">
                "{content.pali}"
              </p>
            </div>

            {/* Vietnamese Section */}
            <p className="font-serif font-bold text-xl text-stone-800 leading-relaxed border-b border-stone-100 pb-6">
              {content.vietnamese}
            </p>

            {/* Explanation Section */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-amber-700/50">
                {t.quoteExplanation}
              </h3>
              <p className="text-stone-600 text-sm leading-relaxed italic">
                {content.explanation}
              </p>
            </div>

            {/* Source Section */}
            <div className="pt-4">
              <span className="text-xs font-medium text-stone-400">
                — {content.source}
              </span>
            </div>
          </div>

          <div className="mt-12 flex gap-4">
             <button
              onClick={onClose}
              className={`flex-1 py-4 rounded-2xl text-sm font-bold transition-all duration-300 active:scale-95 bg-amber-800 text-white shadow-lg shadow-amber-900/20`}
            >
              {t.close}
            </button>
            <button
              onClick={onViewHistory}
              className="p-4 rounded-2xl bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
              title="Lịch sử"
            >
              <History size={20} />
            </button>
          </div>
        </div>

        {/* Right: Illustration Image */}
        <div className="hidden md:block w-1/3 relative">
          <img 
            src={quote.imageUrl} 
            alt="Buddhist Illustration" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#fdfbf7] to-transparent"></div>
        </div>
      </div>
    </div>
  );
};
