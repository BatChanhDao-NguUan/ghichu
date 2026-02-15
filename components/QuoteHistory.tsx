
import React from 'react';
import { DailyQuoteData, Language } from '../types';
import { TRANSLATIONS, QUOTES } from '../constants';
import { ArrowLeft } from 'lucide-react';

interface QuoteHistoryProps {
  language: Language;
  onBack: () => void;
}

export const QuoteHistory: React.FC<QuoteHistoryProps> = ({ language, onBack }) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-full text-stone-500">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-serif font-bold text-stone-800">{t.history}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pb-8">
        {QUOTES.map(quote => {
          // Fallback logic: Try selected language -> then English -> then Vietnamese
          const content = quote.content[language] || quote.content['en'] || quote.content['vi'];
          return (
            <div key={quote.id} className="bg-white rounded-lg shadow-sm border border-stone-100 overflow-hidden flex flex-col">
              <div className="h-40 overflow-hidden relative">
                <img src={quote.imageUrl} alt="Quote Background" className="w-full h-full object-cover transition-transform hover:scale-105 duration-700" />
                <div className="absolute inset-0 bg-black/20" />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <p className="font-serif italic text-amber-800 mb-2 pl-2 border-l-2 border-amber-200 text-sm">
                  "{content.pali}"
                </p>
                <blockquote className="font-serif text-lg text-stone-800 mb-4 flex-1">
                  "{content.vietnamese}"
                </blockquote>
                <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">— {content.source}</p>
                <div className="text-sm text-stone-600 bg-stone-50 p-3 rounded">
                  {content.explanation}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
