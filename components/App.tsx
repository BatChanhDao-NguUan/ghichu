
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Calendar, PenTool, Settings, HelpCircle, Clock, Heart, Calculator, AlertTriangle, Save } from 'lucide-react';
import { StorageService } from '../services/storage';
import { AppSettings, View, Language, Alarm, RunningTimer, CalendarEvent } from '../types';
import { THEMES, ACCENT_COLORS, BUTTON_STYLES, TRANSLATIONS } from '../constants';

import { DailyQuote } from './DailyQuote';
import { SettingsModal } from './SettingsModal';
import { ChatRooms } from './ChatRooms';
import { CalendarNotes } from './CalendarNotes';
import { CreateNotes } from './ProtectedNotes';
import { QuoteHistory } from './QuoteHistory';
import { LandingPage } from './LandingPage';
import { BuddhismSection } from './BuddhismSection';
import { ReminderTools } from './ReminderTools';
import { AlarmRinging } from './AlarmRinging';
import { ScientificCalculator } from './ScientificCalculator';

const App: React.FC = () => {
  const [isInApp, setIsInApp] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => {
    return StorageService.getSettings();
  });
  const [currentView, setCurrentView] = useState<View>('create-note');
  const [showDailyQuote, setShowDailyQuote] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // State quản lý việc lưu thay đổi
  const [isEditorDirty, setIsEditorDirty] = useState(false);
  const [pendingView, setPendingView] = useState<View | 'settings' | null>(null);
  const [showUnsavedNavModal, setShowUnsavedNavModal] = useState(false);

  const [triggeredAlarm, setTriggeredAlarm] = useState<Alarm | null>(null);
  const [triggeredTimer, setTriggeredTimer] = useState<RunningTimer | null>(null);
  const [triggeredEvent, setTriggeredEvent] = useState<CalendarEvent | null>(null);
  const ringAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isInApp) {
        const interval = setInterval(() => {
            const now = new Date();
            const nowTs = now.getTime();
            const currentDay = now.getDay();
            const currentHHmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const todayStr = now.toISOString().split('T')[0];

            const allAlarms = StorageService.getAlarms();
            const alarmHit = allAlarms.find(a => {
                if (!a || !a.isActive) return false;
                if (a.snoozedUntil) return a.snoozedUntil <= nowTs;
                return a.time === currentHHmm && a.repeatDays.includes(currentDay) && a.lastTriggered !== todayStr;
            });

            if (alarmHit && !triggeredAlarm && !triggeredTimer && !triggeredEvent) {
                const updatedAlarms = allAlarms.map(a => 
                  a.id === alarmHit.id ? { ...a, lastTriggered: todayStr, snoozedUntil: undefined } : a
                );
                StorageService.saveAlarms(updatedAlarms);
                
                setTriggeredAlarm(alarmHit);
                playRingSound(alarmHit.ringtone, alarmHit.volume, alarmHit.gradualVolume);
            }

            const allTimers = StorageService.getRunningTimers();
            const timerHit = allTimers.find(t => t && t.status === 'completed' && !t.isRinging);
            
            if (timerHit && !triggeredAlarm && !triggeredTimer && !triggeredEvent) {
                const updatedTimers = allTimers.map(t => t.id === timerHit.id ? { ...t, isRinging: true } : t);
                StorageService.saveRunningTimers(updatedTimers);
                setTriggeredTimer(timerHit);
                playRingSound(timerHit.ringtone, timerHit.volume, false);
            }

            const allEvents = StorageService.getCalendarEvents();
            const eventHit = allEvents.find(e => {
                if (!e || !e.startDate) return false;
                const start = new Date(e.startDate).getTime();
                if (isNaN(start)) return false;
                const isDue = Math.abs(nowTs - start) < 60000 && e.lastNotified !== now.toISOString().substring(0, 16);
                return isDue && !e.isRinging;
            });

            if (eventHit && !triggeredAlarm && !triggeredTimer && !triggeredEvent) {
                const updatedEvents = allEvents.map(e => e.id === eventHit.id ? { ...e, isRinging: true, lastNotified: now.toISOString().substring(0, 16) } : e);
                StorageService.saveCalendarEvents(updatedEvents);
                setTriggeredEvent(eventHit);
                playRingSound(eventHit.ringtone, eventHit.volume || 0.7, false);
            }
        }, 1000);
        return () => clearInterval(interval);
    }
  }, [isInApp, triggeredAlarm, triggeredTimer, triggeredEvent]);

  const playRingSound = (url: string | undefined, maxVolume: number, gradual: boolean) => {
    const audioUrl = url || 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
    const audio = new Audio(audioUrl);
    audio.loop = true;
    audio.volume = maxVolume;
    ringAudioRef.current = audio;
    
    if (gradual) {
        audio.volume = 0.05;
        audio.play().catch(err => console.log(err));
        const fade = setInterval(() => {
            if (ringAudioRef.current && ringAudioRef.current.volume < maxVolume) {
                ringAudioRef.current.volume = Math.min(maxVolume, ringAudioRef.current.volume + 0.05);
            } else {
                clearInterval(fade);
            }
        }, 3000);
    } else {
        audio.play().catch(err => console.log(err));
    }
  };

  const handleEnterApp = (lang: Language) => {
    const loadedSettings = StorageService.getSettings();
    const newSettings = { ...loadedSettings, language: lang };
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
    setIsInApp(true);
    
    const today = new Date().toISOString().split('T')[0];
    const seen = Array.isArray(newSettings.seenQuotes) ? newSettings.seenQuotes : [];
    const lastSeen = seen[seen.length - 1];
    
    if (lastSeen !== today) {
      setShowDailyQuote(true);
      const updatedSeen = [...seen, today];
      const settingsWithSeen = {...newSettings, seenQuotes: updatedSeen};
      setSettings(settingsWithSeen);
      StorageService.saveSettings(settingsWithSeen);
    }
  };

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    StorageService.saveSettings(updated);
  };

  const requestViewChange = (view: View | 'settings') => {
    if (isEditorDirty && currentView === 'create-note' && view !== 'create-note') {
      setPendingView(view);
      setShowUnsavedNavModal(true);
    } else {
      if (view === 'settings') {
        setShowSettings(true);
      } else {
        setCurrentView(view as View);
      }
    }
  };

  const confirmNavigation = (shouldNavigate: boolean) => {
    if (shouldNavigate && pendingView) {
      if (pendingView === 'settings') {
        setShowSettings(true);
      } else {
        setCurrentView(pendingView as View);
      }
      setIsEditorDirty(false);
    }
    setPendingView(null);
    setShowUnsavedNavModal(false);
  };

  if (!isInApp) return <LandingPage onEnter={handleEnterApp} />;

  const accentClass = ACCENT_COLORS[settings.theme] || ACCENT_COLORS.amber;
  const themeClass = THEMES[settings.theme] || THEMES.amber;
  const buttonClass = BUTTON_STYLES[settings.theme] || BUTTON_STYLES.amber;
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${themeClass}`}>
      {(triggeredAlarm || triggeredTimer || triggeredEvent) && (
          <AlarmRinging 
            alarm={triggeredAlarm || undefined} 
            timer={triggeredTimer || undefined}
            event={triggeredEvent || undefined}
            language={settings.language}
            onDismiss={() => {
                if (ringAudioRef.current) { 
                    ringAudioRef.current.pause(); 
                    ringAudioRef.current = null; 
                }
                if (triggeredTimer) {
                  const timers = StorageService.getRunningTimers();
                  const updated = timers.filter(t => t.id !== triggeredTimer.id);
                  StorageService.saveRunningTimers(updated);
                  window.dispatchEvent(new CustomEvent('timer_updated'));
                }
                setTriggeredAlarm(null); 
                setTriggeredTimer(null); 
                setTriggeredEvent(null);
            }}
          />
      )}

      {showDailyQuote && (
        <DailyQuote 
          language={settings.language} 
          onClose={() => setShowDailyQuote(false)}
          onViewHistory={() => { setShowDailyQuote(false); requestViewChange('history'); }}
          accentColorClass={buttonClass}
        />
      )}

      {showSettings && (
        <SettingsModal settings={settings} updateSettings={handleUpdateSettings} onClose={() => setShowSettings(false)} />
      )}

      {showUnsavedNavModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-stone-100 animate-in zoom-in-95">
             <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-4"><AlertTriangle size={32}/></div>
             <h4 className="text-xl font-bold text-stone-800 mb-2 text-center">{t.unsavedChangesTitle}</h4>
             <p className="text-sm text-stone-500 mb-8 text-center">{t.unsavedChangesMessage}</p>
             <div className="flex flex-col gap-3">
                <button onClick={() => confirmNavigation(false)} className="w-full py-4 bg-amber-800 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95">
                   {t.back || 'Quay lại'}
                </button>
                <button onClick={() => confirmNavigation(true)} className="w-full py-3 text-rose-500 font-bold bg-rose-50 rounded-xl transition-all active:scale-95">
                   {t.discardAndContinue}
                </button>
             </div>
          </div>
        </div>
      )}

      <div className="flex h-screen overflow-hidden">
        <aside className="hidden md:flex flex-col w-20 lg:w-64 bg-white border-r border-stone-100 z-10 shrink-0">
          <button onClick={() => requestViewChange('history')} className="p-6 flex items-center gap-3 shrink-0" title={t.history}>
             <div className="relative w-12 h-12 flex items-center justify-center animate-heartbeat shrink-0">
               <Heart size={44} className="text-rose-600 fill-rose-600" />
               <span className={`absolute text-white font-serif font-bold mb-0.5 pointer-events-none ${settings.language === 'vi' ? 'text-lg' : 'text-[11px] uppercase tracking-tighter'}`}>
                  {settings.language === 'vi' ? 'Ý' : 'Mano'}
               </span>
             </div>
             <span className="hidden lg:block font-serif font-bold text-xl text-stone-800">Life Notes</span>
          </button>

          <nav className="flex-1 px-4 space-y-2 mt-8 overflow-y-auto no-scrollbar">
            <NavButton active={currentView === 'create-note'} onClick={() => requestViewChange('create-note')} icon={<PenTool size={20} />} label={t.createNote} accentClass={accentClass} />
            <NavButton active={currentView === 'calendar'} onClick={() => requestViewChange('calendar')} icon={<Calendar size={20} />} label={t.calendar} accentClass={accentClass} />
            <NavButton active={currentView === 'chat'} onClick={() => requestViewChange('chat')} icon={<MessageCircle size={20} />} label={t.chatRooms} accentClass={accentClass} />
            <div className="my-4 border-t border-stone-100 pt-4">
                <NavButton active={currentView === 'qna'} onClick={() => requestViewChange('qna')} icon={<HelpCircle size={20} />} label={t.qna} accentClass={accentClass} />
                <NavButton active={currentView === 'reminder'} onClick={() => requestViewChange('reminder')} icon={<Clock size={20} />} label={t.reminder} accentClass={accentClass} />
                <NavButton active={currentView === 'calculator'} onClick={() => requestViewChange('calculator')} icon={<Calculator size={20} />} label={t.calculator} accentClass={accentClass} />
            </div>
          </nav>
          <div className="p-4 shrink-0">
            <button onClick={() => requestViewChange('settings')} className="w-full flex items-center gap-3 p-3 rounded-lg text-stone-500 hover:bg-stone-50 transition-colors" title={t.settings}>
              <Settings size={20} />
              <span className="hidden lg:block font-medium">{t.settings}</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 h-full overflow-hidden relative flex flex-col bg-stone-50/30">
          <div className="flex-1 p-2 md:p-8 max-w-6xl mx-auto w-full h-full flex flex-col overflow-hidden">
            {currentView === 'chat' && <ChatRooms language={settings.language} accentColor={accentClass} onBack={() => requestViewChange('create-note')} />}
            {currentView === 'calendar' && <CalendarNotes language={settings.language} accentColor={accentClass} onBack={() => requestViewChange('create-note')} />}
            {currentView === 'create-note' && <CreateNotes language={settings.language} accentColor={accentClass} onBack={() => requestViewChange('create-note')} onDirtyChange={setIsEditorDirty} />}
            {currentView === 'history' && <QuoteHistory language={settings.language} onBack={() => requestViewChange('create-note')} />}
            {currentView === 'qna' && <BuddhismSection language={settings.language} onBack={() => requestViewChange('create-note')} />}
            {currentView === 'reminder' && <ReminderTools language={settings.language} onBack={() => requestViewChange('create-note')} />}
            {currentView === 'calculator' && <ScientificCalculator language={settings.language} onBack={() => requestViewChange('create-note')} />}
          </div>
          
          <div className="md:hidden bg-white border-t border-stone-100 fixed bottom-0 left-0 right-0 z-20 flex justify-around items-center p-1 md:p-1.5 shrink-0 overflow-x-auto no-scrollbar landscape:h-10 landscape:p-0">
            <MobileNavButton active={currentView === 'create-note'} onClick={() => requestViewChange('create-note')} icon={<PenTool size={18} className="landscape:w-4 landscape:h-4" />} label={t.createNote} />
            <MobileNavButton active={currentView === 'calendar'} onClick={() => requestViewChange('calendar')} icon={<Calendar size={18} className="landscape:w-4 landscape:h-4" />} label={t.calendar} />
            <MobileNavButton active={currentView === 'chat'} onClick={() => requestViewChange('chat')} icon={<MessageCircle size={18} className="landscape:w-4 landscape:h-4" />} label={t.chatRooms} />
            <MobileNavButton active={currentView === 'history'} onClick={() => requestViewChange('history')} icon={<Heart size={18} className="landscape:w-4 landscape:h-4" />} label={t.history} />
            <MobileNavButton active={currentView === 'reminder'} onClick={() => requestViewChange('reminder')} icon={<Clock size={18} className="landscape:w-4 landscape:h-4" />} label={t.reminder} />
            <MobileNavButton active={currentView === 'qna'} onClick={() => requestViewChange('qna')} icon={<HelpCircle size={18} className="landscape:w-4 landscape:h-4" />} label={t.qna} />
            <MobileNavButton active={currentView === 'calculator'} onClick={() => requestViewChange('calculator')} icon={<Calculator size={18} className="landscape:w-4 landscape:h-4" />} label={t.calculator} />
            <button onClick={() => requestViewChange('settings')} className="p-2 text-stone-400 shrink-0 landscape:p-1" title={t.settings}>
               <Settings size={18} className="landscape:w-4 landscape:h-4" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label, accentClass }: any) => (
  <button 
    onClick={onClick} 
    title={label}
    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${active ? `${accentClass} font-bold shadow-sm` : 'text-stone-500 hover:bg-stone-50'}`}
  >
    {icon}
    <span className="hidden lg:block">{label}</span>
  </button>
);

const MobileNavButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick} 
    title={label}
    className={`p-2 rounded-xl transition-colors shrink-0 landscape:p-1 ${active ? 'text-amber-800 bg-amber-50 shadow-inner' : 'text-stone-400'}`}
  >
    {icon}
  </button>
);

export default App;
