
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  getYear, setYear, setMonth, isToday, setDate, isSameDay,
  addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth,
  addDays, subDays, parseISO, isWithinInterval, isValid
} from 'date-fns';
import { Solar, Lunar } from 'lunar-javascript';
import { 
  Calendar as CalendarIcon, Bell, Lock, Unlock, Play, ChevronLeft, 
  ChevronRight, Plus, MapPin, AlignLeft, CalendarRange, Clock, 
  Search, Filter, MoreVertical, Trash2, X, Check, Globe, CalendarDays, Volume2, Square, Music, Upload, ArrowLeft, RefreshCw, UserPlus, Users, Smartphone, Cloud, Loader2
} from 'lucide-react';
import { CalendarEvent, Language, CalendarViewMode, AccountType, RecurrenceType, Contact } from '../types';
import { StorageService } from '../services/storage';
import { TRANSLATIONS } from '../constants';

interface CalendarNotesProps {
  language: Language;
  accentColor: string;
  onBack: () => void;
}

const EVENT_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#78716c'
];

const EVENT_RINGTONES = [
  { name: 'Crystal Clear', url: 'https://assets.mixkit.co/active_storage/sfx/1000/1000-preview.mp3' },
  { name: 'Piano Bloom', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
  { name: 'Soft Pulse', url: 'https://assets.mixkit.co/active_storage/sfx/999/999-preview.mp3' },
  { name: 'Digital Alert', url: 'https://assets.mixkit.co/active_storage/sfx/1001/1001-preview.mp3' },
  { name: 'Nature Breeze', url: 'https://assets.mixkit.co/active_storage/sfx/1002/1002-preview.mp3' },
  { name: 'Celestial Chime', url: 'https://assets.mixkit.co/active_storage/sfx/1003/1003-preview.mp3' },
  { name: 'Gentle Wake', url: 'https://assets.mixkit.co/active_storage/sfx/1004/1004-preview.mp3' },
];

export const CalendarNotes: React.FC<CalendarNotesProps> = ({ language, accentColor, onBack }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<AccountType | 'all'>('all');
  const [showLunar, setShowLunar] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const t = TRANSLATIONS[language];

  useEffect(() => {
    setEvents(StorageService.getCalendarEvents());
  }, []);

  const saveEvents = (newEvents: CalendarEvent[]) => {
    setEvents(newEvents);
    StorageService.saveCalendarEvents(newEvents);
  };

  const handleCreateEvent = (date?: Date) => {
    const start = date || new Date();
    start.setHours(new Date().getHours() + 1, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: '',
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      isAllDay: false,
      color: EVENT_COLORS[0],
      account: 'local',
      recurrence: 'none',
      reminders: [{ id: '1', minutesBefore: 15 }],
      participants: [],
      ringtone: EVENT_RINGTONES[0].url,
      volume: 0.7,
      updatedAt: Date.now()
    };
    setEditingEvent(newEvent);
  };

  const handleDeleteEvent = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    saveEvents(updated);
    setEditingEvent(null);
  };

  const handleSync = async (accountType: AccountType) => {
    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockContacts: Contact[] = ([
      { id: 'c1', name: 'John Doe', email: 'john@example.com', account: 'google' as AccountType },
      { id: 'c2', name: 'Jane Smith', email: 'jane@example.com', account: 'google' as AccountType },
      { id: 'c3', name: 'Minh Anh', phone: '0987654321', account: 'samsung' as AccountType },
      { id: 'c4', name: 'Trần Văn B', phone: '0123456789', account: 'local' as AccountType },
    ] as Contact[]).filter(c => c.account === accountType || accountType === 'local');

    const existingContacts = StorageService.getContacts();
    const newContacts = [...existingContacts];
    mockContacts.forEach(mc => {
        if (!newContacts.some(nc => nc.id === mc.id)) newContacts.push(mc);
    });
    StorageService.saveContacts(newContacts);
    
    setIsSyncing(false);
    setShowSyncModal(false);
    alert(t.syncSuccess);
  };

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchAccount = selectedAccount === 'all' || e.account === selectedAccount;
      return matchSearch && matchAccount;
    });
  }, [events, searchQuery, selectedAccount]);

  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter(event => {
      const start = parseISO(event.startDate);
      const end = parseISO(event.endDate);
      
      if (!isValid(start) || !isValid(end)) return false;
      if (isSameDay(start, day)) return true;
      if (isWithinInterval(day, { start, end })) return true;

      if (event.recurrence === 'daily') return day >= start;
      if (event.recurrence === 'weekly') return day >= start && day.getDay() === start.getDay();
      if (event.recurrence === 'monthly') return day >= start && day.getDate() === start.getDate();
      if (event.recurrence === 'yearly') return day >= start && day.getDate() === start.getDate() && day.getMonth() === start.getMonth();

      return false;
    });
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) {
      setCurrentDate(setYear(currentDate, val));
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50/50 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border border-stone-200 shadow-sm animate-in fade-in duration-500">
      <div className="bg-white px-4 md:px-8 pt-4 md:pt-8 pb-3 md:pb-4 flex flex-col gap-3 md:gap-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
            <button onClick={onBack} className="p-1.5 md:p-2 hover:bg-stone-100 rounded-full text-stone-500 shrink-0" title={t.back}>
               <ArrowLeft size={20} className="md:w-6 md:h-6" />
            </button>
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="text-xl md:text-4xl font-serif font-bold text-stone-800 tracking-tight hover:text-amber-800 transition-colors flex items-center gap-1.5 truncate"
            >
              {format(currentDate, 'MMM yyyy')}
              <ChevronLeft className={`transition-transform duration-300 shrink-0 ${showDatePicker ? '-rotate-90' : 'rotate-0'}`} size={16} />
            </button>
            <div className="flex bg-stone-100 p-0.5 md:p-1 rounded-xl md:rounded-2xl shrink-0">
              <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 md:p-2 hover:bg-white rounded-lg md:rounded-xl transition-all"><ChevronLeft size={14} className="md:w-5 md:h-5"/></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-2 md:px-4 text-[9px] md:text-xs font-bold text-stone-600 uppercase shrink-0">{t.today}</button>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 md:p-2 hover:bg-white rounded-lg md:rounded-xl transition-all"><ChevronRight size={14} className="md:w-5 md:h-5"/></button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <button 
              onClick={() => setShowSyncModal(true)}
              className="w-8 h-8 md:w-10 md:h-10 bg-white border border-stone-100 text-stone-400 rounded-full flex items-center justify-center hover:text-amber-800 hover:border-amber-200 transition-all shadow-sm"
              title={t.sync}
            >
              <RefreshCw size={18} className={`${isSyncing ? 'animate-spin text-amber-600' : ''}`} />
            </button>
            <button 
              onClick={() => handleCreateEvent()}
              className="bg-amber-800 text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <Plus size={20} className="md:w-6 md:h-6"/>
            </button>
          </div>
        </div>

        {showDatePicker && (
          <div className="p-4 md:p-6 bg-stone-50 rounded-2xl md:rounded-[2rem] border border-stone-100 flex flex-col gap-4 md:gap-6 animate-in slide-in-from-top duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              <div className="space-y-1 md:space-y-2">
                <span className="text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1 md:pl-2">{t.month}</span>
                <div className="grid grid-cols-4 gap-1 md:gap-2">
                  {Array.from({ length: 12 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => { setCurrentDate(setMonth(currentDate, i)); setShowDatePicker(false); }}
                      className={`py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all ${currentDate.getMonth() === i ? 'bg-amber-800 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:border-amber-400'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1 md:space-y-2">
                <span className="text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1 md:pl-2">Year</span>
                <div className="flex items-center gap-2 md:gap-4 justify-between bg-white p-1.5 md:p-2 rounded-xl md:rounded-2xl border border-stone-100">
                  <button onClick={() => setCurrentDate(setYear(currentDate, getYear(currentDate) - 1))} className="p-1.5 md:p-2 hover:bg-stone-100 rounded-lg md:rounded-xl"><ChevronLeft size={16} className="md:w-5 md:h-5"/></button>
                  <input 
                    type="number"
                    value={getYear(currentDate)}
                    onChange={handleYearChange}
                    className="w-16 md:w-24 text-center text-lg md:text-xl font-bold text-stone-800 font-serif bg-transparent outline-none border-b border-stone-200 focus:border-amber-600 transition-colors"
                  />
                  <button onClick={() => setCurrentDate(setYear(currentDate, getYear(currentDate) + 1))} className="p-1.5 md:p-2 hover:bg-stone-100 rounded-lg md:rounded-xl"><ChevronRight size={16} className="md:w-5 md:h-5"/></button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 md:gap-4 border-b border-stone-100 pb-1.5 md:pb-2 overflow-x-auto no-scrollbar">
          {['month', 'week', 'day', 'schedule'].map((mode) => (
            <button 
              key={mode}
              onClick={() => setViewMode(mode as CalendarViewMode)}
              className={`pb-1.5 md:pb-2 px-0.5 md:px-1 text-[10px] md:text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap ${viewMode === mode ? 'text-amber-800 border-b-2 border-amber-800' : 'text-stone-400'}`}
            >
              {t[mode] || mode}
            </button>
          ))}
          <div className="ml-auto flex gap-3 md:gap-4 items-center shrink-0">
             <button onClick={() => setShowLunar(!showLunar)} className={`text-[9px] md:text-xs font-bold uppercase tracking-tighter whitespace-nowrap ${showLunar ? 'text-amber-700' : 'text-stone-300'}`}>{t.lunar}</button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-2 md:p-8">
        {viewMode === 'month' && <MonthView currentDate={currentDate} getEventsForDay={getEventsForDay} showLunar={showLunar} onDayClick={handleCreateEvent} onEventClick={setEditingEvent} />}
        {viewMode === 'week' && <WeekView currentDate={currentDate} getEventsForDay={getEventsForDay} onEventClick={setEditingEvent} />}
        {viewMode === 'day' && <DayView currentDate={currentDate} getEventsForDay={getEventsForDay} onEventClick={setEditingEvent} />}
        {viewMode === 'schedule' && <ScheduleView events={filteredEvents} onEventClick={setEditingEvent} />}
      </div>

      {editingEvent && (
        <EventModal 
          event={editingEvent} 
          t={t} 
          onSave={(updated: CalendarEvent) => {
            const index = events.findIndex(e => e.id === updated.id);
            const newEvents = index >= 0 ? events.map(e => e.id === updated.id ? updated : e) : [updated, ...events];
            saveEvents(newEvents);
            setEditingEvent(null);
          }}
          onDelete={handleDeleteEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}

      {showSyncModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-stone-100 animate-in zoom-in-95">
             <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-4">
               {isSyncing ? <Loader2 size={32} className="animate-spin" /> : <RefreshCw size={32}/>}
             </div>
             <h4 className="text-xl font-bold text-stone-800 mb-2 text-center">{isSyncing ? t.syncing : t.syncAccounts}</h4>
             <p className="text-sm text-stone-500 mb-8 text-center">Đồng bộ hóa sự kiện và danh bạ từ các tài khoản của bạn.</p>
             
             <div className="space-y-3">
                <button 
                  disabled={isSyncing}
                  onClick={() => handleSync('google')}
                  className="w-full flex items-center justify-between p-4 bg-stone-50 hover:bg-stone-100 rounded-2xl border border-stone-100 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <Cloud className="text-blue-500" size={20}/>
                    <span className="font-bold text-stone-700">Google Calendar</span>
                  </div>
                  <ChevronRight size={16} className="text-stone-300"/>
                </button>
                <button 
                  disabled={isSyncing}
                  onClick={() => handleSync('samsung')}
                  className="w-full flex items-center justify-between p-4 bg-stone-50 hover:bg-stone-100 rounded-2xl border border-stone-100 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="text-indigo-500" size={20}/>
                    <span className="font-bold text-stone-700">Samsung Account</span>
                  </div>
                  <ChevronRight size={16} className="text-stone-300"/>
                </button>
             </div>
             
             <button 
              disabled={isSyncing}
              onClick={() => setShowSyncModal(false)} 
              className="w-full mt-6 py-3 text-stone-400 font-bold transition-all active:scale-95"
             >
                {t.cancel}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

const MonthView = ({ currentDate, getEventsForDay, showLunar, onDayClick, onEventClick }: any) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="h-full grid grid-cols-7 grid-rows-6 gap-1 md:gap-2">
      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
        <div key={day} className="text-center text-[9px] md:text-[10px] font-bold text-stone-400 py-1 md:py-2">{day}</div>
      ))}
      {calendarDays.map(day => {
        const events = getEventsForDay(day);
        const solar = Solar.fromYmd(day.getFullYear(), day.getMonth() + 1, day.getDate());
        const lunar = solar.getLunar();
        const isSelectedMonth = isSameMonth(day, monthStart);

        return (
          <div 
            key={day.toString()} 
            className={`bg-white rounded-lg md:rounded-[1.5rem] p-1 md:p-2 border border-stone-100 flex flex-col gap-0.5 md:gap-1 transition-all hover:border-amber-200 cursor-pointer overflow-hidden ${!isSelectedMonth ? 'opacity-30' : ''}`}
            onClick={() => onDayClick(day)}
          >
            <div className="flex justify-between items-start shrink-0">
               <span className={`text-[10px] md:text-sm font-bold w-4 h-4 md:w-6 md:h-6 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-amber-800 text-white' : 'text-stone-700'}`}>
                 {format(day, 'd')}
               </span>
               {showLunar && <span className="text-[8px] md:text-[10px] text-stone-300 font-serif leading-none">{lunar.getDay()}</span>}
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-0.5 min-h-0">
              {events.map((e: CalendarEvent) => (
                <div 
                  key={e.id}
                  onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
                  className="px-1 md:px-2 py-0.5 rounded md:rounded-lg text-[7px] md:text-[10px] text-white font-medium truncate leading-tight"
                  style={{ backgroundColor: e.color }}
                >
                  {e.title || '.'}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const WeekView = ({ currentDate, getEventsForDay, onEventClick }: any) => {
  const start = startOfWeek(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl md:rounded-[2.5rem] border border-stone-100 p-3 md:p-6 overflow-hidden shadow-sm">
      <div className="grid grid-cols-8 border-b border-stone-100 pb-2 md:pb-4">
        <div className="col-span-1"></div>
        {days.map(day => (
          <div key={day.toString()} className="text-center flex flex-col items-center">
            <span className="text-[8px] md:text-[10px] font-bold text-stone-400 uppercase">{format(day, 'eee')}</span>
            <span className={`text-sm md:text-xl font-bold ${isToday(day) ? 'text-amber-800' : 'text-stone-800'}`}>{format(day, 'd')}</span>
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar pt-2 md:pt-4">
        {Array.from({ length: 24 }).map((_, hour) => (
          <div key={hour} className="grid grid-cols-8 min-h-[40px] md:min-h-[60px] border-b border-stone-50/50">
            <div className="col-span-1 text-[8px] md:text-[10px] text-stone-300 font-bold py-1 md:py-2">{hour}:00</div>
            {days.map(day => {
                const events = getEventsForDay(day).filter((e: CalendarEvent) => {
                    const eventDate = parseISO(e.startDate);
                    return isValid(eventDate) && eventDate.getHours() === hour;
                });
                return (
                    <div key={day.toString()} className="border-l border-stone-50/50 p-0.5 md:p-1 relative">
                        {events.map((e: CalendarEvent) => (
                            <div 
                                key={e.id} 
                                onClick={() => onEventClick(e)}
                                className="p-1 md:p-2 rounded-lg md:rounded-xl text-[7px] md:text-[10px] text-white font-bold h-full shadow-sm truncate"
                                style={{ backgroundColor: e.color }}
                            >
                                {e.title}
                            </div>
                        ))}
                    </div>
                );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

const DayView = ({ currentDate, getEventsForDay, onEventClick }: any) => {
    const events = getEventsForDay(currentDate);
    return (
        <div className="h-full max-w-2xl mx-auto space-y-4 md:space-y-6 overflow-y-auto no-scrollbar">
            <div className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-stone-100 flex items-center justify-between">
                <div className="overflow-hidden">
                    <h3 className="text-[10px] md:text-sm font-bold text-amber-800 uppercase tracking-widest">{format(currentDate, 'EEEE')}</h3>
                    <h1 className="text-2xl md:text-5xl font-light text-stone-800 truncate">{format(currentDate, 'd MMMM yyyy')}</h1>
                </div>
                <div className="bg-stone-50 w-16 h-16 md:w-24 md:h-24 rounded-full flex flex-col items-center justify-center border border-stone-100 shrink-0">
                    <span className="text-stone-300 text-[8px] md:text-xs font-bold uppercase">Events</span>
                    <span className="text-xl md:text-4xl font-serif font-bold text-stone-800">{events.length}</span>
                </div>
            </div>
            <div className="space-y-3 md:space-y-4">
                {events.map((e: CalendarEvent) => (
                    <div 
                        key={e.id}
                        onClick={() => onEventClick(e)}
                        className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-stone-100 flex gap-4 md:gap-6 hover:shadow-md transition-all cursor-pointer group"
                    >
                        <div className="w-1 md:w-1.5 rounded-full shrink-0" style={{ backgroundColor: e.color }}></div>
                        <div className="flex-1 min-w-0">
                            <span className="text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-wider">{e.isAllDay ? 'All Day' : format(parseISO(e.startDate), 'HH:mm')}</span>
                            <h4 className="text-base md:text-xl font-bold text-stone-800 truncate">{e.title || 'Untitled Event'}</h4>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ScheduleView = ({ events, onEventClick }: any) => {
    const sorted = [...events].sort((a,b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());
    return (
        <div className="h-full max-w-2xl mx-auto space-y-6 md:space-y-8 overflow-y-auto no-scrollbar pb-10">
            {sorted.length === 0 ? (
                <div className="text-center py-20 opacity-20"><CalendarRange size={60} className="mx-auto md:w-20 md:h-20"/><p className="mt-4 font-bold text-sm md:text-base">No upcoming events</p></div>
            ) : (
                sorted.map((e: CalendarEvent) => (
                    <div key={e.id} onClick={() => onEventClick(e)} className="flex items-start gap-4 md:gap-8 group cursor-pointer">
                        <div className="w-12 md:w-20 text-right shrink-0">
                            <div className="text-lg md:text-2xl font-bold text-stone-800">{format(parseISO(e.startDate), 'd')}</div>
                            <div className="text-[8px] md:text-[10px] font-bold text-stone-300 uppercase">{format(parseISO(e.startDate), 'MMM')}</div>
                        </div>
                        <div className="flex-1 bg-white p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-stone-100 group-hover:border-amber-200 transition-all shadow-sm min-w-0">
                            <h4 className="font-bold text-stone-800 text-sm md:text-lg truncate">{e.title || 'Untitled'}</h4>
                            <div className="mt-1 flex items-center gap-1.5 md:gap-2 text-[8px] md:text-[10px] font-bold text-stone-400 uppercase">
                                <Clock size={10} />
                                {format(parseISO(e.startDate), 'HH:mm')} - {format(parseISO(e.endDate), 'HH:mm')}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

const EventModal = ({ event, t, onSave, onDelete, onClose }: any) => {
  const [data, setData] = useState<CalendarEvent>(event);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const allContacts = StorageService.getContacts();

  const togglePreview = () => {
    if (isPlayingPreview) {
      audioRef.current?.pause();
      setIsPlayingPreview(false);
    } else {
      const audio = new Audio(data.ringtone || EVENT_RINGTONES[0].url);
      audio.volume = data.volume || 0.7;
      audio.onended = () => setIsPlayingPreview(false);
      audioRef.current = audio;
      audio.play();
      setIsPlayingPreview(true);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
          setData({ ...data, ringtone: ev.target?.result as string });
          if (isPlayingPreview) togglePreview();
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleParticipant = (participant: string) => {
    const current = data.participants || [];
    const exists = current.includes(participant);
    const updated = exists ? current.filter(p => p !== participant) : [...current, participant];
    setData({ ...data, participants: updated });
  };

  const safeFormat = (iso: string, pattern: string) => {
      try {
          const d = new Date(iso);
          return isValid(d) ? format(d, pattern) : '---';
      } catch {
          return '---';
      }
  };

  const toLocalISO = (iso: string) => {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localTime = new Date(d.getTime() - tzOffset);
      return localTime.toISOString().slice(0, 16);
  };

  const fromLocalISO = (localStr: string) => {
      const d = new Date(localStr);
      return d.toISOString();
  };

  const handleDateChange = (field: 'startDate' | 'endDate', val: string) => {
      try {
          const utcISO = fromLocalISO(val);
          setData({ ...data, [field]: utcISO });
      } catch (e) {
          console.error("Invalid date input", e);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-2 md:p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-3xl md:rounded-[3rem] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom duration-500">
        <div className="p-5 md:p-8 pb-3 md:pb-4 flex justify-between items-center shrink-0">
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors"><X size={20} className="md:w-6 md:h-6"/></button>
          <div className="flex gap-2">
             {onDelete && <button onClick={() => onDelete(data.id)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-full transition-colors"><Trash2 size={20} className="md:w-6 md:h-6"/></button>}
             <button onClick={() => { if(audioRef.current) audioRef.current.pause(); onSave(data); }} className="bg-stone-800 text-white px-6 md:px-8 py-1.5 md:py-2 rounded-full text-sm md:text-base font-bold shadow-xl active:scale-95 transition-transform">{t.save}</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-8 pt-0 space-y-5 md:space-y-6 no-scrollbar pb-10">
          <input 
            autoFocus
            type="text" 
            placeholder={t.eventTitle} 
            className="text-2xl md:text-4xl font-light text-stone-800 bg-transparent border-none outline-none w-full placeholder:text-stone-200"
            value={data.title}
            onChange={e => setData({ ...data, title: e.target.value })}
          />

          <div className="space-y-4">
             <div className="bg-stone-50 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-stone-100 flex flex-col gap-4 md:gap-6">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3 md:gap-4">
                        <CalendarRange className="text-amber-800 shrink-0 md:w-6 md:h-6" size={20}/>
                        <div className="flex-1 flex flex-col min-w-0">
                            <span className="text-[9px] md:text-[10px] font-bold text-stone-400 uppercase mb-0.5 md:mb-1">{t.starts}</span>
                            <input 
                                type="datetime-local" 
                                value={toLocalISO(data.startDate)} 
                                onChange={e => handleDateChange('startDate', e.target.value)} 
                                className="bg-white px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-bold text-stone-700 outline-none border border-stone-200 focus:border-amber-500 transition-colors w-full" 
                            />
                        </div>
                    </div>
                    <p className="text-[9px] md:text-[10px] text-amber-600 font-bold ml-8 md:ml-10">{safeFormat(data.startDate, 'dd/MM/yyyy HH:mm')}</p>
                </div>
                
                <div className="flex flex-col gap-1 border-t border-stone-100 pt-4 md:pt-6">
                    <div className="flex items-center gap-3 md:gap-4">
                        <Clock className="text-stone-300 shrink-0 md:w-6 md:h-6" size={20}/>
                        <div className="flex-1 flex flex-col min-w-0">
                            <span className="text-[9px] md:text-[10px] font-bold text-stone-400 uppercase mb-0.5 md:mb-1">{t.ends}</span>
                            <input 
                                type="datetime-local" 
                                value={toLocalISO(data.endDate)} 
                                onChange={e => handleDateChange('endDate', e.target.value)} 
                                className="bg-white px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-bold text-stone-700 outline-none border border-stone-200 focus:border-amber-500 transition-colors w-full" 
                            />
                        </div>
                    </div>
                    <p className="text-[9px] md:text-[10px] text-amber-600 font-bold ml-8 md:ml-10">{safeFormat(data.endDate, 'dd/MM/yyyy HH:mm')}</p>
                </div>
             </div>

             <div className="flex items-center justify-between bg-stone-50 p-4 md:p-6 rounded-2xl md:rounded-[2rem]">
                <div className="flex items-center gap-3 md:gap-4">
                    <CalendarDays size={20} className="text-stone-300 md:w-6 md:h-6"/>
                    <span className="text-xs md:text-sm font-bold text-stone-600">{t.allDay}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={data.isAllDay} onChange={e => setData({...data, isAllDay: e.target.checked})} className="sr-only peer"/>
                  <div className="w-10 h-6 md:w-12 md:h-7 bg-stone-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 md:after:h-5 after:w-4 md:after:w-5 after:transition-all peer-checked:bg-amber-800"></div>
                </label>
             </div>

             <div className="bg-stone-50 p-4 md:p-6 rounded-2xl md:rounded-[2rem] space-y-3 border border-stone-100">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Users size={20} className="text-amber-800 md:w-6 md:h-6"/>
                        <span className="text-xs md:text-sm font-bold text-stone-600">{t.participants}</span>
                    </div>
                    <button 
                        onClick={() => setShowContactsModal(true)}
                        className="p-2 bg-white text-amber-700 rounded-full border border-stone-100 hover:bg-amber-50 transition-colors"
                        title={t.addFromContacts}
                    >
                        <UserPlus size={18}/>
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {data.participants?.map((pId) => {
                        const contact = allContacts.find(c => c.id === pId);
                        const name = contact ? contact.name : pId;
                        return (
                            <div key={pId} className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-stone-100 text-[10px] md:text-xs font-bold text-stone-600">
                                <span>{name}</span>
                                <button onClick={() => toggleParticipant(pId)} className="text-stone-300 hover:text-rose-500">
                                    <X size={12}/>
                                </button>
                            </div>
                        );
                    })}
                    {(!data.participants || data.participants.length === 0) && (
                        <p className="text-[10px] md:text-xs text-stone-300 italic">Chưa có người tham gia</p>
                    )}
                </div>
             </div>

             <div className="bg-stone-50 p-4 md:p-6 rounded-2xl md:rounded-[2rem] space-y-3 md:space-y-4 border border-stone-100">
                <div className="flex items-center gap-3">
                    <Volume2 className="text-amber-800 md:w-5 md:h-5" size={18}/>
                    <span className="text-[10px] md:text-xs font-bold text-stone-600 uppercase tracking-widest">{t.eventSound}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                    <div className="flex items-center justify-between gap-2">
                        <select 
                            value={EVENT_RINGTONES.some(rt => rt.url === data.ringtone) ? data.ringtone : 'custom'} 
                            onChange={e => {
                              const val = e.target.value;
                              if (val !== 'custom') {
                                setData({...data, ringtone: val});
                              }
                              if (isPlayingPreview) togglePreview();
                            }}
                            className="text-[10px] md:text-sm font-bold text-stone-700 bg-white border border-stone-200 rounded-lg md:rounded-xl px-2 md:px-4 py-1.5 md:py-2 outline-none cursor-pointer flex-1 min-w-0"
                        >
                            {EVENT_RINGTONES.map(rt => (
                                <option key={rt.url} value={rt.url}>{rt.name}</option>
                            ))}
                            <option value="custom" disabled={EVENT_RINGTONES.some(rt => rt.url === data.ringtone)}>Custom</option>
                        </select>
                        <div className="flex gap-1.5 md:gap-2 shrink-0">
                          <button 
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center hover:bg-stone-200 transition-colors"
                          >
                            <Upload size={14} className="md:w-4 md:h-4" />
                          </button>
                          <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload}/>
                          <button 
                              type="button"
                              onClick={togglePreview} 
                              className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all ${isPlayingPreview ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-800'}`}
                          >
                              {isPlayingPreview ? <Square size={14} className="md:w-4 md:h-4" fill="currentColor"/> : <Play size={14} className="md:w-4 md:h-4" fill="currentColor"/>}
                          </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4">
                        <span className="text-[8px] md:text-[10px] font-bold text-stone-400 uppercase shrink-0">{t.volume}</span>
                        <input 
                            type="range" min="0" max="1" step="0.1" 
                            value={data.volume || 0.7} 
                            onChange={e => {
                              const val = parseFloat(e.target.value);
                              setData({...data, volume: val});
                              if (audioRef.current) audioRef.current.volume = val;
                            }}
                            className="flex-1 accent-amber-800 h-1 md:h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer"
                        />
                    </div>
                </div>
             </div>

             <div className="flex items-center gap-3 md:gap-4 bg-stone-50 p-3 md:p-4 rounded-xl md:rounded-[2rem] border border-stone-100">
                <MapPin className="text-stone-300 shrink-0 md:w-6 md:h-6" size={20}/>
                <input 
                    type="text" 
                    placeholder={t.location} 
                    className="flex-1 bg-transparent text-xs md:text-sm font-bold outline-none min-w-0"
                    value={data.location || ''}
                    onChange={e => setData({ ...data, location: e.target.value })}
                />
             </div>

             <div className="flex items-center gap-3 md:gap-4 bg-stone-50 p-3 md:p-4 rounded-xl md:rounded-[2rem] border border-stone-100">
                <AlignLeft className="text-stone-300 shrink-0 md:w-6 md:h-6" size={20}/>
                <textarea 
                    placeholder={t.description} 
                    className="flex-1 bg-transparent text-xs md:text-sm font-medium outline-none resize-none h-16 md:h-20"
                    value={data.description || ''}
                    onChange={e => setData({ ...data, description: e.target.value })}
                />
             </div>

             <div className="bg-stone-50 p-4 md:p-6 rounded-2xl md:rounded-[2rem] space-y-3 md:space-y-4 pb-8">
                <span className="text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-widest">{t.settings}</span>
                <div className="flex justify-between items-center">
                   <span className="text-[10px] md:text-xs font-bold text-stone-600">{t.color}</span>
                   <div className="flex gap-1.5 md:gap-2">
                      {EVENT_COLORS.slice(0, 5).map(c => (
                        <button key={c} onClick={() => setData({...data, color: c})} className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 transition-transform ${data.color === c ? 'scale-110 border-stone-800' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                      ))}
                   </div>
                </div>
                <div className="flex justify-between items-center pt-1 md:pt-2">
                   <span className="text-[10px] md:text-xs font-bold text-stone-600">{t.recurrence}</span>
                   <select 
                    value={data.recurrence} 
                    onChange={e => setData({...data, recurrence: e.target.value as any})}
                    className="text-[10px] md:text-xs font-bold text-amber-800 bg-transparent outline-none cursor-pointer"
                   >
                     <option value="none">{t.none}</option>
                     <option value="daily">{t.daily}</option>
                     <option value="weekly">{t.weekly}</option>
                     <option value="monthly">{t.monthly}</option>
                     <option value="yearly">{t.yearly}</option>
                   </select>
                </div>
             </div>
          </div>
        </div>
      </div>

      {showContactsModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
             <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xl font-bold text-stone-800">{t.contacts}</h4>
                    <button onClick={() => setShowContactsModal(false)}><X size={20}/></button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
                   {allContacts.length === 0 ? (
                       <p className="text-center py-8 text-stone-300 italic">{t.noContacts}</p>
                   ) : (
                       allContacts.map(c => (
                           <button 
                            key={c.id} 
                            onClick={() => toggleParticipant(c.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${data.participants?.includes(c.id) ? 'bg-amber-50 border border-amber-200' : 'hover:bg-stone-50'}`}
                           >
                              <div className="text-left">
                                  <p className="font-bold text-stone-800 text-sm">{c.name}</p>
                                  <p className="text-[10px] text-stone-400 uppercase tracking-tighter">{c.account}</p>
                              </div>
                              {data.participants?.includes(c.id) && <Check size={16} className="text-amber-600"/>}
                           </button>
                       ))
                   )}
                </div>
                <button 
                  onClick={() => setShowContactsModal(false)}
                  className="w-full mt-6 py-3 bg-amber-800 text-white rounded-xl font-bold"
                >
                   {t.close}
                </button>
             </div>
          </div>
      )}
    </div>
  );
};
