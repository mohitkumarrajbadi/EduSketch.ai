import React from 'react';
import { X, Grid, LayoutGrid, Square, Moon, Sun } from 'lucide-react';
import { AppTheme } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

export const themes: Record<string, AppTheme> = {
  dark: {
    background: '#0f172a', // Slate 900
    gridColor: '#475569',
    gridType: 'dots',
    nodeColor: '#1e293b',
    textColor: '#ffffff'
  },
  midnight: {
    background: '#020617', // Slate 950
    gridColor: '#1e293b',
    gridType: 'lines',
    nodeColor: '#0f172a',
    textColor: '#e2e8f0'
  },
  blueprint: {
    background: '#1e3a8a', // Blue 900
    gridColor: '#3b82f6', // Blue 500
    gridType: 'lines',
    nodeColor: '#172554',
    textColor: '#ffffff'
  },
  paper: {
    background: '#f8fafc', // Slate 50
    gridColor: '#cbd5e1',
    gridType: 'dots',
    nodeColor: '#ffffff',
    textColor: '#0f172a'
  }
};

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, currentTheme, setTheme }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-panel border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Canvas Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Background Theme Section */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">Theme</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setTheme(themes.dark)}
                className={`p-3 rounded-lg border flex items-center gap-2 ${currentTheme.background === themes.dark.background ? 'border-accent bg-accent/10 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                <div className="w-4 h-4 rounded-full bg-slate-900 border border-slate-600"></div>
                Dark
              </button>
              <button 
                onClick={() => setTheme(themes.paper)}
                className={`p-3 rounded-lg border flex items-center gap-2 ${currentTheme.background === themes.paper.background ? 'border-accent bg-accent/10 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                <div className="w-4 h-4 rounded-full bg-slate-50 border border-slate-300"></div>
                Light
              </button>
              <button 
                onClick={() => setTheme(themes.blueprint)}
                className={`p-3 rounded-lg border flex items-center gap-2 ${currentTheme.background === themes.blueprint.background ? 'border-accent bg-accent/10 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                <div className="w-4 h-4 rounded-full bg-blue-900 border border-blue-500"></div>
                Blueprint
              </button>
              <button 
                onClick={() => setTheme(themes.midnight)}
                className={`p-3 rounded-lg border flex items-center gap-2 ${currentTheme.background === themes.midnight.background ? 'border-accent bg-accent/10 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                <div className="w-4 h-4 rounded-full bg-slate-950 border border-slate-800"></div>
                Midnight
              </button>
            </div>
          </div>

          {/* Grid Type Section */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">Grid Style</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setTheme({...currentTheme, gridType: 'dots'})}
                className={`flex-1 p-2 rounded-lg border flex justify-center ${currentTheme.gridType === 'dots' ? 'border-accent bg-accent/10 text-accent' : 'border-slate-700 text-slate-500 hover:bg-slate-700'}`}
                title="Dots"
              >
                <Grid size={18} />
              </button>
              <button 
                onClick={() => setTheme({...currentTheme, gridType: 'lines'})}
                className={`flex-1 p-2 rounded-lg border flex justify-center ${currentTheme.gridType === 'lines' ? 'border-accent bg-accent/10 text-accent' : 'border-slate-700 text-slate-500 hover:bg-slate-700'}`}
                title="Lines"
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setTheme({...currentTheme, gridType: 'none'})}
                className={`flex-1 p-2 rounded-lg border flex justify-center ${currentTheme.gridType === 'none' ? 'border-accent bg-accent/10 text-accent' : 'border-slate-700 text-slate-500 hover:bg-slate-700'}`}
                title="None"
              >
                <Square size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
