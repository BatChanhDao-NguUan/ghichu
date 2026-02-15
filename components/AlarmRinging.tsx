import React from 'react';
import { Alarm, Language, RunningTimer, CalendarEvent } from '../types';
import { TRANSLATIONS } from '../constants';
import { Volume2, BellRing, AlarmClock, RotateCcw, XCircle, CalendarCheck, Check } from 'lucide-react';

interface AlarmRingingProps {
  alarm?: Alarm;
  timer?: RunningTimer;
  event?: CalendarEvent;
  language: Language;
  onDismiss: () => void;
  onSnooze?: () => void;
  onReset?: () => void;
}

export const AlarmRinging: React.FC<AlarmRingingProps> = ({ 
    alarm, 
    timer, 
    event,
    language, 
    onDismiss, 
    onSnooze, 
    onReset 
}) => {
  const t = TRANSLATIONS[language];
  const isTimer = !!timer;
  const isEvent = !!event;

  const formatDisplay = (total: number) => {
    const hh = Math.floor(total / 3600);
    const mm = Math.floor((total % 3600) / 60);
    const ss = total % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  };

  return (
    <div className={`fixed inset-0 z-[100] ${isEvent ? 'bg-gradient-to-b from-indigo-600 to-indigo-900' : (isTimer ? 'bg-gradient-to-b from-stone-800 to-black' : 'bg-gradient-to-b from-amber-600 to-amber-900')} text-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500`}>
      <div className="mb-12 animate-bounce">
        {isEvent ? <CalendarCheck size={80} className="text-indigo-200" /> : (isTimer ? <AlarmClock size={80} className="text-stone-400" /> : <BellRing size={80} className="text-amber-200" />)}
      </div>

      <div className="mb-8">
        <h1 className="text-8xl font-light tracking-tighter mb-2">
            {isEvent ? new Date(event.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}) : (isTimer ? "00:00:00" : alarm?.time)}
        </h1>
        <p className="text-2xl font-medium opacity-90 uppercase tracking-widest">
          {isEvent ? (event.title || t.upcomingEvent) : (isTimer ? (timer.label || t.timer) : (alarm?.label || t.alarm))}
        </p>
        {isEvent && event.location && (
          <p className="text-lg opacity-70 mt-2 italic">{event.location}</p>
        )}
      </div>

      <div className="w-full max-w-sm flex flex-col gap-6 mt-12">
        <button 
            onClick={onDismiss}
            className="w-full py-8 rounded-3xl bg-white text-stone-900 text-4xl font-bold shadow-2xl active:scale-95 transition-transform flex items-center justify-center gap-4"
        >
            <Check size={32} /> {t.dismiss || 'Đóng'}
        </button>

        {isTimer && onReset && (
            <button 
                onClick={onReset}
                className="w-full py-6 rounded-3xl bg-stone-100/10 text-white text-3xl font-bold shadow-2xl active:scale-95 transition-transform flex items-center justify-center gap-4 border border-white/20"
            >
                <RotateCcw size={28} /> {t.reset || 'Đặt lại'}
            </button>
        )}
        
        {!isTimer && !isEvent && alarm?.snoozeEnabled && onSnooze && (
            <button 
                onClick={onSnooze}
                className="w-full py-4 rounded-full bg-black/20 text-white text-xl font-medium hover:bg-black/30 backdrop-blur-md"
            >
                {t.snooze || 'Báo lại'} ({alarm.snoozeInterval} {t.minutes})
            </button>
        )}
      </div>

      <div className="absolute bottom-12 flex items-center gap-3 text-white/30">
        <BellRing size={20} />
        <span className="text-xs uppercase tracking-widest font-bold">Life Notes Alert Service</span>
      </div>
    </div>
  );
};