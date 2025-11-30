import React, { useState, useEffect } from 'react';
import { Play, RotateCcw } from 'lucide-react';

interface SortingWidgetProps {
  data: number[];
}

const SortingWidget: React.FC<SortingWidgetProps> = ({ data: initialData }) => {
  const [array, setArray] = useState<number[]>(initialData || [50, 20, 90, 10, 30, 70, 40, 80]);
  const [sorting, setSorting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [compareIndex, setCompareIndex] = useState<number>(-1);

  const bubbleSort = async () => {
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
    setArray(initialData || Array.from({ length: 8 }, () => Math.floor(Math.random() * 100)));
    setSorting(false);
    setCurrentIndex(-1);
    setCompareIndex(-1);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/90 rounded-lg p-4 backdrop-blur-sm border border-slate-700">
      <div className="text-xs font-mono text-slate-400 mb-2">Bubble Sort Visualizer</div>
      <div className="flex items-end justify-center gap-1 h-32 w-full mb-4">
        {array.map((val, idx) => (
          <div
            key={idx}
            className={`w-6 rounded-t-md transition-all duration-300 ${
              idx === currentIndex ? 'bg-yellow-500' :
              idx === compareIndex ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ height: `${val}%` }}
          >
            <div className="hidden hover:block absolute -top-6 text-xs text-white">{val}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button 
          onClick={bubbleSort} 
          disabled={sorting}
          className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium disabled:opacity-50"
        >
          <Play size={12} /> Sort
        </button>
        <button 
          onClick={reset} 
          disabled={sorting}
          className="flex items-center gap-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium disabled:opacity-50"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>
    </div>
  );
};

export default SortingWidget;