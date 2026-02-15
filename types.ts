
export type Language = 'en' | 'vi' | 'fr' | 'es' | 'ru' | 'zh' | 'ko' | 'ja' | 'th' | 'ar' | 'hi';
export type Theme = 'stone' | 'slate' | 'rose' | 'amber';

export interface AppSettings {
  language: Language;
  theme: Theme;
  seenQuotes: string[];
}

export interface DailyQuoteContent {
  pali: string;
  vietnamese: string;
  explanation: string;
  source: string;
}

export interface DailyQuoteData {
  id: number;
  imageUrl: string;
  content: Record<string, DailyQuoteContent>;
}

export interface TabbedNote {
  id: string;
  name: string;
  encryptedContent: string;
  passwordHash?: string; // SHA-256
  updatedAt: number;
}

export type View = 'chat' | 'calendar' | 'create-note' | 'settings' | 'history' | 'qna' | 'reminder' | 'calculator';
export type CalendarViewMode = 'month' | 'week' | 'day' | 'schedule';
export type NoteViewMode = 'grid' | 'list' | 'columns' | 'icons';

export type AccountType = 'local' | 'google' | 'samsung';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  account: AccountType;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string; 
  endDate: string; 
  isAllDay: boolean;
  color: string;
  account: AccountType;
  recurrence: RecurrenceType;
  reminders: { id: string; minutesBefore: number }[];
  participants?: string[]; // Danh sách ID danh bạ hoặc tên
  ringtone?: string;
  volume?: number;
  isRinging?: boolean;
  lastNotified?: string;
  updatedAt: number;
}

export interface Alarm {
  id: string;
  time: string;
  label: string;
  isActive: boolean;
  repeatDays: number[];
  snoozeEnabled: boolean;
  snoozeInterval: number;
  snoozeLimit?: number; 
  snoozeCount?: number;
  volume: number;
  vibrate: boolean;
  ringtone?: string;
  ringtoneName?: string;
  gradualVolume: boolean;
  lastTriggered?: string;
  snoozedUntil?: number;
}

export interface RunningTimer {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  endTime: number;
  status: 'running' | 'paused' | 'completed';
  volume: number;
  ringtone: string;
  isRinging?: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  lastMessage?: string;
}

export interface CalendarNote {
  id: string;
  date: string;
  title: string;
  content: string;
}

export interface ProtectedNote {
  id: string;
  title: string;
  content: string;
  passwordHash?: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export interface WorldClockCity {
  id: string;
  name: string;
  timezone: string;
  displayMode: 'digital' | 'analog';
}

export interface StopwatchLap {
  lapTime: number;
  totalTime: number;
}

export interface StopwatchSession {
  id: string;
  date: number;
  totalTime: number;
  laps: StopwatchLap[];
}

export interface TimerPreset {
  id: string;
  label: string;
  hours: number;
  minutes: number;
  seconds: number;
  ringtone: string;
  volume: number;
}

export interface ChatMessageAI {
  role: 'user' | 'model';
  parts: { text: string }[];
}
