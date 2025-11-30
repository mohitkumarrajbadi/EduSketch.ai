import React, { useState } from 'react';
import { 
  X, Activity, GitBranch, Network, Layers, List, Binary, PlaySquare 
} from 'lucide-react';
import { VisualizerType } from '../types';

interface VisualizerLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVisualizer: (type: VisualizerType, label: string) => void;
}

const VISUALIZERS = [
  { type: 'sorting', label: 'Sorting Algo', icon: Activity, description: 'Bubble, Quick, Merge sort visualizers.', color: '#3b82f6' },
  { type: 'bst', label: 'Binary Tree', icon: GitBranch, description: 'Interactive BST with traversals.', color: '#10b981' },
  { type: 'graph', label: 'Graph Algo', icon: Network, description: 'BFS, DFS, Dijkstra visualization.', color: '#8b5cf6' },
  { type: 'stack', label: 'Stack', icon: Layers, description: 'LIFO data structure operations.', color: '#f59e0b' },
  { type: 'linkedlist', label: 'Linked List', icon: List, description: 'Node chains with pointers.', color: '#ec4899' },
];

const VisualizerLibrary: React.FC<VisualizerLibraryProps> = ({ isOpen, onClose, onSelectVisualizer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-panel border border-slate-700 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Binary size={24} className="text-amber-400" /> 
            Algorithm & Data Structures
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <p className="text-slate-400 text-sm mb-6">
            Select an interactive widget to add to your canvas. You can customize the data and play with the algorithm in real-time.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {VISUALIZERS.map((viz) => (
              <button
                key={viz.type}
                onClick={() => {
                  onSelectVisualizer(viz.type as VisualizerType, viz.label);
                  onClose();
                }}
                className="flex items-start gap-4 p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:border-amber-500/50 transition-all group text-left"
              >
                <div 
                  className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl shadow-lg group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: viz.color + '20', color: viz.color }}
                >
                  <viz.icon size={28} />
                </div>
                <div>
                   <h3 className="text-white font-semibold mb-1 group-hover:text-amber-400 transition-colors">{viz.label}</h3>
                   <p className="text-xs text-slate-400 leading-relaxed">{viz.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-slate-900/50 border-t border-slate-700 text-center">
           <span className="text-xs text-slate-500">More algorithms coming soon...</span>
        </div>
      </div>
    </div>
  );
};

export default VisualizerLibrary;
