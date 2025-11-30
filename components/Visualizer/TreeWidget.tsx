import React, { useState, useEffect } from 'react';
import { Play, RotateCcw } from 'lucide-react';

const TreeWidget: React.FC = () => {
  const [highlight, setHighlight] = useState<number | null>(null);

  // Hardcoded simple tree for demo: 50 -> 30, 70 -> 20, 40, 60, 80
  const nodes = [
    { id: 50, x: 150, y: 30, l: 30, r: 70 },
    { id: 30, x: 75, y: 80, l: 20, r: 40 },
    { id: 70, x: 225, y: 80, l: 60, r: 80 },
    { id: 20, x: 37, y: 130 },
    { id: 40, x: 112, y: 130 },
    { id: 60, x: 187, y: 130 },
    { id: 80, x: 262, y: 130 },
  ];

  const edges = [
    { from: 50, to: 30 }, { from: 50, to: 70 },
    { from: 30, to: 20 }, { from: 30, to: 40 },
    { from: 70, to: 60 }, { from: 70, to: 80 }
  ];

  const traverse = async () => {
    const sequence = [50, 30, 20, 40, 70, 60, 80]; // Pre-order
    for (const id of sequence) {
      setHighlight(id);
      await new Promise(r => setTimeout(r, 600));
    }
    setHighlight(null);
  };

  return (
    <div className="w-full h-full flex flex-col items-center p-2">
      <div className="flex-1 w-full relative">
        <svg viewBox="0 0 300 160" className="w-full h-full">
           {edges.map((e, i) => {
             const n1 = nodes.find(n => n.id === e.from)!;
             const n2 = nodes.find(n => n.id === e.to)!;
             return <line key={i} x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} stroke="#475569" strokeWidth="2" />
           })}
           {nodes.map(n => (
             <g key={n.id}>
               <circle 
                 cx={n.x} cy={n.y} r="12" 
                 fill={highlight === n.id ? '#3b82f6' : '#1e293b'} 
                 stroke={highlight === n.id ? '#60a5fa' : '#475569'} 
                 strokeWidth="2"
                 className="transition-colors duration-300"
               />
               <text x={n.x} y={n.y} dy="4" textAnchor="middle" fontSize="10" fill="white">{n.id}</text>
             </g>
           ))}
        </svg>
      </div>
      <button onClick={traverse} className="mt-2 flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium">
        <Play size={12} /> Traverse (DFS)
      </button>
    </div>
  );
};

export default TreeWidget;
