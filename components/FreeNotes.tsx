
import React, { useState, useEffect } from 'react';
import { Plus, FileText, Clock } from 'lucide-react';
import { NoteItem, Language } from '../types';
import { StorageService } from '../services/storage';
import { Editor } from './Editor';
import { TRANSLATIONS } from '../constants';

interface FreeNotesProps {
  language: Language;
  accentColor: string;
}

export const FreeNotes: React.FC<FreeNotesProps> = ({ language, accentColor }) => {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    setNotes(StorageService.getFreeNotes());
  }, []);

  const handleSave = (newNotes: NoteItem[]) => {
    setNotes(newNotes);
    StorageService.saveFreeNotes(newNotes);
  };

  const createNote = () => {
    const newNote: NoteItem = {
      id: Date.now().toString(),
      title: t.newNote || 'New Note',
      content: '',
      updatedAt: Date.now(),
    };
    const updatedNotes = [newNote, ...notes];
    handleSave(updatedNotes);
    setActiveNoteId(newNote.id);
  };

  const updateActiveNote = (title: string, content: string) => {
    if (!activeNoteId) return;
    const updatedNotes = notes.map(note => 
      note.id === activeNoteId 
        ? { ...note, title, content, updatedAt: Date.now() }
        : note
    );
    updatedNotes.sort((a, b) => b.updatedAt - a.updatedAt);
    handleSave(updatedNotes);
  };

  const deleteActiveNote = () => {
    if (!activeNoteId) return;
    const updatedNotes = notes.filter(n => n.id !== activeNoteId);
    handleSave(updatedNotes);
    setActiveNoteId(null);
  };

  if (activeNoteId) {
    const activeNote = notes.find(n => n.id === activeNoteId);
    if (!activeNote) return null;
    return (
      <Editor
        initialTitle={activeNote.title}
        initialContent={activeNote.content}
        language={language}
        onSave={updateActiveNote}
        onBack={() => setActiveNoteId(null)}
        onDelete={deleteActiveNote}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center">
        <button 
          onClick={createNote}
          className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-sm text-sm font-medium transition-transform active:scale-95 ${accentColor}`}
        >
          <Plus size={18} />
          {t.create || 'Create'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto no-scrollbar pb-10">
        {notes.length === 0 ? (
          <div className="col-span-full py-20 text-center text-stone-400 flex flex-col items-center">
            <FileText size={48} className="mb-4 opacity-20" />
            <p>{t.noNotes || 'No notes yet'}</p>
          </div>
        ) : (
          notes.map(note => (
            <div 
              key={note.id}
              onClick={() => setActiveNoteId(note.id)}
              className="bg-white p-5 rounded-lg shadow-sm border border-stone-100 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <h3 className="font-bold text-stone-800 mb-2 truncate group-hover:text-stone-600 transition-colors">
                {note.title || t.newNote || 'Untitled'}
              </h3>
              <p className="text-stone-500 text-sm line-clamp-3 h-16 leading-relaxed">
                {note.content?.replace(/<[^>]*>/g, '') || "..."}
              </p>
              <div className="mt-4 flex items-center text-xs text-stone-400 gap-1">
                <Clock size={12} />
                {new Date(note.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
