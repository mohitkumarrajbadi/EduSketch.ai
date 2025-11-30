import React, { useState, useRef, useEffect } from 'react';
import { 
  ToolType, 
  Point, 
  Stroke, 
  DiagramNode, 
  DiagramEdge,
  AppTheme,
  SyncMessage,
  NodeType,
  EdgeAnimation
} from './types';
import Toolbar from './components/Toolbar';
import AIPanel from './components/Sidebar/AIPanel';
import SyncModal from './components/SyncModal';
import VisualizerContainer from './components/Visualizer/VisualizerContainer';
import SettingsPanel, { themes } from './components/SettingsPanel';
import ShapeLibrary from './components/ShapeLibrary';
import { 
  Database, Cloud, User, Trash2, Scaling, Server, Layers, Box, Shuffle, 
  Shield, Smartphone, Monitor, HardDrive, Network as NetworkIcon, Container,
  Zap, ArrowRight, ZapOff, Activity, MoveRight, Radio, GripHorizontal
} from 'lucide-react';

// Declare PeerJS global
declare const Peer: any;

function App() {
  // --- STATE ---
  const [tool, setTool] = useState<ToolType>(ToolType.PAN); // DEFAULT TO PAN (HAND)
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [nodes, setNodes] = useState<DiagramNode[]>([]);
  const [edges, setEdges] = useState<DiagramEdge[]>([]);
  
  // Transform State (Zoom & Pan)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  
  // UI State
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShapeLibOpen, setIsShapeLibOpen] = useState(false);
  
  // Interaction State
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [resizingNodeId, setResizingNodeId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  
  const [lastMousePos, setLastMousePos] = useState<Point>({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  const [tempConnectionEnd, setTempConnectionEnd] = useState<Point | null>(null);

  // Theme State
  const [theme, setTheme] = useState<AppTheme>(themes.dark);

  // P2P State
  const [peerId, setPeerId] = useState<string>('');
  const [connections, setConnections] = useState<any[]>([]);
  const peerRef = useRef<any>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- P2P SETUP ---
  useEffect(() => {
    // Initialize Peer
    const peer = new Peer(); 
    peerRef.current = peer;

    peer.on('open', (id: string) => {
      setPeerId(id);
      const params = new URLSearchParams(window.location.search);
      const sessionToJoin = params.get('session');
      if (sessionToJoin) {
        connectToPeer(sessionToJoin);
        window.history.replaceState({}, document.title, "/");
        setIsSyncOpen(true);
      }
    });

    peer.on('connection', (conn: any) => {
      setupConnection(conn);
    });

    return () => {
      peer.destroy();
    };
  }, []);

  const setupConnection = (conn: any) => {
    conn.on('open', () => {
      setConnections(prev => [...prev, conn]);
      if (strokes.length > 0 || nodes.length > 0) {
        const syncMsg: SyncMessage = {
          type: 'SYNC_FULL',
          payload: { strokes, nodes, edges }
        };
        conn.send(syncMsg);
      }
    });

    conn.on('data', (data: SyncMessage) => {
      handleSyncMessage(data);
    });

    conn.on('close', () => {
      setConnections(prev => prev.filter(c => c !== conn));
    });
  };

  const connectToPeer = (remoteId: string) => {
    if (!peerRef.current) return;
    const conn = peerRef.current.connect(remoteId);
    setupConnection(conn);
  };

  const broadcast = (msg: SyncMessage) => {
    connections.forEach(conn => conn.send(msg));
  };

  const handleSyncMessage = (msg: SyncMessage) => {
    switch (msg.type) {
      case 'SYNC_FULL':
        setStrokes(msg.payload.strokes);
        setNodes(msg.payload.nodes);
        setEdges(msg.payload.edges);
        break;
      case 'ADD_STROKE':
        setStrokes(prev => {
          if (prev.find(s => s.id === msg.payload.id)) return prev;
          return [...prev, msg.payload];
        });
        break;
      case 'DELETE_STROKE':
        setStrokes(prev => prev.filter(s => s.id !== msg.payload));
        break;
      case 'UPDATE_NODES':
        setNodes(msg.payload);
        break;
      case 'UPDATE_EDGES':
        setEdges(msg.payload);
        break;
    }
  };

  const updateNodes = (newNodes: DiagramNode[]) => {
    setNodes(newNodes);
    broadcast({ type: 'UPDATE_NODES', payload: newNodes });
  };

  const updateEdges = (newEdges: DiagramEdge[]) => {
    setEdges(newEdges);
    broadcast({ type: 'UPDATE_EDGES', payload: newEdges });
  };

  // --- HELPERS ---
  const toWorld = (screenX: number, screenY: number): Point => {
    return {
      x: (screenX - transform.x) / transform.k,
      y: (screenY - transform.y) / transform.k
    };
  };

  const getScreenPoint = (e: React.MouseEvent | React.TouchEvent | WheelEvent): Point => {
    const clientX = 'touches' in e ? (e as any).touches[0].clientX : (e as any).clientX;
    const clientY = 'touches' in e ? (e as any).touches[0].clientY : (e as any).clientY;
    return { x: clientX, y: clientY };
  };

  // --- EVENT HANDLERS ---
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const zoomIntensity = 0.1;
      const delta = -Math.sign(e.deltaY);
      const scaleBy = 1 + zoomIntensity * delta;
      const oldK = transform.k;
      const newK = Math.min(Math.max(oldK * scaleBy, 0.1), 5); 
      const mouse = getScreenPoint(e);
      const mouseWorld = toWorld(mouse.x, mouse.y);
      const newX = mouse.x - mouseWorld.x * newK;
      const newY = mouse.y - mouseWorld.y * newK;
      setTransform({ x: newX, y: newY, k: newK });
    } else {
      setTransform(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => container?.removeEventListener('wheel', handleWheel);
  }, [transform]); 

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const screen = getScreenPoint(e);
    const world = toWorld(screen.x, screen.y);
    const target = e.target as HTMLElement;

    if (target.id === 'canvas-container' || target.tagName === 'CANVAS' || target.tagName === 'SVG') {
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    }

    if (tool === ToolType.PAN || (e as React.MouseEvent).button === 1) {
      setIsPanning(true);
      setLastMousePos(screen);
      return;
    }

    const isShapeTool = [
      ToolType.RECTANGLE, ToolType.CIRCLE, ToolType.DIAMOND, 
      ToolType.CYLINDER, ToolType.CLOUD, ToolType.ACTOR
    ].includes(tool);

    if (isShapeTool) {
      let type: NodeType = 'rect';
      if (tool === ToolType.CIRCLE) type = 'circle';
      if (tool === ToolType.DIAMOND) type = 'diamond';
      if (tool === ToolType.CYLINDER) type = 'cylinder';
      if (tool === ToolType.CLOUD) type = 'cloud';
      if (tool === ToolType.ACTOR) type = 'actor';

      const newNode: DiagramNode = {
        id: `node-${Date.now()}`,
        type,
        x: world.x - 70,
        y: world.y - 30,
        width: 140,
        height: 60,
        label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        color: theme.nodeColor
      };
      
      if (type === 'actor') { newNode.width = 60; newNode.height = 90; newNode.x = world.x - 30; }
      if (['circle', 'diamond', 'cloud'].includes(type)) { newNode.height = 80; newNode.width = 120; }

      updateNodes([...nodes, newNode]);
      setTool(ToolType.SELECT);
      return;
    }

    if (tool === ToolType.PEN && !target.closest('.diagram-node')) {
      setCurrentStroke({
        id: Date.now().toString(),
        points: [world],
        color: theme.textColor,
        width: 3 / transform.k, 
        type: 'pen'
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const screen = getScreenPoint(e);
    const world = toWorld(screen.x, screen.y);

    if (isPanning) {
      const deltaX = screen.x - lastMousePos.x;
      const deltaY = screen.y - lastMousePos.y;
      setTransform(prev => ({ ...prev, x: prev.x + deltaX, y: prev.y + deltaY }));
      setLastMousePos(screen);
    } 
    else if (resizingNodeId) {
      const node = nodes.find(n => n.id === resizingNodeId);
      if (node) {
        const newWidth = Math.max(40, world.x - node.x);
        const newHeight = Math.max(40, world.y - node.y);
        setNodes(prev => prev.map(n => n.id === resizingNodeId ? { ...n, width: newWidth, height: newHeight } : n));
      }
    }
    else if (tool === ToolType.ERASER && (e as React.MouseEvent).buttons === 1) {
      const toDelete: string[] = [];
      strokes.forEach(stroke => {
         const threshold = 20 / transform.k;
         if (stroke.points.some(p => Math.hypot(p.x - world.x, p.y - world.y) < threshold)) {
             toDelete.push(stroke.id);
         }
      });
      if (toDelete.length > 0) {
        const remaining = strokes.filter(s => !toDelete.includes(s.id));
        setStrokes(remaining); // Sync handled in mouse up usually, or here if immediate
        // For smoother eraser, we can wait for mouse up to sync or sync often.
      }
    }
    else if (currentStroke) {
      setCurrentStroke(prev => prev ? { ...prev, points: [...prev.points, world] } : null);
    } 
    else if (draggedNodeId) {
      setNodes(prev => prev.map(n => n.id === draggedNodeId ? { ...n, x: world.x - dragOffset.x, y: world.y - dragOffset.y } : n));
    } 
    else if (connectingNodeId) {
      setTempConnectionEnd(world);
    }
  };

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (currentStroke) {
      setStrokes(prev => [...prev, currentStroke]);
      broadcast({ type: 'ADD_STROKE', payload: currentStroke });
      setCurrentStroke(null);
    }
    if (draggedNodeId || resizingNodeId) {
      updateNodes(nodes);
    }
    setDraggedNodeId(null);
    setResizingNodeId(null);
    setConnectingNodeId(null);
    setTempConnectionEnd(null);
  };

  const handleInsertShape = (type: NodeType, label: string, color: string) => {
    const centerWorld = toWorld(window.innerWidth/2, window.innerHeight/2);
    const newNode: DiagramNode = {
      id: `node-${Date.now()}`,
      type,
      x: centerWorld.x - 60,
      y: centerWorld.y - 30,
      width: 120,
      height: 80,
      label,
      color: color === '#1e293b' ? theme.nodeColor : color, 
      data: {}
    };
    // Special sizing
    if (['server', 'loadbalancer', 'redis'].includes(type)) { newNode.width = 100; newNode.height = 100; }
    updateNodes([...nodes, newNode]);
    setTool(ToolType.SELECT);
  };

  const handleEdgeClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedEdgeId(id);
    setSelectedNodeId(null);
  };

  const changeEdgeAnimation = (anim: EdgeAnimation) => {
    if (selectedEdgeId) {
       const newEdges = edges.map(edge => edge.id === selectedEdgeId ? { ...edge, animation: anim } : edge);
       updateEdges(newEdges);
    }
  };

  const changeEdgeStyle = (style: 'solid' | 'dashed' | 'dotted') => {
    if (selectedEdgeId) {
       const newEdges = edges.map(edge => edge.id === selectedEdgeId ? { ...edge, style: style } : edge);
       updateEdges(newEdges);
    }
  };

  // --- RENDERING ICONS ---
  const renderNodeIcon = (node: DiagramNode) => {
    const size = 32;
    const style = { color: node.color === 'transparent' ? theme.textColor : '#fff', opacity: 0.9 };
    
    switch (node.type) {
      case 'redis': return <Database size={size} style={{ color: '#ef4444' }} />;
      case 'kafka': return <Layers size={size} style={{ color: '#14b8a6' }} />;
      case 'server': return <Server size={size} style={{ color: '#64748b' }} />;
      case 'loadbalancer': return <Shuffle size={size} style={{ color: '#8b5cf6' }} />;
      case 'storage': return <HardDrive size={size} style={{ color: '#eab308' }} />;
      case 'cloud': return <Cloud size={size} style={{ color: '#94a3b8' }} />;
      case 'k8s': return <NetworkIcon size={size} style={{ color: '#3b82f6' }} />;
      case 'docker': return <Container size={size} style={{ color: '#0ea5e9' }} />;
      case 'firewall': return <Shield size={size} style={{ color: '#f43f5e' }} />;
      case 'mobile': return <Smartphone size={size} style={{ color: '#a855f7' }} />;
      case 'browser': return <Monitor size={size} style={{ color: '#10b981' }} />;
      case 'api': return <Zap size={size} style={{ color: '#eab308' }} />;
      case 'queue': return <Box size={size} style={{ color: '#f97316' }} />;
      case 'actor': return <User size={size} style={style} />;
      case 'cylinder': return <Database size={size} style={style} />;
      default: return null;
    }
  };

  // --- CANVAS DRAWING ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    strokes.forEach(stroke => {
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      if (stroke.points.length > 0) {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        stroke.points.forEach(p => ctx.lineTo(p.x, p.y));
      }
      ctx.stroke();
    });

    if (currentStroke) {
      ctx.beginPath();
      ctx.strokeStyle = currentStroke.color;
      ctx.lineWidth = currentStroke.width;
      if (currentStroke.points.length > 0) {
        ctx.moveTo(currentStroke.points[0].x, currentStroke.points[0].y);
        currentStroke.points.forEach(p => ctx.lineTo(p.x, p.y));
      }
      ctx.stroke();
    }
    ctx.restore();
  }, [strokes, currentStroke, transform, theme]);

  // SVG EDGES
  const renderEdges = () => {
    return (
      <svg className="absolute inset-0 overflow-visible pointer-events-none z-10">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={theme.gridColor} />
          </marker>
        </defs>
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {edges.map(edge => {
            const from = nodes.find(n => n.id === edge.from);
            const to = nodes.find(n => n.id === edge.to);
            if (!from || !to) return null;

            // Simple center-to-center for now
            const x1 = from.x + from.width/2; 
            const y1 = from.y + from.height/2;
            const x2 = to.x + to.width/2; 
            const y2 = to.y + to.height/2;

            const animClass = 
              edge.animation === 'traffic' ? 'animate-traffic' :
              edge.animation === 'pulse' ? 'animate-pulse' :
              edge.animation === 'signal' ? 'animate-signal' :
              edge.animation === 'reverse' ? 'animate-reverse' :
              (edge.animation === 'flow') ? 'animate-flow' : '';

            const dashArray = 
               edge.style === 'dotted' ? '2,4' : 
               edge.style === 'dashed' ? '8,8' : 
               '0';

            return (
              <g key={edge.id} className="pointer-events-auto cursor-pointer group" onClick={(e) => handleEdgeClick(e, edge.id)}>
                 {/* Hit area */}
                 <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="15" />
                 {/* Visible line */}
                 <line 
                   x1={x1} y1={y1} x2={x2} y2={y2} 
                   stroke={selectedEdgeId === edge.id ? '#3b82f6' : theme.gridColor} 
                   strokeWidth={selectedEdgeId === edge.id ? 3 : 2}
                   strokeDasharray={animClass ? undefined : dashArray}
                   className={animClass}
                   markerEnd="url(#arrowhead)"
                 />
              </g>
            );
          })}
          {connectingNodeId && tempConnectionEnd && (
             <line 
                x1={nodes.find(n => n.id === connectingNodeId)!.x + nodes.find(n => n.id === connectingNodeId)!.width/2}
                y1={nodes.find(n => n.id === connectingNodeId)!.y + nodes.find(n => n.id === connectingNodeId)!.height/2}
                x2={tempConnectionEnd.x} y2={tempConnectionEnd.y}
                stroke={theme.gridColor} strokeWidth="2" strokeDasharray="5" opacity="0.5"
             />
          )}
        </g>
      </svg>
    );
  };

  return (
    <div 
      id="canvas-container"
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden select-none transition-colors duration-300"
      style={{ backgroundColor: theme.background, color: theme.textColor }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
    >
      <div className="absolute inset-0 pointer-events-none opacity-20" 
           style={{ 
             backgroundImage: theme.gridType === 'lines' 
               ? `linear-gradient(${theme.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${theme.gridColor} 1px, transparent 1px)` 
               : `radial-gradient(${theme.gridColor} 1px, transparent 1px)`,
             backgroundSize: `${24 * transform.k}px ${24 * transform.k}px`,
             backgroundPosition: `${transform.x}px ${transform.y}px`,
             display: theme.gridType === 'none' ? 'none' : 'block'
           }} 
      />

      {renderEdges()}
      <canvas ref={canvasRef} className="absolute inset-0 z-20 pointer-events-none" />

      {/* NODES LAYER */}
      <div className="absolute inset-0 z-30 pointer-events-none origin-top-left" 
           style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})` }}>
        {nodes.map(node => (
          <div
            key={node.id}
            onMouseDown={(e) => { e.stopPropagation(); setSelectedNodeId(node.id); setSelectedEdgeId(null); if(tool === ToolType.CONNECT) { setConnectingNodeId(node.id); setTempConnectionEnd(toWorld(e.clientX, e.clientY)); } else if (tool === ToolType.SELECT) { setDraggedNodeId(node.id); setDragOffset({ x: toWorld(e.clientX, e.clientY).x - node.x, y: toWorld(e.clientX, e.clientY).y - node.y }); } }}
            onMouseUp={(e) => { 
                if(tool === ToolType.CONNECT && connectingNodeId && connectingNodeId !== node.id) { 
                   e.stopPropagation(); 
                   const newEdge: DiagramEdge = { id: `edge-${Date.now()}`, from: connectingNodeId, to: node.id, animation: 'flow' };
                   updateEdges([...edges, newEdge]); 
                } 
            }}
            className={`diagram-node absolute flex items-center justify-center shadow-lg border backdrop-blur-md transition-shadow group pointer-events-auto cursor-move
              ${selectedNodeId === node.id ? 'ring-2 ring-accent shadow-accent/20 z-50' : 'z-30'}
              ${node.type === 'circle' ? 'rounded-full' : 'rounded-lg'}
              ${node.type === 'diamond' ? 'rotate-45' : ''}
              ${['redis','kafka','server','loadbalancer','storage','cloud','k8s','docker'].includes(node.type) ? 'rounded-xl' : ''}
            `}
            style={{
              left: node.x, top: node.y, width: node.width, height: node.height,
              backgroundColor: node.type === 'visualizer' ? 'transparent' : (node.color !== 'transparent' ? node.color : undefined),
              borderColor: selectedNodeId === node.id ? '#3b82f6' : (theme.gridColor + '80')
            }}
          >
            {node.type === 'visualizer' ? (
              <div className="w-full h-full scale-[0.9]">
                 <VisualizerContainer data={node.data} />
              </div>
            ) : (
               <div className={`flex flex-col items-center justify-center ${node.type === 'diamond' ? '-rotate-45' : ''}`}>
                 {renderNodeIcon(node)}
                 <div className="text-xs font-medium text-center p-1 select-none pointer-events-none truncate w-full" style={{ color: theme.textColor }}>
                    {node.label}
                 </div>
               </div>
            )}
            
            {(tool === ToolType.SELECT || tool === ToolType.CONNECT) && (
              <>
                 <div className="absolute -top-1 left-1/2 w-2 h-2 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                 <div className="absolute -bottom-1 left-1/2 w-2 h-2 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            )}

            {selectedNodeId === node.id && (
               <>
                <div 
                  className={`absolute -bottom-2 -right-2 w-5 h-5 bg-accent rounded-full cursor-se-resize flex items-center justify-center z-50 shadow-md ${node.type === 'diamond' ? '-rotate-45 translate-x-3 translate-y-3' : ''}`}
                  onMouseDown={(e) => { e.stopPropagation(); setResizingNodeId(node.id); }}
                >
                  <Scaling size={10} className="text-white" />
                </div>
                 <button
                   className={`absolute -top-8 right-0 p-1.5 bg-red-500/90 text-white rounded-lg hover:bg-red-600 shadow-lg pointer-events-auto ${node.type === 'diamond' ? '-rotate-45 translate-x-6 -translate-y-6' : ''}`}
                   onClick={(e) => { e.stopPropagation(); const newNodes = nodes.filter(n => n.id !== node.id); const newEdges = edges.filter(ed => ed.from !== node.id && ed.to !== node.id); updateNodes(newNodes); updateEdges(newEdges); setSelectedNodeId(null); }}
                 >
                   <Trash2 size={12} />
                 </button>
               </>
            )}
          </div>
        ))}
      </div>

      {/* EDGE CONTROLS POPUP (When Edge Selected) */}
      {selectedEdgeId && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-panel border border-slate-700 p-2 rounded-xl shadow-xl flex gap-2 z-50 animate-fade-in pointer-events-auto">
           <div className="flex gap-1 border-r border-slate-600 pr-2">
             <button onClick={() => changeEdgeStyle('solid')} className="p-1 hover:bg-slate-700 rounded text-slate-300" title="Solid"><MoveRight size={16} /></button>
             <button onClick={() => changeEdgeStyle('dashed')} className="p-1 hover:bg-slate-700 rounded text-slate-300" title="Dashed"><GripHorizontal size={16} /></button>
             <button onClick={() => changeEdgeStyle('dotted')} className="p-1 hover:bg-slate-700 rounded text-slate-300" title="Dotted"><Radio size={16} /></button>
           </div>
           <div className="flex gap-1">
             <button onClick={() => changeEdgeAnimation('none')} className="p-1 hover:bg-slate-700 rounded text-slate-300" title="Static"><ZapOff size={16} /></button>
             <button onClick={() => changeEdgeAnimation('flow')} className="p-1 hover:bg-slate-700 rounded text-slate-300" title="Flow"><ArrowRight size={16} /></button>
             <button onClick={() => changeEdgeAnimation('traffic')} className="p-1 hover:bg-slate-700 rounded text-slate-300" title="Traffic"><Container size={16} /></button>
             <button onClick={() => changeEdgeAnimation('pulse')} className="p-1 hover:bg-slate-700 rounded text-slate-300" title="Pulse"><Activity size={16} /></button>
             <button onClick={() => changeEdgeAnimation('signal')} className="p-1 hover:bg-slate-700 rounded text-slate-300" title="Signal"><Zap size={16} /></button>
           </div>
           <button onClick={() => { updateEdges(edges.filter(e => e.id !== selectedEdgeId)); setSelectedEdgeId(null); }} className="ml-2 text-red-400 hover:bg-red-900/30 p-1 rounded"><Trash2 size={16} /></button>
        </div>
      )}

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-50 pointer-events-none">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 font-mono tracking-tight">
          EduSketch<span className="text-slate-500 text-sm font-normal">.ai</span>
        </h1>
        <div className="flex gap-2 mt-1">
          <div className="px-2 py-0.5 rounded bg-slate-800/50 text-[10px] text-slate-400 border border-slate-700">
             {Math.round(transform.k * 100)}%
          </div>
        </div>
      </div>

      <Toolbar 
        currentTool={tool} 
        setTool={setTool} 
        onAIModalOpen={() => setIsAIModalOpen(true)}
        onSyncOpen={() => setIsSyncOpen(true)}
        onSettingsOpen={() => setIsSettingsOpen(true)}
        onShapeLibraryOpen={() => setIsShapeLibOpen(true)}
      />

      <AIPanel 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        onAddDiagram={(n, e) => {
            const centerWorld = toWorld(window.innerWidth/2, window.innerHeight/2);
            const offsetN = n.map(node => ({ ...node, x: node.x + centerWorld.x - 300, y: node.y + centerWorld.y - 200, color: theme.nodeColor }));
            updateNodes([...nodes, ...offsetN]);
            updateEdges([...edges, ...e.map(ed => ({...ed, animation: 'flow' as EdgeAnimation}))]);
        }}
        onAddWidget={(type) => {
           const centerWorld = toWorld(window.innerWidth/2, window.innerHeight/2);
           const widgetNode: DiagramNode = {
             id: `widget-${Date.now()}`,
             type: 'visualizer',
             x: centerWorld.x - 160,
             y: centerWorld.y - 120,
             width: 320,
             height: 240,
             label: 'Visualizer',
             color: 'transparent',
             data: { type: 'sorting', array: [50, 20, 90, 10, 30, 70, 40, 80] }
           };
           updateNodes([...nodes, widgetNode]);
           setTool(ToolType.SELECT);
        }}
      />
      
      <SyncModal 
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        peerId={peerId}
        onJoinSession={connectToPeer}
      />

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentTheme={theme}
        setTheme={setTheme}
      />

      <ShapeLibrary
        isOpen={isShapeLibOpen}
        onClose={() => setIsShapeLibOpen(false)}
        onSelectShape={handleInsertShape}
        theme={theme}
      />

    </div>
  );
}

export default App;