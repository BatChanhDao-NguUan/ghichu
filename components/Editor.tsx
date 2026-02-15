
import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, ArrowLeft, Bold, Italic, Underline, Highlighter, 
  Palette, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, 
  Strikethrough, FileDown, Loader2, ChevronDown, 
  Type as FontIcon, FlipHorizontal, FlipVertical, Undo, Redo
} from 'lucide-react';
import { ExportService } from '../services/export';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface EditorProps {
  initialTitle?: string;
  initialContent: string;
  language: Language;
  onSave: (title: string, content: string) => void;
  onBack: () => void;
  onDelete?: () => void;
  hideTitleInput?: boolean;
  onChange?: (title: string, content: string) => void;
}

const FONT_FAMILIES = [
  { name: 'Mặc định', value: 'inherit' },
  { name: 'Inter', value: '"Inter", sans-serif' },
  { name: 'Noto Serif', value: '"Noto Serif", serif' },
  { name: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { name: 'Arial Black', value: '"Arial Black", Gadget, sans-serif' },
  { name: 'Arial Narrow', value: '"Arial Narrow", sans-serif' },
  { name: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { name: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
  { name: 'Trebuchet MS', value: '"Trebuchet MS", Helvetica, sans-serif' },
  { name: 'Impact', value: 'Impact, Charcoal, sans-serif' },
  { name: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Palatino', value: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
  { name: 'Bookman', value: '"Bookman Old Style", serif' },
  { name: 'Courier New', value: '"Courier New", Courier, monospace' },
  { name: 'Lucida Console', value: '"Lucida Console", Monaco, monospace' },
  { name: 'Consolas', value: 'Consolas, monaco, monospace' },
  { name: 'Comic Sans MS', value: '"Comic Sans MS", cursive, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { name: 'Gill Sans', value: '"Gill Sans", "Gill Sans MT", Calibri, sans-serif' },
  { name: 'Calibri', value: 'Calibri, Candara, Segoe, "Segoe UI", Optima, Arial, sans-serif' },
  { name: 'Candara', value: 'Candara, Calibri, Segoe, "Segoe UI", Optima, Arial, sans-serif' },
  { name: 'Optima', value: 'Optima, Segoe, "Segoe UI", Candara, Calibri, Arial, sans-serif' },
  { name: 'Segoe UI', value: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif' }
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

const PALETTE_COLORS = [
  '#000000', '#444444', '#666666', '#999999', '#cccccc', '#eeeeee', '#f3f3f3', '#ffffff',
  '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#9900ff', '#ff00ff',
  '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6fa8dc', '#8e7cc3', '#c27ba0',
  '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3d85c6', '#674ea7', '#a64d79',
  '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#0b5394', '#351c75', '#741b47',
  '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#073763', '#20124d', '#4c1130'
];

export const formatLinksAfterSave = (content: string): string => {
  if (!content) return "";
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  const processedLinks = tempDiv.querySelectorAll('.processed-link');
  processedLinks.forEach(span => {
    const urlTextSpan = span.querySelector('.url-text');
    if (urlTextSpan) {
      const textNode = document.createTextNode(urlTextSpan.textContent || '');
      span.parentNode?.replaceChild(textNode, span);
    }
  });
  let cleanedHtml = tempDiv.innerHTML;
  const urlRegex = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;
  return cleanedHtml.replace(urlRegex, (url) => {
    let href = url;
    if (url.toLowerCase().startsWith('www.')) {
      href = `http://${url}`;
    }
    return `<span class="processed-link"><a href="${href}" target="_blank" rel="noopener noreferrer" class="link-arrow">→</a><span class="url-text">${url}</span></span>`;
  });
};

export const Editor: React.FC<EditorProps> = ({ 
  initialTitle = '',
  initialContent,
  language, 
  onSave, 
  onBack,
  onDelete,
  hideTitleInput = false,
  onChange
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentBg, setCurrentBg] = useState('#ffff00');
  const [tempFontSize, setTempFontSize] = useState('14');
  const [title, setTitle] = useState(initialTitle);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [showHighlightPalette, setShowHighlightPalette] = useState(false);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = initialContent || '';
      setTimeout(() => contentRef.current?.focus(), 100);
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.download-container')) setShowDownloadMenu(false);
      if (!target.closest('.size-container')) setShowSizeDropdown(false);
      if (!target.closest('.color-palette-container')) setShowColorPalette(false);
      if (!target.closest('.highlight-palette-container')) setShowHighlightPalette(false);
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [initialContent]);

  // Báo hiệu thay đổi mỗi khi tiêu đề đổi
  useEffect(() => {
    onChange?.(title, contentRef.current?.innerHTML || '');
  }, [title]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (contentRef.current?.contains(range.commonAncestorContainer)) {
        savedRange.current = range.cloneRange();
      }
    }
  };

  const restoreSelection = () => {
    if (savedRange.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRange.current);
      }
    }
  };

  const execCmd = (command: string, value: any = null) => {
    contentRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    saveSelection();
    onChange?.(title, contentRef.current?.innerHTML || '');
  };

  const toggleColor = (type: 'foreColor' | 'hiliteColor', color: string) => {
    contentRef.current?.focus();
    restoreSelection();
    document.execCommand(type, false, color);
    
    if (type === 'foreColor') setCurrentColor(color);
    if (type === 'hiliteColor') setCurrentBg(color);
    
    saveSelection();
    onChange?.(title, contentRef.current?.innerHTML || '');
  };

  const applyCustomFontSize = (size: string) => {
    const s = parseInt(size);
    if (isNaN(s)) return;
    setTempFontSize(s.toString());
    
    restoreSelection();
    
    document.execCommand('fontSize', false, '7');
    const fonts = contentRef.current?.querySelectorAll('font[size="7"]');
    fonts?.forEach(f => {
        (f as HTMLElement).removeAttribute('size');
        (f as HTMLElement).style.fontSize = s + 'pt';
    });
    saveSelection();
    onChange?.(title, contentRef.current?.innerHTML || '');
  };

  const toggleFlip = (className: 'flip-h' | 'flip-v') => {
    contentRef.current?.focus();
    restoreSelection();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = className;
    try {
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
    } catch (e) {
        range.insertNode(span);
    }
    saveSelection();
    onChange?.(title, contentRef.current?.innerHTML || '');
  };

  const handleSave = () => {
    if (contentRef.current) {
        setIsSaving(true);
        const rawHtml = contentRef.current.innerHTML;
        const formattedHtml = formatLinksAfterSave(rawHtml);
        contentRef.current.innerHTML = formattedHtml;
        onSave(title, formattedHtml);
        setTimeout(() => setIsSaving(false), 800);
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 rounded-2xl shadow-sm border border-stone-200 overflow-hidden font-sans relative">
      <div className="sticky top-0 left-0 right-0 bg-stone-50 border-b border-stone-200 p-2 flex flex-wrap items-center gap-1 shrink-0 z-40 shadow-sm">
          <button onClick={onBack} className="p-1.5 hover:bg-stone-200 rounded text-stone-500 mr-1" title={t.back}><ArrowLeft size={16}/></button>
          
          <div className="flex bg-white border border-stone-200 rounded overflow-hidden mr-1">
            <button 
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); execCmd('undo'); }} 
                className="p-1.5 hover:bg-stone-100 border-r border-stone-100 text-stone-600" 
                title="Undo"
            >
                <Undo size={14}/>
            </button>
            <button 
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); execCmd('redo'); }} 
                className="p-1.5 hover:bg-stone-100 text-stone-600" 
                title="Redo"
            >
                <Redo size={14}/>
            </button>
          </div>

          <div className="h-4 w-px bg-stone-300 mx-1"></div>
          
          <div className="flex items-center bg-white border border-stone-200 rounded px-1">
            <FontIcon size={14} className="text-stone-400 ml-1"/>
            <select 
              onMouseDown={saveSelection}
              onChange={e => execCmd('fontName', e.target.value)} 
              className="text-[11px] p-1 bg-transparent outline-none w-24 cursor-pointer"
              style={{ fontFamily: 'inherit' }}
            >
              {FONT_FAMILIES.map(f => (
                <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-white border border-stone-200 rounded relative shrink-0 size-container">
            <input 
              type="number"
              value={tempFontSize}
              onMouseDown={saveSelection}
              onFocus={saveSelection}
              onChange={e => setTempFontSize(e.target.value)}
              onBlur={() => applyCustomFontSize(tempFontSize)}
              onKeyDown={e => {
                  if (e.key === 'Enter') {
                      e.preventDefault(); 
                      applyCustomFontSize(tempFontSize);
                      contentRef.current?.focus();
                  }
              }}
              className="w-10 text-[11px] p-1 bg-transparent outline-none text-center"
            />
            <button 
              onMouseDown={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                saveSelection();
                setShowSizeDropdown(!showSizeDropdown); 
              }}
              className="px-1 border-l border-stone-100 hover:bg-stone-50 h-full flex items-center"
            >
              <ChevronDown size={10} className="text-stone-400" />
            </button>
            
            {showSizeDropdown && (
              <div className="absolute top-full left-0 mt-1 w-20 bg-white border border-stone-300 shadow-xl rounded-lg py-1 z-[100] max-h-48 overflow-y-auto">
                {FONT_SIZES.map(size => (
                  <button 
                    key={size} 
                    onMouseDown={(e) => {
                        e.preventDefault(); 
                        e.stopPropagation();
                        applyCustomFontSize(size.toString());
                        setShowSizeDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[13px] text-stone-900 font-medium hover:bg-stone-100"
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-stone-300 mx-1"></div>

          <div className="flex bg-white border border-stone-200 rounded overflow-hidden">
            <button onMouseDown={(e) => { e.preventDefault(); saveSelection(); execCmd('bold'); }} className="p-1.5 hover:bg-stone-100 border-r border-stone-100"><Bold size={14}/></button>
            <button onMouseDown={(e) => { e.preventDefault(); saveSelection(); execCmd('italic'); }} className="p-1.5 hover:bg-stone-100 border-r border-stone-100"><Italic size={14}/></button>
            <button onMouseDown={(e) => { e.preventDefault(); saveSelection(); execCmd('underline'); }} className="p-1.5 hover:bg-stone-100 border-r border-stone-100"><Underline size={14}/></button>
            <button onMouseDown={(e) => { e.preventDefault(); saveSelection(); execCmd('strikeThrough'); }} className="p-1.5 hover:bg-stone-100"><Strikethrough size={14}/></button>
          </div>

          <div className="h-4 w-px bg-stone-300 mx-1"></div>

          <div className="flex items-center bg-white border border-stone-200 rounded color-palette-container relative">
            <button 
              onMouseDown={(e) => { 
                e.preventDefault(); 
                toggleColor('foreColor', currentColor);
              }}
              className="p-1.5 hover:bg-stone-100 flex flex-col items-center border-r border-stone-100" 
              title={t.color}
            >
              <Palette size={14} style={{ color: currentColor }}/>
              <div className="w-full h-1 mt-0.5" style={{ backgroundColor: currentColor }}></div>
            </button>
            <button 
              onMouseDown={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                saveSelection();
                setShowColorPalette(!showColorPalette); 
              }}
              className="p-1.5 hover:bg-stone-100 h-full flex items-center"
            >
              <ChevronDown size={10} className="text-stone-400" />
            </button>
            {showColorPalette && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-stone-300 shadow-xl rounded-lg z-[100] w-48 grid grid-cols-8 gap-1">
                {PALETTE_COLORS.map(c => (
                  <button 
                    key={c} 
                    onMouseDown={(e) => { 
                      e.preventDefault(); 
                      setCurrentColor(c); 
                      execCmd('foreColor', c); 
                      setShowColorPalette(false); 
                    }}
                    className="w-5 h-5 rounded border border-stone-200" 
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center bg-white border border-stone-200 rounded ml-1 highlight-palette-container relative">
            <button 
              onMouseDown={(e) => { 
                e.preventDefault(); 
                toggleColor('hiliteColor', currentBg);
              }}
              className="p-1.5 hover:bg-stone-100 flex flex-col items-center border-r border-stone-100" 
              title="Highlight"
            >
              <Highlighter size={14} style={{ color: currentBg }}/>
              <div className="w-full h-1 mt-0.5" style={{ backgroundColor: currentBg }}></div>
            </button>
            <button 
              onMouseDown={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                saveSelection();
                setShowHighlightPalette(!showHighlightPalette); 
              }}
              className="p-1.5 hover:bg-stone-100 h-full flex items-center"
            >
              <ChevronDown size={10} className="text-stone-400" />
            </button>
            {showHighlightPalette && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-stone-300 shadow-xl rounded-lg z-[100] w-48 grid grid-cols-8 gap-1">
                {PALETTE_COLORS.map(c => (
                  <button 
                    key={c} 
                    onMouseDown={(e) => { 
                      e.preventDefault(); 
                      setCurrentBg(c); 
                      execCmd('hiliteColor', c); 
                      setShowHighlightPalette(false); 
                    }}
                    className="w-5 h-5 rounded border border-stone-200" 
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-stone-300 mx-1"></div>

          <div className="flex bg-white border border-stone-200 rounded overflow-hidden">
            <button onMouseDown={(e) => { e.preventDefault(); saveSelection(); execCmd('justifyLeft'); }} className="p-1.5 hover:bg-stone-100 border-r border-stone-100"><AlignLeft size={14}/></button>
            <button onMouseDown={(e) => { e.preventDefault(); saveSelection(); execCmd('justifyCenter'); }} className="p-1.5 hover:bg-stone-100 border-r border-stone-100"><AlignCenter size={14}/></button>
            <button onMouseDown={(e) => { e.preventDefault(); saveSelection(); execCmd('justifyRight'); }} className="p-1.5 hover:bg-stone-100 border-r border-stone-100"><AlignRight size={14}/></button>
          </div>
          
          <div className="ml-1 flex bg-white border border-stone-200 rounded overflow-hidden">
             <button onMouseDown={(e) => { e.preventDefault(); saveSelection(); toggleFlip('flip-h'); }} className="p-1.5 hover:bg-stone-100 border-r border-stone-100" title="Flip Horizontal"><FlipHorizontal size={14}/></button>
             <button onMouseDown={(e) => { e.preventDefault(); saveSelection(); toggleFlip('flip-v'); }} className="p-1.5 hover:bg-stone-100" title="Flip Vertical"><FlipVertical size={14}/></button>
          </div>

          <button onMouseDown={(e) => { e.preventDefault(); saveSelection(); execCmd('insertUnorderedList'); }} className="ml-1 p-1.5 hover:bg-stone-200 rounded" title="List"><List size={14}/></button>

          <div className="ml-auto flex items-center gap-1">
            <div className="relative shrink-0 download-container">
                <button 
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setShowDownloadMenu(!showDownloadMenu); }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-stone-100 text-stone-600 rounded-lg text-[10px] font-bold border border-stone-200 hover:bg-stone-200 transition-colors"
                >
                  <FileDown size={14}/> {t.download} <ChevronDown size={10}/>
                </button>
                {showDownloadMenu && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-stone-200 shadow-xl rounded-xl py-2 z-[100]">
                    <button onMouseDown={(e) => { e.preventDefault(); ExportService.toPDF(title, contentRef.current?.innerHTML || ''); setShowDownloadMenu(false); }} className="w-full text-left px-4 py-2 text-xs hover:bg-stone-50">PDF (.pdf)</button>
                    <button onMouseDown={(e) => { e.preventDefault(); ExportService.toDOCX(title, contentRef.current?.innerHTML || ''); setShowDownloadMenu(false); }} className="w-full text-left px-4 py-2 text-xs hover:bg-stone-50">Word (.doc)</button>
                    <button onMouseDown={(e) => { e.preventDefault(); ExportService.toTXT(title, contentRef.current?.innerHTML || ''); setShowDownloadMenu(false); }} className="w-full text-left px-4 py-2 text-xs hover:bg-stone-50">Text (.txt)</button>
                  </div>
                )}
            </div>

            <button onMouseDown={(e) => { e.preventDefault(); handleSave(); }} className="flex items-center gap-1.5 bg-amber-800 text-white px-4 py-1.5 rounded-lg text-[11px] font-bold shadow-lg active:scale-95 transition-all">
              {isSaving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} {t.save}
            </button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-[800px] mx-auto min-h-full bg-white shadow-sm p-8 md:p-12 my-4 md:my-8 rounded-xl border border-stone-100">
          {!hideTitleInput && (
            <div className="pb-4">
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.titlePlaceholder}
                className="w-full text-3xl font-serif font-bold text-stone-800 outline-none border-b border-stone-100 pb-2 mb-4 placeholder:text-stone-200"
              />
            </div>
          )}

          <div 
            ref={contentRef}
            contentEditable
            onInput={() => onChange?.(title, contentRef.current?.innerHTML || '')}
            onSelect={saveSelection}
            onKeyUp={saveSelection}
            onFocus={saveSelection}
            onMouseUp={saveSelection}
            className="outline-none rich-content font-serif text-lg text-stone-800 w-full break-words whitespace-pre-wrap"
          />
        </div>
      </div>
    </div>
  );
};
