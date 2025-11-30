import React from 'react';
import { 
  Pencil, 
  Eraser, 
  Square, 
  Circle,
  Diamond,
  Database,
  Cloud,
  User,
  MousePointer2, 
  Hand,
  Sparkles, 
  Network, // Connection tool
  Share2,
  Settings
} from 'lucide-react';
import { ToolType } from '../types';

interface ToolbarProps {
  currentTool: ToolType;
  setTool: (t: ToolType) => void;
  onAIModalOpen: () => void;
  onSyncOpen: () => void;
  onSettingsOpen: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ currentTool, setTool, onAIModalOpen, onSyncOpen, onSettingsOpen }) => {
  const tools = [
    { type: ToolType.SELECT, icon: <MousePointer2 size={20} />, label: 'Select (V)' },
    { type: ToolType.PAN, icon: <Hand size={20} />, label: 'Pan (Space)' },
    { type: ToolType.PEN, icon: <Pencil size={20} />, label: 'Pen (P)' },
    { type: ToolType.ERASER, icon: <Eraser size={20} />, label: 'Eraser (E)' },
    { type: ToolType.CONNECT, icon: <Network size={20} />, label: 'Connect (C)' },
  ];

  const shapes = [
    { type: ToolType.RECTANGLE, icon: <Square size={20} />, label: 'Rectangle' },
    { type: ToolType.CIRCLE, icon: <Circle size={20} />, label: 'Circle' },
    { type: ToolType.DIAMOND, icon: <Diamond size={20} />, label: 'Decision' },
    { type: ToolType.CYLINDER, icon: <Database size={20} />, label: 'Database' },
    { type: ToolType.CLOUD, icon: <Cloud size={20} />, label: 'Cloud' },
    { type: ToolType.ACTOR, icon: <User size={20} />, label: 'Actor' },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-panel border border-slate-700 rounded-2xl shadow-2xl flex items-center p-2 gap-2 z-50 overflow-x-auto max-w-[90vw]">
      
      {/* Primary Tools */}
      <div className="flex gap-1">
        {tools.map((t) => (
          <button
            key={t.type}
            onClick={() => setTool(t.type)}
            className={`p-3 rounded-xl transition-all duration-200 ${
              currentTool === t.type 
                ? 'bg-accent text-white shadow-lg scale-110' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title={t.label}
          >
            {t.icon}
          </button>
        ))}
      </div>

      <div className="w-px h-8 bg-slate-700 mx-1 flex-shrink-0" />

      {/* Shapes */}
      <div className="flex gap-1">
        {shapes.map((t) => (
          <button
            key={t.type}
            onClick={() => setTool(t.type)}
            className={`p-3 rounded-xl transition-all duration-200 ${
              currentTool === t.type 
                ? 'bg-accent text-white shadow-lg scale-110' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title={t.label}
          >
            {t.icon}
          </button>
        ))}
      </div>

      <div className="w-px h-8 bg-slate-700 mx-1 flex-shrink-0" />

      {/* Actions */}
      <div className="flex gap-1">
        <button
          onClick={onAIModalOpen}
          className="p-3 rounded-xl text-purple-400 hover:text-white hover:bg-purple-900/50 transition-all"
          title="AI Assistant"
        >
          <Sparkles size={20} />
        </button>

        <button
          onClick={onSyncOpen}
          className="p-3 rounded-xl text-emerald-400 hover:text-white hover:bg-emerald-900/50 transition-all"
          title="Connect iPad"
        >
          <Share2 size={20} />
        </button>

        <button
          onClick={onSettingsOpen}
          className="p-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          title="Settings & Themes"
        >
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;