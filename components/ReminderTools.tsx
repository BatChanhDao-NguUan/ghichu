
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Clock, Globe, Timer as TimerIcon, Watch, Plus, Trash2, Play, Pause, RotateCcw, 
  ChevronLeft, Volume2, Music, Bell, BellOff, Check, Search, 
  GripVertical, X, ArrowUp, ArrowDown, History, Info, Filter, MoreHorizontal,
  Edit3, Save, Volume1, VolumeX, Square, Upload, ArrowLeft, Timer, AlertTriangle
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Alarm, Language, WorldClockCity, StopwatchLap, StopwatchSession, RunningTimer, TimerPreset } from '../types';
import { StorageService } from '../services/storage';
import { TRANSLATIONS } from '../constants';

interface ReminderToolsProps {
  language: Language;
  onBack: () => void;
}

type Tab = 'alarm' | 'clock' | 'stopwatch' | 'timer';

const SYSTEM_RINGTONES = [
    { name: 'Digital Beep', url: 'https://assets.mixkit.co/active_storage/sfx/1000/1000-preview.mp3' },
    { name: 'Classic Bell', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
    { name: 'Short Alert', url: 'https://assets.mixkit.co/active_storage/sfx/999/999-preview.mp3' },
    { name: 'Digital Alert', url: 'https://assets.mixkit.co/active_storage/sfx/1001/1001-preview.mp3' },
    { name: 'Nature Breeze', url: 'https://assets.mixkit.co/active_storage/sfx/1002/1002-preview.mp3' },
    { name: 'Celestial Chime', url: 'https://assets.mixkit.co/active_storage/sfx/1003/1003-preview.mp3' },
    { name: 'Gentle Wake', url: 'https://assets.mixkit.co/active_storage/sfx/1004/1004-preview.mp3' },
];

export const ReminderTools: React.FC<ReminderToolsProps> = ({ language, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('alarm');
  const t = TRANSLATIONS[language];

  const renderTabButton = (tab: Tab, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      title={label}
      className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 transition-colors ${
        activeTab === tab 
          ? 'text-amber-800 border-b-2 border-amber-600 bg-amber-50' 
          : 'text-stone-500 hover:bg-stone-50'
      }`}
    >
      {icon}
      <span className="text-[10px] md:text-xs font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-stone-100 overflow-hidden font-sans">
      <div className="flex items-center border-b border-stone-200">
        <button onClick={onBack} className="p-4 hover:bg-stone-100 text-stone-500 border-r border-stone-100" title={t.back || "Back"}>
           <ArrowLeft size={20} />
        </button>
        <div className="flex flex-1">
            {renderTabButton('alarm', <Clock size={20} />, t.alarm)}
            {renderTabButton('clock', <Globe size={20} />, t.worldClock)}
            {renderTabButton('stopwatch', <Watch size={20} />, t.stopwatch)}
            {renderTabButton('timer', <TimerIcon size={20} />, t.timer)}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-stone-50/30 no-scrollbar">
        {activeTab === 'alarm' && <AlarmTab t={t} />}
        {activeTab === 'clock' && <WorldClockTab t={t} />}
        {activeTab === 'stopwatch' && <StopwatchTab t={t} />}
        {activeTab === 'timer' && <TimerTab t={t} />}
      </div>
    </div>
  );
};

// --- ALARM TAB ---
const AlarmTab = ({ t }: { t: any }) => {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [alarmToDelete, setAlarmToDelete] = useState<string | null>(null);

  useEffect(() => {
    setAlarms(StorageService.getAlarms());
  }, []);

  const saveAlarm = (alarm: Alarm) => {
    const updated = editingAlarm && alarms.some(a => a.id === alarm.id)
      ? alarms.map(a => a.id === alarm.id ? alarm : a)
      : [...alarms, alarm];
    setAlarms(updated);
    StorageService.saveAlarms(updated);
    setEditingAlarm(null);
  };

  const deleteAlarm = () => {
    if (alarmToDelete) {
        const updated = alarms.filter(a => a.id !== alarmToDelete);
        setAlarms(updated);
        StorageService.saveAlarms(updated);
        setAlarmToDelete(null);
    }
  };

  const toggleAlarm = (id: string) => {
    const updated = alarms.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a);
    setAlarms(updated);
    StorageService.saveAlarms(updated);
  };

  if (editingAlarm) {
    return <AlarmForm alarm={editingAlarm} t={t} onSave={saveAlarm} onCancel={() => setEditingAlarm(null)} />;
  }

  return (
    <div className="max-w-xl mx-auto space-y-4 relative">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-stone-800 font-serif">{t.alarm}</h3>
        <button 
          onClick={() => setEditingAlarm(createNewAlarm())}
          className="w-9 h-9 md:w-10 md:h-10 bg-amber-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <Plus size={20} className="md:w-6 md:h-6" />
        </button>
      </div>

      <div className="space-y-3">
        {alarms.length === 0 ? (
          <div className="text-center py-20 text-stone-400 opacity-50">
            <BellOff size={48} className="mx-auto mb-2" />
            <p>{t.noNotes}</p>
          </div>
        ) : (
          alarms.sort((a,b) => a.time.localeCompare(b.time)).map(alarm => (
            <div 
              key={alarm.id} 
              className={`bg-white p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-stone-100 flex justify-between items-center transition-all duration-300 ${alarm.isActive ? 'opacity-100' : 'opacity-60 bg-stone-50/50'}`}
            >
              <div className="cursor-pointer flex-1" onClick={() => setEditingAlarm(alarm)}>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl md:text-4xl font-light text-stone-800 tracking-tighter tabular-nums">{alarm.time}</span>
                </div>
                <div className="mt-0.5 flex flex-col">
                  <span className="text-[10px] md:text-xs font-bold text-amber-700 uppercase tracking-tighter">{alarm.label || t.alarm}</span>
                  <div className="flex gap-1 mt-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <span key={i} className={`text-[8px] md:text-[9px] w-3.5 h-3.5 md:w-4 md:h-4 flex items-center justify-center rounded-full ${alarm.repeatDays.includes(i) ? 'bg-amber-100 text-amber-700 font-bold' : 'text-stone-300'}`}>
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 md:gap-4">
                <button onClick={() => setAlarmToDelete(alarm.id)} className="text-stone-300 hover:text-rose-500 transition-colors p-2" title={t.delete}>
                    <Trash2 size={18} className="md:w-5 md:h-5"/>
                </button>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={alarm.isActive} 
                    onChange={() => toggleAlarm(alarm.id)} 
                    className="sr-only peer"
                  />
                  <div className="
                    w-10 h-5 md:w-12 md:h-6 
                    bg-stone-200 
                    rounded-full 
                    peer 
                    peer-focus:ring-2 
                    peer-focus:ring-amber-500/20 
                    peer-checked:bg-amber-600 
                    transition-all 
                    duration-300
                    after:content-[''] 
                    after:absolute 
                    after:top-[2px] 
                    after:left-[2px] 
                    after:bg-white 
                    after:rounded-full 
                    after:h-4 h-4 md:after:h-5 md:after:w-5 
                    after:w-4 md:after:w-5 
                    after:transition-all 
                    after:duration-300
                    after:shadow-sm
                    peer-checked:after:translate-x-5 md:peer-checked:after:translate-x-6
                  "></div>
                </label>
              </div>
            </div>
          ))
        )}
      </div>

      {alarmToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-sm w-full shadow-2xl border border-stone-100 animate-in zoom-in-95 duration-200">
                  <div className="flex flex-col items-center text-center">
                      <div className="w-14 h-14 md:w-16 md:h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-4">
                          <AlertTriangle size={28} className="md:w-8 md:h-8" />
                      </div>
                      <h4 className="text-lg md:text-xl font-bold text-stone-800 mb-2">{t.confirmDelete}</h4>
                      <p className="text-xs md:text-sm text-stone-500 mb-6 md:mb-8 leading-relaxed">{t.deleteAlarmConfirm}</p>
                      
                      <div className="flex gap-3 w-full">
                          <button 
                            onClick={() => setAlarmToDelete(null)} 
                            className="flex-1 py-2.5 md:py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-2xl font-bold transition-colors text-sm"
                          >
                              {t.cancel}
                          </button>
                          <button 
                            onClick={deleteAlarm} 
                            className="flex-1 py-2.5 md:py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 transition-all active:scale-95 text-sm"
                          >
                              {t.deleteNow}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const createNewAlarm = (): Alarm => ({
  id: Date.now().toString(),
  time: '07:00',
  label: '',
  isActive: true,
  repeatDays: [1, 2, 3, 4, 5],
  snoozeEnabled: true,
  snoozeInterval: 5,
  snoozeLimit: 0,
  snoozeCount: 0,
  volume: 0.7,
  vibrate: true,
  gradualVolume: true,
  ringtone: SYSTEM_RINGTONES[0].url
});

const AlarmForm = ({ alarm, t, onSave, onCancel }: { alarm: Alarm, t: any, onSave: (a: Alarm) => void, onCancel: () => void }) => {
  const [data, setData] = useState<Alarm>(alarm);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isCustomSnooze, setIsCustomSnooze] = useState(![5, 10, 15].includes(alarm.snoozeInterval));

  useEffect(() => {
    return () => stopAudioPreview();
  }, []);

  const stopAudioPreview = () => {
    if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
    }
    setIsPlayingPreview(false);
  };

  const toggleAudioPreview = () => {
    if (isPlayingPreview) {
        stopAudioPreview();
    } else {
        const audio = new Audio(data.ringtone || SYSTEM_RINGTONES[0].url);
        audio.volume = data.volume;
        audio.onended = () => setIsPlayingPreview(false);
        previewAudioRef.current = audio;
        audio.play().catch(e => console.log(e));
        setIsPlayingPreview(true);
    }
  };

  const toggleDay = (idx: number) => {
    const repeatDays = data.repeatDays.includes(idx) 
      ? data.repeatDays.filter(d => d !== idx)
      : [...data.repeatDays, idx];
    setData({ ...data, repeatDays });
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
          setData({ ...data, ringtone: ev.target?.result as string, ringtoneName: file.name });
          stopAudioPreview();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
      if (data.snoozeInterval < 1) {
          alert("Snooze time must be at least 1 minute");
          return;
      }
      stopAudioPreview();
      onSave(data);
  }

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in slide-in-from-bottom duration-300">
      <div className="p-3 md:p-4 border-b border-stone-100 flex justify-between items-center">
        <button onClick={() => { stopAudioPreview(); onCancel(); }} className="text-stone-500"><ChevronLeft /></button>
        <h4 className="font-bold text-stone-800 text-sm md:text-base">{t.alarmSetting}</h4>
        <button onClick={handleSave} className="text-amber-600 font-bold px-3 py-1 bg-amber-50 rounded-full text-xs md:text-sm">{t.save}</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 no-scrollbar pb-20">
        <div className="flex justify-center">
          <input 
            type="time" 
            value={data.time} 
            onChange={e => setData({ ...data, time: e.target.value })}
            className="text-5xl md:text-7xl font-light text-stone-800 outline-none border-none p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] bg-stone-50 shadow-inner tracking-tighter tabular-nums w-full text-center"
          />
        </div>

        <div className="space-y-3 md:space-y-4">
          <label className="text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-widest">{t.repeats}</label>
          <div className="flex justify-between px-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full text-[10px] md:text-xs font-bold transition-all ${data.repeatDays.includes(i) ? 'bg-amber-600 text-white shadow-md' : 'bg-stone-50 text-stone-400'}`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 md:space-y-4 bg-stone-50/50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-stone-100">
          <label className="text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
             <Timer size={14} className="text-amber-600" /> {t.snoozeLabel}
          </label>
          <div className="grid grid-cols-4 gap-2">
             {[5, 10, 15].map(min => (
               <button 
                key={min}
                onClick={() => { setData({...data, snoozeInterval: min}); setIsCustomSnooze(false); }}
                className={`py-1.5 md:py-2 rounded-xl text-[10px] md:text-xs font-bold transition-all ${!isCustomSnooze && data.snoozeInterval === min ? 'bg-amber-600 text-white' : 'bg-white border border-stone-200 text-stone-500'}`}
               >
                 {min}m
               </button>
             ))}
             <button 
                onClick={() => setIsCustomSnooze(true)}
                className={`py-1.5 md:py-2 rounded-xl text-[10px] md:text-xs font-bold transition-all ${isCustomSnooze ? 'bg-amber-600 text-white' : 'bg-white border border-stone-200 text-stone-500'}`}
             >
               {t.custom}
             </button>
          </div>
          {isCustomSnooze && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <input 
                type="number" 
                min="1"
                value={data.snoozeInterval}
                onChange={e => setData({...data, snoozeInterval: Math.max(1, parseInt(e.target.value) || 1)})}
                className="w-full bg-white p-2.5 md:p-3 rounded-xl border border-stone-200 outline-none text-center font-bold text-stone-700 text-sm"
                placeholder={t.snoozeInputPlaceholder}
              />
              <p className="text-[8px] md:text-[9px] text-stone-400 text-center mt-2 font-bold uppercase tracking-wider">{t.snoozeInputHelp}</p>
            </div>
          )}
        </div>

        <div className="space-y-3 md:space-y-4">
          <label className="text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-widest">{t.alarmName}</label>
          <input 
            type="text" 
            value={data.label} 
            onChange={e => setData({ ...data, label: e.target.value })}
            placeholder={t.alarmNamePlaceholder}
            className="w-full p-3 md:p-4 bg-stone-50 rounded-xl md:rounded-2xl border-none outline-none focus:ring-2 focus:ring-amber-200 text-sm md:text-base"
          />
        </div>

        <div className="space-y-3 md:space-y-4 bg-stone-50/50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-stone-100">
          <div className="flex flex-col gap-3">
             <div className="flex justify-between items-center">
                <span className="text-[10px] md:text-xs font-bold text-stone-400 uppercase">{t.sound}</span>
                <select 
                    value={data.ringtone && SYSTEM_RINGTONES.some(rt => rt.url === data.ringtone) ? data.ringtone : 'custom'} 
                    onChange={e => {
                        const val = e.target.value;
                        if (val !== 'custom') {
                            setData({ ...data, ringtone: val, ringtoneName: SYSTEM_RINGTONES.find(rt => rt.url === val)?.name });
                        }
                        stopAudioPreview();
                    }}
                    className="text-[10px] md:text-xs font-bold text-stone-600 bg-transparent outline-none cursor-pointer"
                >
                    {SYSTEM_RINGTONES.map(rt => (
                        <option key={rt.url} value={rt.url}>{rt.name}</option>
                    ))}
                    <option value="custom" disabled={!data.ringtone || SYSTEM_RINGTONES.some(rt => rt.url === data.ringtone)}>{t.yourMusic}</option>
                </select>
             </div>
             
             <div className="flex items-center gap-2 md:gap-3">
               <Music className="text-amber-600 shrink-0 md:w-5 md:h-5" size={18} />
               <div className="flex-1 overflow-hidden">
                  <p className="text-[9px] md:text-[10px] text-stone-400 truncate">{data.ringtoneName || 'Default'}</p>
               </div>
               <button onClick={() => { stopAudioPreview(); fileInputRef.current?.click(); }} className="text-[9px] md:text-[10px] font-bold text-amber-600 bg-white px-2.5 py-1 md:px-3 md:py-1.5 rounded-full shadow-sm whitespace-nowrap">{t.upload}</button>
               <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
             </div>
          </div>

          <div className="pt-2 md:pt-4 space-y-3">
             <div className="flex justify-between text-[9px] md:text-[10px] font-bold text-stone-400 uppercase">
                <span>{t.volume}</span>
                <span>{Math.round(data.volume * 100)}%</span>
             </div>
             <div className="flex items-center gap-3 md:gap-4">
                <button 
                    onClick={toggleAudioPreview} 
                    className={`p-1.5 md:p-2 rounded-full shadow-sm transition-colors ${isPlayingPreview ? 'bg-rose-100 text-rose-600' : 'bg-white text-amber-600'}`}
                >
                    {isPlayingPreview ? <Square size={14} className="md:w-4 md:h-4" fill="currentColor"/> : <Play size={14} className="md:w-4 md:h-4" fill="currentColor"/>}
                </button>
                <input 
                    type="range" min="0" max="1" step="0.01" 
                    value={data.volume} 
                    onChange={e => { setData({ ...data, volume: parseFloat(e.target.value) }); if (previewAudioRef.current) previewAudioRef.current.volume = parseFloat(e.target.value); }}
                    className="flex-1 accent-amber-600 h-1 md:h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                />
             </div>
             <label className="flex items-center gap-2 cursor-pointer pt-1 md:pt-2">
                <input type="checkbox" checked={data.gradualVolume} onChange={e => setData({...data, gradualVolume: e.target.checked})} className="w-3.5 h-3.5 md:w-4 md:h-4 accent-amber-600" />
                <span className="text-[10px] md:text-xs text-stone-600 font-medium">{t.gradualVolume}</span>
             </label>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- PICKER COMPONENT ---
const Picker = ({ unit, value, onChange, max }: any) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = parseInt(e.target.value) || 0;
        if (val < 0) val = 0;
        if (val > max) val = max;
        onChange(val);
    };

    return (
        <div className="flex flex-col items-center group">
            <button onClick={() => onChange(value >= max ? 0 : value + 1)} className="p-1 md:p-2 text-stone-200 hover:text-amber-600 transition-colors"><ChevronLeft size={18} className="rotate-90 md:w-5 md:h-5"/></button>
            <div className="w-16 h-20 md:w-20 md:h-24 bg-stone-50 rounded-[1.2rem] md:rounded-[1.5rem] flex flex-col items-center justify-center border border-stone-100 shadow-inner group-hover:border-amber-200 transition-colors">
                <input 
                    type="number"
                    value={value}
                    onChange={handleInputChange}
                    className="w-full text-center text-3xl md:text-4xl font-light text-stone-800 tabular-nums bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[8px] md:text-[10px] font-bold text-stone-300 uppercase tracking-widest">{unit}</span>
            </div>
            <button onClick={() => onChange(value <= 0 ? max : value - 1)} className="p-1 md:p-2 text-stone-200 hover:text-amber-600 transition-colors"><ChevronLeft size={18} className="-rotate-90 md:w-5 md:h-5"/></button>
        </div>
    );
};

// --- TIMER TAB ---
const TimerTab = ({ t }: { t: any }) => {
  const [runningTimers, setRunningTimers] = useState<RunningTimer[]>([]);
  const [presets, setPresets] = useState<TimerPreset[]>([]);
  const [showPicker, setShowPicker] = useState(true);
  const [h, setH] = useState(0);
  const [m, setM] = useState(5);
  const [s, setS] = useState(0);
  const [label, setLabel] = useState('');
  const [selectedRingtone, setSelectedRingtone] = useState(SYSTEM_RINGTONES[0].url);
  const [customRingtoneName, setCustomRingtoneName] = useState('');
  const [volume, setVolume] = useState(0.8);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadTimers = () => {
    setPresets(StorageService.getTimerPresets());
    setRunningTimers(StorageService.getRunningTimers());
  };

  useEffect(() => {
    loadTimers();
    const handleTimerUpdate = () => loadTimers();
    window.addEventListener('timer_updated', handleTimerUpdate);
    return () => {
        stopAudioPreview();
        window.removeEventListener('timer_updated', handleTimerUpdate);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let changed = false;
      const updated = runningTimers.map(timer => {
        if (timer.status === 'running') {
          const remaining = Math.max(0, Math.ceil((timer.endTime - now) / 1000));
          if (remaining === 0 && timer.remainingSeconds > 0) {
            changed = true;
            return { ...timer, remainingSeconds: 0, status: 'completed' as const };
          }
          if (remaining !== timer.remainingSeconds) {
            changed = true;
            return { ...timer, remainingSeconds: remaining };
          }
        }
        return timer;
      });

      if (changed) {
        setRunningTimers(updated);
        StorageService.saveRunningTimers(updated);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [runningTimers]);

  const stopAudioPreview = () => {
    if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
    }
    setIsPlayingPreview(false);
  };

  const toggleAudioPreview = () => {
    if (isPlayingPreview) {
        stopAudioPreview();
    } else {
        const audio = new Audio(selectedRingtone);
        audio.volume = volume;
        audio.onended = () => setIsPlayingPreview(false);
        previewAudioRef.current = audio;
        audio.play().catch(e => console.log(e));
        setIsPlayingPreview(true);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
          const b64 = ev.target?.result as string;
          setSelectedRingtone(b64);
          setCustomRingtoneName(file.name);
          stopAudioPreview();
      };
      reader.readAsDataURL(file);
    }
  };

  const startNewTimer = (hours: number, mins: number, secs: number, customLabel?: string) => {
    const total = hours * 3600 + mins * 60 + secs;
    if (total === 0) return;

    const newTimer: RunningTimer = {
      id: Date.now().toString() + Math.random(),
      label: customLabel || label || t.timer,
      totalSeconds: total,
      remainingSeconds: total,
      endTime: Date.now() + total * 1000,
      status: 'running',
      volume,
      ringtone: selectedRingtone,
      isRinging: false
    };

    const updated = [newTimer, ...runningTimers];
    setRunningTimers(updated);
    StorageService.saveRunningTimers(updated);
    setShowPicker(false);
    setH(0); setM(0); setS(0); setLabel('');
    stopAudioPreview();
  };

  const toggleTimer = (id: string) => {
    const updated = runningTimers.map(t => {
      if (t.id === id) {
        if (t.status === 'running') return { ...t, status: 'paused' as const };
        if (t.status === 'paused') return { ...t, status: 'running' as const, endTime: Date.now() + t.remainingSeconds * 1000 };
      }
      return t;
    });
    setRunningTimers(updated);
    StorageService.saveRunningTimers(updated);
  };

  const resetTimer = (id: string) => {
    const updated = runningTimers.map(t => {
      if (t.id === id) {
        return { ...t, remainingSeconds: t.totalSeconds, endTime: Date.now() + t.totalSeconds * 1000, status: 'running' as const, isRinging: false };
      }
      return t;
    });
    setRunningTimers(updated);
    StorageService.saveRunningTimers(updated);
  };

  const removeTimer = (id: string) => {
    const updated = runningTimers.filter(t => t.id !== id);
    setRunningTimers(updated);
    StorageService.saveRunningTimers(updated);
    if (updated.length === 0) setShowPicker(true);
  };

  const saveToPresets = () => {
    if (h === 0 && m === 0 && s === 0) return;
    const newPreset: TimerPreset = {
      id: Date.now().toString(),
      label: label || `Timer ${h}:${m}:${s}`,
      hours: h,
      minutes: m,
      seconds: s,
      ringtone: selectedRingtone,
      volume
    };
    const updated = [newPreset, ...presets];
    setPresets(updated);
    StorageService.saveTimerPresets(updated);
    setLabel('');
    stopAudioPreview();
  };

  const deletePreset = (id: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    StorageService.saveTimerPresets(updated);
  };

  const formatDisplay = (total: number) => {
    const hh = Math.floor(total / 3600);
    const mm = Math.floor((total % 3600) / 60);
    const ss = total % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 md:space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <h3 className="text-xl md:text-2xl font-bold text-stone-800 font-serif">{t.timer}</h3>
        <button 
          onClick={() => setShowPicker(!showPicker)} 
          className={`p-1.5 md:p-2 rounded-full transition-all ${showPicker ? 'bg-amber-600 text-white shadow-lg' : 'bg-white text-stone-400 border border-stone-100'}`}
        >
          {showPicker ? <X size={20} className="md:w-6 md:h-6" /> : <Plus size={20} className="md:w-6 md:h-6" />}
        </button>
      </div>

      {showPicker && (
        <div className="bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-stone-100 space-y-4 md:space-y-6 animate-in slide-in-from-top duration-300">
           <div className="flex justify-center gap-3 md:gap-4">
              <Picker unit="h" value={h} onChange={setH} max={23}/>
              <Picker unit="m" value={m} onChange={setM} max={59}/>
              <Picker unit="s" value={s} onChange={setS} max={59}/>
           </div>
           
           <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-2">{t.timerName}</span>
                <input 
                  type="text" 
                  value={label} 
                  onChange={e => setLabel(e.target.value)}
                  placeholder={t.timerPlaceholder}
                  className="w-full bg-stone-50 p-3 md:p-4 rounded-xl md:rounded-2xl outline-none text-stone-800 font-medium border border-transparent focus:border-amber-200 transition-colors text-sm md:text-base"
                />
              </div>

              <div className="bg-stone-50 p-3 md:p-4 rounded-xl md:rounded-2xl space-y-3 md:space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] md:text-xs font-bold text-stone-400 uppercase">{t.sound}</span>
                    <select 
                        value={SYSTEM_RINGTONES.some(rt => rt.url === selectedRingtone) ? selectedRingtone : 'custom'} 
                        onChange={e => {
                            const val = e.target.value;
                            if (val !== 'custom') {
                              setSelectedRingtone(val);
                              setCustomRingtoneName(SYSTEM_RINGTONES.find(rt => rt.url === val)?.name || '');
                            }
                            stopAudioPreview();
                        }}
                        className="text-[10px] md:text-xs font-bold text-stone-600 bg-transparent outline-none cursor-pointer"
                    >
                        {SYSTEM_RINGTONES.map(rt => (
                            <option key={rt.url} value={rt.url}>{rt.name}</option>
                        ))}
                        <option value="custom" disabled={SYSTEM_RINGTONES.some(rt => rt.url === selectedRingtone)}>{t.yourMusic}</option>
                    </select>
                 </div>
                 <div className="flex items-center gap-2 md:gap-4">
                    <div className="flex items-center gap-1.5 md:gap-2 mr-auto overflow-hidden">
                      <button 
                          onClick={toggleAudioPreview} 
                          className={`p-1.5 md:p-2 rounded-full shadow-sm transition-colors ${isPlayingPreview ? 'bg-rose-100 text-rose-600' : 'bg-white text-amber-600'}`}
                      >
                          {isPlayingPreview ? <Square size={14} className="md:w-4 md:h-4" fill="currentColor"/> : <Play size={14} className="md:w-4 md:h-4" fill="currentColor"/>}
                      </button>
                      <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1.5 md:p-2 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
                          title={t.upload}
                      >
                          <Upload size={14} className="md:w-4 md:h-4" />
                      </button>
                      <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
                      {customRingtoneName && (
                        <span className="text-[8px] md:text-[10px] text-stone-400 truncate max-w-[80px] md:max-w-[100px]">{customRingtoneName}</span>
                      )}
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.1" value={volume} 
                      onChange={e => { setVolume(parseFloat(e.target.value)); if (previewAudioRef.current) previewAudioRef.current.volume = parseFloat(e.target.value); }} 
                      className="flex-1 accent-amber-600 h-1 md:h-1.5 rounded-lg bg-stone-200 appearance-none cursor-pointer"
                    />
                    <Volume2 size={14} className="text-stone-300 md:w-4 md:h-4"/>
                 </div>
              </div>
           </div>

           <div className="flex gap-3 md:gap-4">
              <button onClick={() => startNewTimer(h, m, s)} className="flex-1 py-4 md:py-5 bg-amber-600 text-white rounded-[1.5rem] md:rounded-3xl font-bold text-lg md:text-xl shadow-xl shadow-amber-600/20 active:scale-95 transition-transform">{t.start}</button>
              <button onClick={saveToPresets} className="w-16 md:w-20 py-4 md:py-5 bg-stone-100 text-stone-600 rounded-[1.5rem] md:rounded-3xl flex items-center justify-center active:scale-95 transition-transform"><Save size={20} className="md:w-6 md:h-6"/></button>
           </div>
        </div>
      )}

      {/* Active Timers List */}
      <div className="space-y-4">
        {runningTimers.map(timer => (
          <div key={timer.id} className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-stone-100 flex items-center justify-between group animate-in slide-in-from-bottom">
            <div className="flex-1 min-w-0">
              <h4 className="text-[8px] md:text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1 truncate">{timer.label}</h4>
              <span className={`text-3xl md:text-5xl font-light tracking-tighter tabular-nums ${timer.status === 'completed' ? 'text-rose-500 animate-pulse' : 'text-stone-800'}`}>
                 {formatDisplay(timer.remainingSeconds)}
              </span>
            </div>
            <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-2">
              <button onClick={() => resetTimer(timer.id)} className="w-10 h-10 md:w-14 md:h-14 bg-stone-50 text-stone-400 hover:text-amber-600 rounded-full flex items-center justify-center transition-all active:scale-90" title={t.reset}>
                <RotateCcw size={18} className="md:w-6 md:h-6" />
              </button>
              {timer.status !== 'completed' && (
                <button onClick={() => toggleTimer(timer.id)} className="w-10 h-10 md:w-14 md:h-14 bg-stone-50 text-stone-600 rounded-full flex items-center justify-center transition-all active:scale-90">
                  {timer.status === 'running' ? <Pause size={18} className="md:w-6 md:h-6" /> : <Play size={18} className="ml-1 md:w-6 md:h-6" />}
                </button>
              )}
              <button onClick={() => removeTimer(timer.id)} className="w-10 h-10 md:w-14 md:h-14 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center transition-colors hover:bg-rose-500 hover:text-white active:scale-90">
                <X size={18} className="md:w-6 md:h-6" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Presets Grid */}
      <div className="space-y-3 md:space-y-4 pt-4 border-t border-stone-100">
        <p className="text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2">{t.timerPresets}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
           {presets.map(p => (
              <div key={p.id} className="relative group">
                 <button 
                  onClick={() => startNewTimer(p.hours, p.minutes, p.seconds, p.label)}
                  className="w-full bg-white p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border border-stone-100 flex justify-between items-center hover:border-amber-200 transition-all text-left shadow-sm active:scale-95"
                 >
                    <div className="min-w-0">
                        <h4 className="font-bold text-stone-800 text-xs md:text-sm truncate">{p.label}</h4>
                        <p className="text-[9px] md:text-[10px] font-bold text-stone-300 tracking-tighter tabular-nums">
                           {p.hours > 0 ? `${p.hours}h ` : ''}{p.minutes}m {p.seconds}s
                        </p>
                    </div>
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-stone-50 rounded-full flex items-center justify-center text-stone-300 group-hover:bg-amber-600 group-hover:text-white transition-all shrink-0">
                        <Play size={14} fill="currentColor" className="ml-0.5 md:w-4 md:h-4" />
                    </div>
                 </button>
                 <button 
                  onClick={() => deletePreset(p.id)}
                  className="absolute -top-1 -right-1 bg-white text-stone-400 rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-stone-100"
                 >
                    <Trash2 size={12}/>
                 </button>
              </div>
           ))}
        </div>
      </div>
    </div>
  );
};

const WorldClockTab = ({ t }: { t: any }) => {
  const [cities, setCities] = useState<WorldClockCity[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setCities(StorageService.getWorldCities());
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const addCity = (name: string, timezone: string) => {
    const newCity: WorldClockCity = {
      id: Date.now().toString(),
      name,
      timezone,
      displayMode: 'digital'
    };
    const updated = [...cities, newCity];
    setCities(updated);
    StorageService.saveWorldCities(updated);
    setShowAdd(false);
  };

  const removeCity = (id: string) => {
    const updated = cities.filter(c => c.id !== id);
    setCities(updated);
    StorageService.saveWorldCities(updated);
  };

  const getTimeInTimezone = (timezone: string) => {
    return new Intl.DateTimeFormat(undefined, {
      timeStyle: 'medium',
      timeZone: timezone,
      hour12: false
    }).format(currentTime);
  };

  const getDateInTimezone = (timezone: string) => {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'full',
      timeZone: timezone
    }).format(currentTime);
  };

  const allTimezones = useMemo(() => {
    try {
      // @ts-ignore
      return Intl.supportedValuesOf('timeZone').map(tz => ({
        name: tz.split('/').pop()?.replace(/_/g, ' ') || tz,
        timezone: tz
      }));
    } catch {
      return [
        { name: 'London', timezone: 'Europe/London' },
        { name: 'New York', timezone: 'America/New_York' },
        { name: 'Tokyo', timezone: 'Asia/Tokyo' },
        { name: 'Ho Chi Minh', timezone: 'Asia/Ho_Chi_Minh' }
      ];
    }
  }, []);

  const filteredTimezones = allTimezones.filter(tz => 
    tz.name.toLowerCase().includes(search.toLowerCase()) || 
    tz.timezone.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 10);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-stone-800 font-serif">{t.worldClock}</h3>
        <button 
          onClick={() => setShowAdd(!showAdd)} 
          className={`p-1.5 md:p-2 rounded-full transition-all ${showAdd ? 'bg-amber-600 text-white shadow-lg' : 'bg-white text-stone-400 border border-stone-100'}`}
        >
          {showAdd ? <X size={20} className="md:w-6 md:h-6" /> : <Plus size={20} className="md:w-6 md:h-6" />}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-stone-100 space-y-4 animate-in slide-in-from-top duration-300">
           <div className="relative">
              <Search className="absolute left-3 top-3 text-stone-300" size={20}/>
              <input 
                autoFocus
                type="text" 
                placeholder={t.searchCity} 
                className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-2xl outline-none border border-transparent focus:border-amber-200"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
           </div>
           <div className="max-h-60 overflow-y-auto space-y-2 no-scrollbar">
              {filteredTimezones.map(tz => (
                <button 
                  key={tz.timezone}
                  onClick={() => addCity(tz.name, tz.timezone)}
                  className="w-full text-left p-3 hover:bg-amber-50 rounded-xl transition-colors flex justify-between items-center"
                >
                  <span className="font-medium text-stone-700">{tz.name}</span>
                  <span className="text-[10px] text-stone-400 uppercase">{tz.timezone}</span>
                </button>
              ))}
           </div>
        </div>
      )}

      <div className="space-y-3">
        {cities.map(city => (
          <div key={city.id} className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-stone-100 flex justify-between items-center group">
             <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                   <h4 className="text-lg md:text-xl font-bold text-stone-800 truncate">{city.name}</h4>
                </div>
                <p className="text-[9px] md:text-[10px] text-stone-400 font-medium uppercase tracking-wider truncate">{getDateInTimezone(city.timezone)}</p>
             </div>
             <div className="flex items-center gap-3 md:gap-6 shrink-0 ml-2">
                <span className="text-2xl md:text-3xl font-light tracking-tighter tabular-nums text-stone-800">
                   {getTimeInTimezone(city.timezone)}
                </span>
                <button 
                  onClick={() => removeCity(city.id)}
                  className="opacity-100 md:opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-500 transition-all p-2"
                >
                   <Trash2 size={18} className="md:w-5 md:h-5"/>
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StopwatchTab = ({ t }: { t: any }) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<StopwatchLap[]>([]);
  const [history, setHistory] = useState<StopwatchSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    setHistory(StorageService.getStopwatchHistory());
    return () => clearInterval(timerRef.current);
  }, []);

  const start = () => {
    if (!isRunning) {
      setIsRunning(true);
      startTimeRef.current = Date.now() - time;
      timerRef.current = setInterval(() => {
        setTime(Date.now() - startTimeRef.current);
      }, 10);
    }
  };

  const stop = () => {
    setIsRunning(false);
    clearInterval(timerRef.current);
  };

  const reset = () => {
    stop();
    setTime(0);
    setLaps([]);
  };

  const lap = () => {
    const lapTime = laps.length === 0 ? time : time - laps[0].totalTime;
    setLaps([{ lapTime, totalTime: time }, ...laps]);
  };

  const saveSession = () => {
    if (time === 0) return;
    const session: StopwatchSession = {
      id: Date.now().toString(),
      date: Date.now(),
      totalTime: time,
      laps: [...laps]
    };
    const updated = [session, ...history];
    setHistory(updated);
    StorageService.saveStopwatchHistory(updated);
    reset();
  };

  const deleteHistorySession = (id: string) => {
    const updated = history.filter(s => s.id !== id);
    setHistory(updated);
    StorageService.saveStopwatchHistory(updated);
  };

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
  };

  if (showHistory) {
     return (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-stone-100 rounded-full text-stone-500">
                    <ChevronLeft size={24} />
                </button>
                <h3 className="text-xl md:text-2xl font-bold text-stone-800 font-serif">{t.stopwatchHistory}</h3>
            </div>
            <div className="space-y-4">
                {history.length === 0 ? (
                    <div className="text-center py-20 text-stone-400 opacity-50">
                        <History size={48} className="mx-auto mb-2" />
                        <p>{t.noHistory}</p>
                    </div>
                ) : (
                    history.map(session => (
                        <div key={session.id} className="bg-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-stone-100 group relative">
                            <div className="flex justify-between items-center mb-2">
                               <span className="text-[10px] md:text-xs font-bold text-stone-400 uppercase">{new Date(session.date).toLocaleString()}</span>
                               <span className="font-mono font-bold text-amber-700 text-sm md:text-base">{formatTime(session.totalTime)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="text-[9px] md:text-[10px] text-stone-400">{session.laps.length} {t.laps}</div>
                                <button 
                                    onClick={() => deleteHistorySession(session.id)}
                                    className="text-stone-300 hover:text-rose-500 transition-colors p-2"
                                    title={t.delete}
                                >
                                    <Trash2 size={16} className="md:w-5 md:h-5"/>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
     );
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center space-y-6 md:space-y-8 pb-12">
      <div className="w-full flex justify-between items-center">
        <h3 className="text-xl md:text-2xl font-bold text-stone-800 font-serif">{t.stopwatch}</h3>
        <button onClick={() => setShowHistory(true)} className="p-2 text-stone-400 hover:text-amber-600 transition-colors">
            <History size={22} className="md:w-6 md:h-6" />
        </button>
      </div>

      <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center rounded-full border-4 md:border-8 border-stone-100 shadow-inner bg-white">
          <div className="text-4xl md:text-5xl font-light tracking-tighter tabular-nums text-stone-800">
              {formatTime(time)}
          </div>
      </div>

      <div className="w-full flex gap-3 md:gap-4">
          {!isRunning ? (
            <button 
                onClick={start} 
                className="flex-1 py-4 md:py-5 bg-amber-600 text-white rounded-2xl md:rounded-3xl font-bold text-lg md:text-xl shadow-xl shadow-amber-600/20 active:scale-95 transition-transform"
            >
                {time === 0 ? t.start : t.resume}
            </button>
          ) : (
            <button 
                onClick={stop} 
                className="flex-1 py-4 md:py-5 bg-stone-800 text-white rounded-2xl md:rounded-3xl font-bold text-lg md:text-xl shadow-xl active:scale-95 transition-transform"
            >
                {t.stop}
            </button>
          )}

          {isRunning ? (
            <button 
                onClick={lap} 
                className="w-16 md:w-20 py-4 md:py-5 bg-stone-100 text-stone-600 rounded-2xl md:rounded-3xl flex items-center justify-center active:scale-95 transition-transform"
            >
                {t.lap}
            </button>
          ) : (
            <button 
                onClick={time === 0 ? undefined : reset} 
                disabled={time === 0}
                className="w-16 md:w-20 py-4 md:py-5 bg-stone-100 text-stone-600 rounded-2xl md:rounded-3xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
            >
                {t.reset}
            </button>
          )}
          
          {!isRunning && time > 0 && (
             <button 
                onClick={saveSession} 
                className="w-16 md:w-20 py-4 md:py-5 bg-amber-50 text-amber-700 rounded-2xl md:rounded-3xl flex items-center justify-center active:scale-95 transition-transform shadow-sm"
             >
                <Save size={20} className="md:w-6 md:h-6"/>
             </button>
          )}
      </div>

      <div className="w-full space-y-1.5 md:space-y-2 mt-4 max-h-48 md:max-h-60 overflow-y-auto no-scrollbar">
          {laps.map((l, i) => (
            <div key={i} className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-stone-100 flex justify-between items-center animate-in slide-in-from-top duration-200">
               <div className="flex items-center gap-2 md:gap-3">
                  <span className="text-[8px] md:text-[10px] font-bold text-stone-300 w-5 md:w-6">{(laps.length - i).toString().padStart(2, '0')}</span>
                  <span className="font-mono text-stone-600 text-xs md:text-sm">{formatTime(l.lapTime)}</span>
               </div>
               <span className="font-mono text-[10px] md:text-xs text-stone-400">{formatTime(l.totalTime)}</span>
            </div>
          ))}
      </div>
    </div>
  );
};
