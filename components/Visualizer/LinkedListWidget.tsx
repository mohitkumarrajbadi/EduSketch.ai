import React, { useState } from 'react';
import { ArrowRight, Plus, Trash2, Play } from 'lucide-react';

type Node = { id: string; value: string; next: string | null };

const LinkedListWidget: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([
    { id: '1', value: '10', next: '2' },
    { id: '2', value: '20', next: '3' },
    { id: '3', value: '30', next: null }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [highlight, setHighlight] = useState<string | null>(null);

  const append = () => {
    if(!inputValue) return;
    const newId = Date.now().toString();
    const newNode = { id: newId, value: inputValue, next: null };
    
    if (nodes.length === 0) {
      setNodes([newNode]);
    } else {
      const newNodes = [...nodes];
      // Find current tail (logically last element in array for simplicity of this widget)
      if (newNodes.length > 0) {
        newNodes[newNodes.length - 1].next = newId;
      }
      newNodes.push(newNode);
      setNodes(newNodes);
    }
    setInputValue('');
  };

  const removeLast = () => {
    if (nodes.length === 0) return;
    if (nodes.length === 1) {
      setNodes([]);
      return;
    }
    const newNodes = [...nodes];
    newNodes.pop(); // Remove last
    if (newNodes.length > 0) {
        newNodes[newNodes.length - 1].next = null;
    }
    setNodes(newNodes);
  };

  const traverse = async () => {
    if (nodes.length === 0) return;
    for (const node of nodes) {
      setHighlight(node.id);
      await new Promise(r => setTimeout(r, 600));
    }
    setHighlight(null);
  };

  return (
    <div className="w-full h-full flex flex-col p-4 items-center overflow-hidden">
      <div className="flex-1 w-full flex items-center justify-start overflow-x-auto no-scrollbar gap-2 px-2 scroll-smooth">
        {nodes.map((node, index) => (
          <React.Fragment key={node.id}>
            <div className={`
              w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center font-bold text-xs md:text-sm shadow-lg transition-all duration-300 flex-shrink-0
              ${highlight === node.id 
                ? 'bg-pink-500 border-pink-300 scale-110 text-white' 
                : 'bg-slate-800 border-pink-500/50 text-white'}
            `}>
              {node.value}
            </div>
            {index < nodes.length - 1 && (
              <ArrowRight className="text-slate-500 flex-shrink-0" size={16} />
            )}
            {index === nodes.length - 1 && (
               <div className="flex items-center gap-1 text-slate-600 flex-shrink-0">
                  <ArrowRight size={16} />
                  <span className="text-[10px] font-mono border border-slate-700 p-0.5 rounded">NULL</span>
               </div>
            )}
          </React.Fragment>
        ))}
        {nodes.length === 0 && <span className="text-slate-500 text-sm w-full text-center">List is Empty</span>}
      </div>

      <div className="w-full flex gap-2 mt-2 pt-2 border-t border-slate-700/50">
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Val"
          className="w-16 bg-slate-800 border border-slate-600 rounded px-2 text-xs text-white focus:outline-none focus:border-pink-500"
          onKeyDown={(e) => e.key === 'Enter' && append()}
        />
        <button onClick={append} className="px-3 py-1 bg-pink-600 hover:bg-pink-500 text-white rounded text-xs flex items-center gap-1">
          <Plus size={12} />
        </button>
        <button onClick={removeLast} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs flex items-center gap-1">
          <Trash2 size={12} />
        </button>
        <button onClick={traverse} className="ml-auto px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs flex items-center gap-1">
          <Play size={12} /> Run
        </button>
      </div>
    </div>
  );
};

export default LinkedListWidget;
