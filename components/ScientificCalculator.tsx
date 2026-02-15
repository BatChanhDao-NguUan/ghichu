import React, { useState, useCallback } from 'react';
import { ArrowLeft, RotateCcw, Delete, CornerDownLeft } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface ScientificCalculatorProps {
  language: Language;
  onBack: () => void;
}

export const ScientificCalculator: React.FC<ScientificCalculatorProps> = ({ language, onBack }) => {
  const t = TRANSLATIONS[language];
  const [display, setDisplay] = useState('0');
  const [formula, setFormula] = useState('');
  const [memory, setMemory] = useState(0);
  const [isRad, setIsRad] = useState(true);
  const [shouldReset, setShouldReset] = useState(false);

  const safeEvaluate = (expr: string): number => {
    try {
      let processed = expr.replace(/π/g, Math.PI.toString());
      const sanitized = processed.replace(/[^-+*/().0-9e]/g, '');
      return new Function(`return ${sanitized}`)();
    } catch (e) {
      throw new Error("Invalid Expression");
    }
  };

  const calculate = () => {
    try {
      if (display === 'Error') return;
      const result = safeEvaluate(display);
      if (isNaN(result) || !isFinite(result)) throw new Error();
      
      setFormula(display + ' =');
      setDisplay(Number(result.toFixed(10)).toString());
      setShouldReset(true);
    } catch (e) {
      setDisplay('Error');
      setShouldReset(true);
    }
  };

  const handleNumber = (num: string) => {
    if (display === '0' || display === 'Error' || shouldReset) {
      setDisplay(num);
      setShouldReset(false);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    if (display === 'Error') return;
    setShouldReset(false);
    setDisplay(display + op);
  };

  const handleFunction = (fn: string) => {
    if (display === 'Error') return;
    const val = parseFloat(display);
    if (isNaN(val)) return;

    let result: number;
    const angle = isRad ? val : (val * Math.PI) / 180;

    switch (fn) {
      case 'sin': result = Math.sin(angle); break;
      case 'cos': result = Math.cos(angle); break;
      case 'tan': result = Math.tan(angle); break;
      case 'sqrt': result = Math.sqrt(val); break;
      case 'ln': result = Math.log(val); break;
      case 'log': result = Math.log10(val); break;
      case 'fact': 
        if (val < 0 || val > 170) { setDisplay('Error'); return; }
        result = 1;
        for(let i = 2; i <= Math.floor(val); i++) result *= i;
        break;
      case 'square': result = Math.pow(val, 2); break;
      case 'cube': result = Math.pow(val, 3); break;
      case 'inv': result = 1 / val; break;
      case 'percent': result = val / 100; break;
      default: return;
    }

    if (isNaN(result) || !isFinite(result)) {
      setDisplay('Error');
    } else {
      const finalRes = Number(result.toFixed(10)).toString();
      setDisplay(finalRes);
      setFormula(`${fn}(${val}) =`);
    }
    setShouldReset(true);
  };

  const handleMemory = (action: 'M+' | 'M-' | 'MR' | 'MC') => {
    const val = parseFloat(display);
    if (isNaN(val) && (action === 'M+' || action === 'M-')) return;

    switch (action) {
      case 'M+': setMemory(prev => prev + val); setShouldReset(true); break;
      case 'M-': setMemory(prev => prev - val); setShouldReset(true); break;
      case 'MR': setDisplay(memory.toString()); setShouldReset(false); break;
      case 'MC': setMemory(0); break;
    }
  };

  const clear = () => {
    setDisplay('0');
    setFormula('');
    setShouldReset(false);
  };

  const backspace = () => {
    if (shouldReset || display === 'Error') {
      clear();
    } else if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const Button = ({ children, onClick, className = '', orange = false, gray = false, sci = false, small = false }: any) => (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center rounded-xl font-bold shadow-md transition-all active:scale-95 active:brightness-125
        ${small ? 'h-8 md:h-10 text-[9px] md:text-[10px]' : 'h-10 md:h-14 text-xs md:text-lg landscape:h-9 landscape:text-xs'}
        ${orange ? 'bg-orange-500 text-white' : 
          gray ? 'bg-stone-400 text-stone-900' : 
          sci ? 'bg-stone-700 text-stone-200 text-[10px] md:text-xs' :
          'bg-stone-800 text-stone-100'}
        ${className}
      `}
    >
      {children}
    </button>
  );

  return (
    <div className="max-w-md mx-auto h-[calc(100vh-100px)] md:h-[calc(100vh-60px)] landscape:h-[calc(100vh-60px)] flex flex-col bg-stone-950 rounded-[1.5rem] md:rounded-[2.5rem] border-[6px] md:border-[10px] border-stone-800 shadow-2xl p-3 md:p-6 select-none animate-in fade-in duration-500 overflow-hidden">
      {/* Top Bar Optimized */}
      <div className="flex justify-between items-center mb-2 md:mb-4 px-1">
        <button onClick={onBack} className="text-stone-600 hover:text-stone-300 transition-colors p-1">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
            <span className="hidden sm:block text-stone-700 font-mono text-[9px] font-bold tracking-[0.1em]">SCIENTIFIC SIM</span>
            <button 
              onClick={() => setIsRad(!isRad)} 
              className={`text-[8px] px-1.5 py-0.5 rounded font-black transition-colors ${isRad ? 'bg-amber-600 text-white' : 'bg-stone-800 text-stone-500'}`}
            >
                {isRad ? 'RAD' : 'DEG'}
            </button>
        </div>
      </div>

      {/* Screen Display Optimized for Landscape */}
      <div className="bg-[#94a180] rounded-xl p-2 md:p-4 mb-3 md:mb-6 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] border-2 md:border-4 border-stone-800 flex flex-col justify-between items-end h-20 md:h-40 shrink-0 font-mono">
        <div className="w-full flex justify-between items-center text-stone-900/40 text-[8px] md:text-[9px] font-bold uppercase tracking-widest">
            <div className="flex gap-2">
              <span>{isRad ? 'R' : 'D'}</span>
              {memory !== 0 && <span>M</span>}
            </div>
            <span className="truncate ml-2">Casio-ES Sim</span>
        </div>
        <div className="text-stone-900/60 text-[10px] md:text-sm truncate w-full text-right h-4 md:h-5 italic leading-none">
          {formula}
        </div>
        <div className={`text-stone-950 font-bold truncate w-full text-right leading-none ${display.length > 12 ? 'text-xl md:text-3xl' : 'text-3xl md:text-5xl'} landscape:text-2xl`}>
          {display}
        </div>
      </div>

      {/* Keyboard Grid - Optimized Scrollable */}
      <div className="flex-1 grid grid-cols-4 gap-1.5 md:gap-3 overflow-y-auto no-scrollbar pb-2">
        <Button onClick={() => handleMemory('MC')} small sci>MC</Button>
        <Button onClick={() => handleMemory('MR')} small sci>MR</Button>
        <Button onClick={() => handleMemory('M-')} small sci>M-</Button>
        <Button onClick={() => handleMemory('M+')} small sci>M+</Button>

        <Button onClick={() => handleFunction('sin')} sci>sin</Button>
        <Button onClick={() => handleFunction('cos')} sci>cos</Button>
        <Button onClick={() => handleFunction('tan')} sci>tan</Button>
        <Button onClick={() => handleFunction('fact')} sci>x!</Button>

        <Button onClick={() => handleFunction('log')} sci>log</Button>
        <Button onClick={() => handleFunction('ln')} sci>ln</Button>
        <Button onClick={() => handleOperator('(')} sci>(</Button>
        <Button onClick={() => handleOperator(')')} sci>)</Button>

        <Button onClick={() => handleFunction('sqrt')} sci>√</Button>
        <Button onClick={() => handleFunction('square')} sci>x²</Button>
        <Button onClick={() => handleFunction('inv')} sci>x⁻¹</Button>
        <Button onClick={() => handleOperator('**')} sci>xʸ</Button>

        <Button onClick={clear} gray className="text-stone-900">AC</Button>
        <Button onClick={backspace} gray className="text-stone-900"><Delete size={16}/></Button>
        <Button onClick={() => handleOperator('/')} orange>÷</Button>
        <Button onClick={() => handleOperator('*')} orange>×</Button>

        <Button onClick={() => handleNumber('7')}>7</Button>
        <Button onClick={() => handleNumber('8')}>8</Button>
        <Button onClick={() => handleNumber('9')}>9</Button>
        <Button onClick={() => handleOperator('-')} orange>−</Button>

        <Button onClick={() => handleNumber('4')}>4</Button>
        <Button onClick={() => handleNumber('5')}>5</Button>
        <Button onClick={() => handleNumber('6')}>6</Button>
        <Button onClick={() => handleOperator('+')} orange>+</Button>

        <Button onClick={() => handleNumber('1')}>1</Button>
        <Button onClick={() => handleNumber('2')}>2</Button>
        <Button onClick={() => handleNumber('3')}>3</Button>
        <Button onClick={calculate} orange className="bg-amber-600 row-span-2 h-auto"><CornerDownLeft size={20}/></Button>

        <Button onClick={() => handleNumber('0')} className="col-span-2">0</Button>
        <Button onClick={() => handleNumber('.')}>.</Button>
      </div>
    </div>
  );
};