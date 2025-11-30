import React, { useEffect, useRef, useState } from 'react';
import { Tablet, QrCode, X, Copy, Check, ArrowRight, Wifi } from 'lucide-react';

declare const QRCode: any; // Global from script

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  peerId: string;
  onJoinSession: (id: string) => void;
}

const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, peerId, onJoinSession }) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'host' | 'join'>('host');
  const [manualId, setManualId] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && peerId && activeTab === 'host' && qrRef.current) {
      qrRef.current.innerHTML = '';
      // Generate URL with session ID for auto-join if we were hosting a real site
      // For now, we just encode the ID or a dummy URL
      const url = `${window.location.origin}?session=${peerId}`;
      new QRCode(qrRef.current, {
        text: url,
        width: 180,
        height: 180,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : 2 // High error correction
      });
    }
  }, [isOpen, peerId, activeTab]);

  const copyId = () => {
    navigator.clipboard.writeText(peerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = () => {
    if (manualId.trim()) {
      onJoinSession(manualId.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-panel border border-slate-700 rounded-3xl p-0 max-w-md w-full relative shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header Tabs */}
        <div className="flex border-b border-slate-700">
          <button 
            onClick={() => setActiveTab('host')}
            className={`flex-1 p-4 text-sm font-semibold transition-colors ${activeTab === 'host' ? 'bg-slate-800 text-white border-b-2 border-accent' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Host Session
          </button>
          <button 
            onClick={() => setActiveTab('join')}
            className={`flex-1 p-4 text-sm font-semibold transition-colors ${activeTab === 'join' ? 'bg-slate-800 text-white border-b-2 border-accent' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Join Session
          </button>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white z-10 bg-black/20 rounded-full p-1"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-8">
          
          {activeTab === 'host' ? (
            <div className="flex flex-col items-center text-center">
              <h2 className="text-xl font-bold text-white mb-2">Connect iPad or Tablet</h2>
              <p className="text-slate-400 text-sm mb-6">
                Scan the QR code below or enter the Session ID on your other device to start real-time syncing.
              </p>

              <div className="bg-white p-4 rounded-xl mb-6 shadow-inner relative group">
                 <div ref={qrRef} className="mix-blend-normal" />
                 {!peerId && (
                   <div className="absolute inset-0 flex items-center justify-center bg-white/90 text-black font-mono text-xs">
                     Generating ID...
                   </div>
                 )}
              </div>

              <div className="w-full bg-slate-900 rounded-xl p-3 border border-slate-700 flex items-center justify-between gap-3">
                 <div className="flex flex-col items-start overflow-hidden">
                   <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Session ID</span>
                   <span className="text-accent font-mono text-sm truncate w-full text-left">{peerId || '...'}</span>
                 </div>
                 <button 
                   onClick={copyId}
                   className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                   title="Copy ID"
                 >
                   {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                 </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6 text-accent">
                <Wifi size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Join Existing Session</h2>
              <p className="text-slate-400 text-sm mb-8">
                Enter the Session ID displayed on the host device to connect.
              </p>

              <div className="w-full space-y-4">
                <div className="text-left">
                  <label className="text-xs text-slate-500 font-bold ml-1 mb-1 block">SESSION ID</label>
                  <input
                    type="text"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    placeholder="e.g. 123-abc-456"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-accent"
                  />
                </div>
                
                <button
                  onClick={handleJoin}
                  disabled={!manualId.trim()}
                  className="w-full py-3 bg-accent hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  Connect <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SyncModal;