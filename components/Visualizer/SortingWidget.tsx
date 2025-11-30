import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Edit3, Save } from 'lucide-react';

interface SortingWidgetProps {
  data: number[];
}

const SortingWidget: React.FC<SortingWidgetProps> = ({ data: initialData }) => {
  const [array, setArray] = useState<number[]>(initialData || [50, 20, 90, 10, 30, 70, 40, 80]);
  const [sorting, setSorting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [compareIndex, setCompareIndex] = useState<number>(-1);
  const [isEditing, setIsEditing] = useState(false);
  const [inputStr, setInputStr] = useState('');

  useEffect(() => {
     if(isEditing) {
         setInputStr(array.join(', '));
     }
  }, [isEditing, array]);

  const handleSave = () => {
      const newArr = inputStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      if (newArr.length > 0) {
          setArray(newArr);
      }
      setIsEditing(false);
  };

  const bubbleSort = async () => {
    if (sorting) return;
    setSorting(true);
    const arr = [...array];
    const n = arr.length;
    
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        setCurrentIndex(j);
        setCompareIndex(j + 1);
        await new Promise(r => setTimeout(r, 300)); // Animation delay
        
        if (arr[j] > arr[j + 1]) {
          const temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;
          setArray([...arr]);
        }
      }
    }
    setSorting(false);
    setCurrentIndex(-1);
    setCompareIndex(-1);
  };

  const reset = () => {
    setArray(initialData || [50, 20, 90, 10, 30, 70, 40, 80]);
    setSorting(false);
    setCurrentIndex(-1);
    setCompareIndex(-1);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      {isEditing ? (
          <div className="flex-1 w-full flex flex-col items-center justify-center gap-2">
              <label className="text-xs text-slate-400">Comma separated numbers</label>
              <textarea 
                value={inputStr}
                onChange={(e) => setInputStr(e.target.value)}
                className="w-full h-24 bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
              <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-medium">
                  <Save size={12} /> Save Data
              </button>
          </div>
      ) : (
        <>
            <div className="flex items-end justify-center gap-1 flex-1 w-full mb-2">
                {array.map((val, idx) => (
                <div
                    key={idx}
                    className={`w-full max-w-[30px] rounded-t-md transition-all duration-300 relative group ${
                    idx === currentIndex ? 'bg-yellow-500' :
                    idx === compareIndex ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ height: `${Math.max(10, (val / Math.max(...array)) * 100)}%` }}
                >
                    <div className="hidden group-hover:block absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-white bg-black/50 px-1 rounded whitespace-nowrap">{val}</div>
                </div>
                ))}
            </div>
            
            <div className="flex gap-2 w-full">
                <button 
                onClick={() => setIsEditing(true)}
                disabled={sorting}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs disabled:opacity-50"
                title="Edit Data"
                >
                <Edit3 size={14} />
                </button>
                <button 
                onClick={bubbleSort} 
                disabled={sorting}
                className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium disabled:opacity-50"
                >
                <Play size={14} /> Sort
                </button>
                <button 
                onClick={reset} 
                disabled={sorting}
                className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium disabled:opacity-50"
                title="Reset"
                >
                <RotateCcw size={14} />
                </button>
            </div>
        </>
      )}
    </div>
  );
};

export default SortingWidget;