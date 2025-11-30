import React, { useState } from 'react';
import { Play } from 'lucide-react';

const GraphWidget: React.FC = () => {
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<string | null>(null);

  const nodes = [
    { id: 'A', x: 50, y: 80 },
    { id: 'B', x: 120, y: 30 },
    { id: 'C', x: 120, y: 130 },
    { id: 'D', x: 200, y: 50 },
    { id: 'E', x: 200, y: 110 },
    { id: 'F', x: 270, y: 80 },
  ];

  const edges = [
    ['A','B'], ['A','C'], ['B','D'], ['C','E'], ['D','F'], ['E','F'], ['B', 'C']
  ];

  const bfs = async () => {
    setVisited(new Set());
    const queue = ['A'];
    const seen = new Set(['A']);
    
    while (queue.length > 0) {
      const curr = queue.shift()!;
      setActive(curr);
      setVisited(prev => new Set(prev).add(curr));
      await new Promise(r => setTimeout(r, 700));

      // Get neighbors (simple logic for demo)
      const neighbors = edges
        .filter(e => e.includes(curr))
        .map(e => e[0] === curr ? e[1] : e[0]);
      
      for (const n of neighbors) {
        if (!seen.has(n)) {
          seen.add(n);
          queue.push(n);
        }
      }
    }
    setActive(null);
  };

  return (
    <div className="w-full h-full flex flex-col items-center p-2">
      <div className="flex-1 w-full relative">
        <svg viewBox="0 0 320 160" className="w-full h-full">
           {edges.map((e, i) => {
             const n1 = nodes.find(n => n.id === e[0])!;
             const n2 = nodes.find(n => n.id === e[1])!;
             return <line key={i} x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} stroke="#475569" strokeWidth="2" />
           })}
           {nodes.map(n => (
             <g key={n.id}>
               <circle 
                 cx={n.x} cy={n.y} r="14" 
                 fill={active === n.id ? '#eab308' : visited.has(n.id) ? '#3b82f6' : '#1e293b'} 
                 stroke="#475569" 
                 strokeWidth="2"
                 className="transition-colors duration-500"
               />
               <text x={n.x} y={n.y} dy="4" textAnchor="middle" fontSize="12" fill="white">{n.id}</text>
             </g>
           ))}
        </svg>
      </div>
      <button onClick={bfs} className="mt-2 flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-medium">
        <Play size={12} /> BFS Search
      </button>
    </div>
  );
};

export default GraphWidget;
