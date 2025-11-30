import React, { useState } from 'react';
import { Plus, Minus, RotateCcw } from 'lucide-react';

const StackWidget: React.FC = () => {
  const [stack, setStack] = useState<number[]>([10, 20, 30]);
  const [inputValue, setInputValue] = useState('');

  const push = () => {
    if (!inputValue) return;
    if (stack.length >= 7) return; // Limit for visual
    setStack(prev => [...prev, parseInt(inputValue) || 0]);
    setInputValue('');
  };

  const pop = () => {
    setStack(prev => prev.slice(0, -1));
  };

  return (
    <div className="w-full h-full flex flex-col p-4 items-center">
      <div className="flex-1 w-full flex flex-col-reverse items-center justify-end gap-2 pb-4 overflow-hidden relative">
        {/* Stack Container */}
        <div className="w-24 border-b-4 border-l-4 border-r-4 border-slate-600 rounded-b-lg min-h-[160px] flex flex-col-reverse p-1 gap-1 bg-slate-800/30">
          {stack.map((val, idx) => (
            <div key={idx} className="w-full h-8 bg-amber-500 rounded text-white flex items-center justify-center text-xs font-bold shadow animate-slide-in-bottom">
              {val}
            </div>
          ))}
        </div>
        <div className="text-xs text-slate-500 font-mono mt-2">TOP</div>
      </div>

      <div className="w-full flex gap-2">
        <input 
          type="number" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Val"
          className="w-16 bg-slate-800 border border-slate-600 rounded px-2 text-xs text-white focus:outline-none focus:border-amber-500"
        />
        <button onClick={push} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs py-1 flex items-center justify-center gap-1">
          <Plus size={12} /> Push
        </button>
        <button onClick={pop} className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs py-1 flex items-center justify-center gap-1">
          <Minus size={12} /> Pop
        </button>
      </div>
    </div>
  );
};

export default StackWidget;
