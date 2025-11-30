import React, { useState } from 'react';
import SortingWidget from './SortingWidget';
import TreeWidget from './TreeWidget';
import GraphWidget from './GraphWidget';
import StackWidget from './StackWidget';
import LinkedListWidget from './LinkedListWidget';
import { Activity, Network, GitBranch, Layers, List } from 'lucide-react';
import { VisualizerType } from '../../types';

interface VisualizerContainerProps {
  data: any;
}

const VisualizerContainer: React.FC<VisualizerContainerProps> = ({ data }) => {
  // Use data.type as initial if provided
  const [type, setType] = useState<VisualizerType>(data?.type || 'sorting');

  return (
    <div className="w-full h-full flex flex-col bg-slate-900/90 rounded-lg backdrop-blur-sm border border-slate-700 overflow-hidden">
      {/* Header / Switcher - Scrollable for many types */}
      <div className="flex border-b border-slate-700 bg-slate-800/50 overflow-x-auto no-scrollbar">
        <button onClick={() => setType('sorting')} className={`flex-shrink-0 px-3 py-1.5 text-[10px] flex items-center gap-1 transition-colors ${type === 'sorting' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
          <Activity size={10} /> Sort
        </button>
        <button onClick={() => setType('bst')} className={`flex-shrink-0 px-3 py-1.5 text-[10px] flex items-center gap-1 transition-colors ${type === 'bst' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
          <GitBranch size={10} /> Tree
        </button>
        <button onClick={() => setType('graph')} className={`flex-shrink-0 px-3 py-1.5 text-[10px] flex items-center gap-1 transition-colors ${type === 'graph' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
          <Network size={10} /> Graph
        </button>
        <button onClick={() => setType('stack')} className={`flex-shrink-0 px-3 py-1.5 text-[10px] flex items-center gap-1 transition-colors ${type === 'stack' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
          <Layers size={10} /> Stack
        </button>
        <button onClick={() => setType('linkedlist')} className={`flex-shrink-0 px-3 py-1.5 text-[10px] flex items-center gap-1 transition-colors ${type === 'linkedlist' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
          <List size={10} /> List
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {type === 'sorting' && <SortingWidget data={data?.array} />}
        {type === 'bst' && <TreeWidget />}
        {type === 'graph' && <GraphWidget />}
        {type === 'stack' && <StackWidget />}
        {type === 'linkedlist' && <LinkedListWidget />}
      </div>
    </div>
  );
};

export default VisualizerContainer;
