import React, { useState } from 'react';
import { ArrowLeft, Video, UploadCloud, Monitor, Smartphone, Maximize2 } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface ChatRoomsProps {
  language: Language;
  accentColor: string;
  onBack: () => void;
}

export const ChatRooms: React.FC<ChatRoomsProps> = ({ language, accentColor, onBack }) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] md:h-[calc(100vh-60px)] landscape:h-[calc(100vh-60px)] bg-[#f3f2f1] rounded-[1.5rem] overflow-hidden border border-stone-200 shadow-sm font-sans animate-in fade-in duration-500">
      {/* Header Optimized */}
      <div className="px-4 py-2 md:py-4 border-b border-stone-200 bg-white/80 backdrop-blur flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center gap-3 overflow-hidden">
            <button onClick={onBack} className="p-1.5 hover:bg-stone-200 rounded-lg text-stone-600 transition-colors shrink-0">
                <ArrowLeft size={18} />
            </button>
            <div className="truncate">
              <h2 className="font-bold text-[#242424] text-sm md:text-lg leading-tight truncate">{t.chatRooms}</h2>
              <p className="hidden xs:block text-[8px] md:text-[10px] text-stone-400 font-bold uppercase tracking-widest truncate">Video Meet & Sharing</p>
            </div>
        </div>
        <div className="hidden lg:flex items-center gap-4 text-stone-400">
           <div className="flex items-center gap-1"><Monitor size={12}/> <span className="text-[9px] font-bold">OPTIMIZED</span></div>
           <div className="flex items-center gap-1"><Smartphone size={12}/> <span className="text-[9px] font-bold">READY</span></div>
        </div>
      </div>

      {/* Main Content Areas - Mobile Landscape Optimized */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-stone-900 landscape:flex-row">
        {/* Meet Area (Main) */}
        <div className="flex-1 flex flex-col min-w-0 border-b md:border-b-0 md:border-r border-stone-700 relative z-0 overflow-hidden">
           <div className="bg-stone-800 p-1.5 flex items-center justify-between border-b border-stone-700 shrink-0">
              <div className="flex items-center gap-2">
                <Video size={14} className="text-rose-500" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-300">Meet (Video Chat)</span>
              </div>
           </div>
           
           <div className="flex-1 relative bg-black overflow-hidden">
             <iframe 
               src="https://meet.no42.org/" 
               className="absolute top-0 left-0 w-full h-full border-none"
               title="Meet No42"
               allow="camera; microphone; display-capture; fullscreen; clipboard-read; clipboard-write"
               sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"
             />
           </div>
        </div>

        {/* Upload Area (Sidebar) */}
        <div className="
          w-full md:w-20 lg:w-24 
          hover:md:w-80 lg:hover:w-96
          landscape:w-16 landscape:hover:w-80
          h-32 md:h-full landscape:h-full
          bg-white 
          transition-all duration-500 ease-in-out 
          flex flex-col 
          relative z-10
          shadow-[-10px_0_15px_rgba(0,0,0,0.1)]
          group
        ">
           <div className="bg-stone-100 p-1.5 flex items-center gap-2 border-b border-stone-200 shrink-0 overflow-hidden whitespace-nowrap">
              <UploadCloud size={14} className="text-blue-600 shrink-0" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                File Sharing
              </span>
              <Maximize2 size={10} className="ml-auto text-stone-300 hidden md:block group-hover:hidden" />
           </div>
           
           <div className="flex-1 relative overflow-hidden">
             <iframe 
               src="https://www.directfiles.link/" 
               className="absolute inset-0 w-full h-full border-none"
               title="DirectFiles"
               sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"
             />
             
             {/* Overlay for desktop/landscape interaction */}
             <div className="hidden md:flex landscape:flex absolute inset-0 bg-white/60 backdrop-blur-[1px] group-hover:hidden items-center justify-center cursor-pointer pointer-events-none transition-all">
                <div className="rotate-90 flex flex-col items-center">
                    <UploadCloud size={18} className="text-stone-300 mb-2" />
                    <span className="text-[8px] font-black text-stone-400 uppercase tracking-[0.3em]">FILES</span>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};