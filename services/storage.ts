
import { AppSettings, ChatRoom, CalendarNote, ProtectedNote, NoteItem, Alarm, WorldClockCity, StopwatchSession, TimerPreset, RunningTimer, CalendarEvent, ChatMessageAI, Contact } from '../types';

let currentNamespace = '';

export const StorageService = {
  setNamespace: (name: string) => {
    currentNamespace = name.trim().toLowerCase().replace(/\s+/g, '_');
  },

  getNamespace: () => currentNamespace,

  getKey: (key: string) => `life_notes_${currentNamespace}_${key}`,

  getSettings: (): AppSettings => {
    try {
      const data = localStorage.getItem(StorageService.getKey('settings'));
      const parsed = data ? JSON.parse(data) : null;
      return parsed || { language: 'en', theme: 'amber', seenQuotes: [] };
    } catch {
      return { language: 'en', theme: 'amber', seenQuotes: [] };
    }
  },

  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(StorageService.getKey('settings'), JSON.stringify(settings));
  },

  getAIChatHistory: (): ChatMessageAI[] => {
    try {
      const data = localStorage.getItem(StorageService.getKey('ai_chat_history'));
      const parsed = data ? JSON.parse(data) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  },

  saveAIChatHistory: (history: ChatMessageAI[]) => {
    localStorage.setItem(StorageService.getKey('ai_chat_history'), JSON.stringify(history));
  },

  getCalendarEvents: (): CalendarEvent[] => {
    try {
      const data = localStorage.getItem(StorageService.getKey('calendar_events_v2'));
      const parsed = data ? JSON.parse(data) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  },

  saveCalendarEvents: (events: CalendarEvent[]) => {
    localStorage.setItem(StorageService.getKey('calendar_events_v2'), JSON.stringify(events));
  },

  getContacts: (): Contact[] => {
    try {
      const data = localStorage.getItem(StorageService.getKey('contacts'));
      const parsed = data ? JSON.parse(data) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  },

  saveContacts: (contacts: Contact[]) => {
    localStorage.setItem(StorageService.getKey('contacts'), JSON.stringify(contacts));
  },

  getChatRooms: (): ChatRoom[] => {
    try {
      const data = localStorage.getItem(StorageService.getKey('chat_rooms'));
      const parsed = data ? JSON.parse(data) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  },

  saveChatRooms: (rooms: ChatRoom[]) => {
    localStorage.setItem(StorageService.getKey('chat_rooms'), JSON.stringify(rooms));
  },

  getCalendarNotes: (): CalendarNote[] => {
    try {
      const data = localStorage.getItem(StorageService.getKey('calendar_notes'));
      const parsed = data ? JSON.parse(data) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  },

  saveCalendarNotes: (notes: CalendarNote[]) => {
    localStorage.setItem(StorageService.getKey('calendar_notes'), JSON.stringify(notes));
  },

  getProtectedNotes: (): ProtectedNote[] => {
    try {
      const data = localStorage.getItem(StorageService.getKey('protected_notes'));
      const parsed = data ? JSON.parse(data) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  },

  saveProtectedNotes: (notes: ProtectedNote[]) => {
    localStorage.setItem(StorageService.getKey('protected_notes'), JSON.stringify(notes));
  },

  getFreeNotes: (): NoteItem[] => {
    try {
      const data = localStorage.getItem(StorageService.getKey('free_notes'));
      const parsed = data ? JSON.parse(data) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  },

  saveFreeNotes: (notes: NoteItem[]) => {
    localStorage.setItem(StorageService.getKey('free_notes'), JSON.stringify(notes));
  },

  getAlarms: (): Alarm[] => {
    try {
      const data = localStorage.getItem(StorageService.getKey('alarms'));
      const parsed = data ? JSON.parse(data) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  },

  saveAlarms: (alarms: Alarm[]) => {
    localStorage.setItem(StorageService.getKey('alarms'), JSON.stringify(alarms));
  },

  getTimerPresets: (): TimerPreset[] => {
    try {
      const data = localStorage.getItem(StorageService.getKey('timer_presets'));
      const parsed = data ? JSON.parse(data) : null;
      if (Array.isArray(parsed)) return parsed;
      return [
        { id: 'p1', label: 'Nấu mì', hours: 0, minutes: 3, seconds: 0, ringtone: 'https://assets.mixkit.co/active_storage/sfx/1000/1000-preview.mp3', volume: 0.8 },
        { id: 'p2', label: 'Tập thể dục', hours: 0, minutes: 45, seconds: 0, ringtone: 'https://assets.mixkit.co/active_storage/sfx/1000/1000-preview.mp3', volume: 0.8 },
        { id: 'p3', label: 'Nghỉ giải lao', hours: 0, minutes: 15, seconds: 0, ringtone: 'https://assets.mixkit.co/active_storage/sfx/1000/1000-preview.mp3', volume: 0.8 }
      ];
    } catch { return []; }
  },

  saveTimerPresets: (presets: TimerPreset[]) => {
    localStorage.setItem(StorageService.getKey('timer_presets'), JSON.stringify(presets));
  },

  getRunningTimers: (): RunningTimer[] => {
    try {
      const data = localStorage.getItem(StorageService.getKey('running_timers'));
      const parsed = data ? JSON.parse(data) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  },

  saveRunningTimers: (timers: RunningTimer[]) => {
    localStorage.setItem(StorageService.getKey('running_timers'), JSON.stringify(timers));
  },

  getWorldCities: (): WorldClockCity[] => {
    try {
      const data = localStorage.getItem(StorageService.getKey('world_cities'));
      const parsed = data ? JSON.parse(data) : null;
      if (Array.isArray(parsed)) return parsed;
      return [
        { id: '1', name: 'New York', timezone: 'America/New_York', displayMode: 'digital' },
        { id: '2', name: 'London', timezone: 'Europe/London', displayMode: 'digital' },
        { id: '3', name: 'Tokyo', timezone: 'Asia/Tokyo', displayMode: 'digital' },
        { id: '4', name: 'Ho Chi Minh City', timezone: 'Asia/Ho_Chi_Minh', displayMode: 'digital' }
      ];
    } catch { return []; }
  },

  saveWorldCities: (cities: WorldClockCity[]) => {
    localStorage.setItem(StorageService.getKey('world_cities'), JSON.stringify(cities));
  },

  getStopwatchHistory: (): StopwatchSession[] => {
    try {
      const data = localStorage.getItem(StorageService.getKey('stopwatch_history'));
      const parsed = data ? JSON.parse(data) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  },

  saveStopwatchHistory: (history: StopwatchSession[]) => {
    localStorage.setItem(StorageService.getKey('stopwatch_history'), JSON.stringify(history));
  }
};
