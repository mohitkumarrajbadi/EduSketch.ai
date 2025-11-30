import React, { useState } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { generateTeachingContent, generateDiagramFromText } from '../../services/gemini';
import { ChatMessage, DiagramNode, DiagramEdge } from '../../types';

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDiagram: (nodes: DiagramNode[], edges: DiagramEdge[]) => void;
}

const AIPanel: React.FC<AIPanelProps> = ({ isOpen, onClose, onAddDiagram }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Hi! I\'m your Teaching Assistant. I can explain concepts or generate diagrams for you. Try "Create a flowchart for login"!' }
  ]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const lowerInput = userMsg.text.toLowerCase();

    // Heuristic to detect diagram request
    if (lowerInput.includes('diagram') || lowerInput.includes('chart') || lowerInput.includes('flow') || lowerInput.includes('system')) {
      const diagramData = await generateDiagramFromText(userMsg.text);
      if (diagramData) {
        onAddDiagram(diagramData.nodes, diagramData.edges);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'I\'ve added the diagram to your canvas!' }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Sorry, I couldn\'t generate that diagram.' }]);
      }
    } else {
      // Standard explanation
      const response = await generateTeachingContent(userMsg.text);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: response }]);
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed right-6 top-6 bottom-24 w-80 bg-panel border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-40 overflow-hidden animate-slide-in-right">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center gap-2 text-purple-400 font-semibold">
          <Sparkles size={18} />
          <span>Gemini Assistant</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X size={18} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-accent text-white rounded-br-none' 
                : 'bg-slate-700 text-slate-100 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-slate-700 p-3 rounded-2xl rounded-bl-none flex gap-1">
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
             </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-900/50 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything or request a diagram..."
            className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2 bg-accent rounded-xl text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIPanel;
