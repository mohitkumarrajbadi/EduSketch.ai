import React, { useState } from 'react';
import SortingWidget from './SortingWidget';
import TreeWidget from './TreeWidget';
import GraphWidget from './GraphWidget';
import { Activity, Network, GitBranch } from 'lucide-react';

interface VisualizerContainerProps {
  data: any;
}

const VisualizerContainer: React.FC<VisualizerContainerProps> = ({ data }) => {
  const [type, setType] = useState<'sorting' | 'bst' | 'graph'>('sorting');

  return (
    <div className="w-full h-full flex flex-col bg-slate-900/90 rounded-lg backdrop-blur-sm border border-slate-700 overflow-hidden">
      {/* Header / Switcher */}
      <div className="flex border-b border-slate-700 bg-slate-800/50">
        <button 
          onClick={() => setType('sorting')}
          className={`flex-1 py-1 text-[10px] flex items-center justify-center gap-1 ${type === 'sorting' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Activity size={10} /> Sort
        </button>
        <button 
          onClick={() => setType('bst')}
          className={`flex-1 py-1 text-[10px] flex items-center justify-center gap-1 ${type === 'bst' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <GitBranch size={10} /> Tree
        </button>
        <button 
          onClick={() => setType('graph')}
          className={`flex-1 py-1 text-[10px] flex items-center justify-center gap-1 ${type === 'graph' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Network size={10} /> Graph
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {type === 'sorting' && <SortingWidget data={data?.array} />}
        {type === 'bst' && <TreeWidget />}
        {type === 'graph' && <GraphWidget />}
      </div>
    </div>
  );
};

export default VisualizerContainer;
