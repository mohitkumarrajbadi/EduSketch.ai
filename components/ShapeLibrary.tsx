import React, { useState } from 'react';
import { 
  Search, Database, Server, Layers, Box, Globe, Shield, Smartphone, Monitor, 
  Cpu, HardDrive, Network, Lock, MessageSquare, Cloud, Shuffle, Layout, 
  Container, Zap, Radio, Archive, FileText, X
} from 'lucide-react';
import { NodeType, AppTheme } from '../types';

interface ShapeLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectShape: (type: NodeType, label: string, color: string) => void;
  theme: AppTheme;
}

const SHAPES = [
  { type: 'redis', label: 'Redis', icon: Database, color: '#ef4444', category: 'Database' },
  { type: 'cylinder', label: 'Postgres', icon: Database, color: '#3b82f6', category: 'Database' },
  { type: 'storage', label: 'S3 Bucket', icon: HardDrive, color: '#eab308', category: 'Storage' },
  { type: 'kafka', label: 'Kafka', icon: Layers, color: '#14b8a6', category: 'Messaging' },
  { type: 'queue', label: 'RabbitMQ', icon: MessageSquare, color: '#f97316', category: 'Messaging' },
  { type: 'server', label: 'Server', icon: Server, color: '#64748b', category: 'Compute' },
  { type: 'k8s', label: 'K8s', icon: Network, color: '#3b82f6', category: 'Compute' },
  { type: 'docker', label: 'Docker', icon: Container, color: '#0ea5e9', category: 'Compute' },
  { type: 'loadbalancer', label: 'Load Balancer', icon: Shuffle, color: '#8b5cf6', category: 'Network' },
  { type: 'firewall', label: 'Firewall', icon: Shield, color: '#f43f5e', category: 'Network' },
  { type: 'api', label: 'API Gateway', icon: Zap, color: '#eab308', category: 'Network' },
  { type: 'cloud', label: 'Cloud', icon: Cloud, color: '#94a3b8', category: 'Network' },
  { type: 'mobile', label: 'Mobile App', icon: Smartphone, color: '#a855f7', category: 'Client' },
  { type: 'browser', label: 'Web Client', icon: Monitor, color: '#10b981', category: 'Client' },
  { type: 'actor', label: 'User', icon: Globe, color: '#cbd5e1', category: 'Client' },
];

const ShapeLibrary: React.FC<ShapeLibraryProps> = ({ isOpen, onClose, onSelectShape, theme }) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredShapes = SHAPES.filter(s => 
    s.label.toLowerCase().includes(search.toLowerCase()) || 
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-panel border border-slate-700 rounded-2xl w-full max-w-2xl h-[70vh] flex flex-col shadow-2xl animate-fade-in">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layout size={20} className="text-accent" /> System Design Library
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-700 bg-slate-900/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Redis, Kafka, Load Balancer..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-accent"
              autoFocus
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {filteredShapes.map((shape) => (
              <button
                key={shape.label}
                onClick={() => {
                  onSelectShape(shape.type as NodeType, shape.label, shape.color);
                  onClose();
                }}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:border-accent hover:scale-105 transition-all group"
              >
                <div 
                  className="w-10 h-10 flex items-center justify-center rounded-lg mb-2 shadow-lg"
                  style={{ backgroundColor: shape.color + '20', color: shape.color }}
                >
                  <shape.icon size={24} />
                </div>
                <span className="text-xs text-slate-300 group-hover:text-white font-medium">{shape.label}</span>
              </button>
            ))}
          </div>
          
          {filteredShapes.length === 0 && (
            <div className="text-center text-slate-500 mt-10">
              No shapes found for "{search}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShapeLibrary;
