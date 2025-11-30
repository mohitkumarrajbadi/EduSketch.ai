import React, { useState, useRef, useEffect } from 'react';
import { 
  ToolType, 
  Point, 
  Stroke, 
  DiagramNode, 
  DiagramEdge,
  AppTheme,
  SyncMessage
} from './types';
import Toolbar from './components/Toolbar';
import AIPanel from './components/Sidebar/AIPanel';
import SyncModal from './components/SyncModal';
import SortingWidget from './components/Visualizer/SortingWidget';
import SettingsPanel, { themes } from './components/SettingsPanel';
import { Database, Cloud, User, Trash2, Scaling } from 'lucide-react';

// Declare PeerJS global
declare const Peer: any;

function App() {
  // --- STATE ---
  const [tool, setTool] = useState<ToolType>(ToolType.PEN);
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
  
  // Interaction State
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
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
    const peer = new Peer(); // Auto-generate ID
    peerRef.current = peer;

    peer.on('open', (id: string) => {
      console.log('My Peer ID:', id);
      setPeerId(id);
      
      // Check URL for session to join automatically
      const params = new URLSearchParams(window.location.search);
      const sessionToJoin = params.get('session');
      if (sessionToJoin) {
        connectToPeer(sessionToJoin);
        // Clear URL to clean up
        window.history.replaceState({}, document.title, "/");
        setIsSyncOpen(true); // Open modal to show status (optional)
      }
    });

    peer.on('connection', (conn: any) => {
      console.log('Incoming connection:', conn.peer);
      setupConnection(conn);
    });

    peer.on('error', (err: any) => {
      console.error('PeerJS Error:', err);
    });

    return () => {
      peer.destroy();
    };
  }, []);

  const setupConnection = (conn: any) => {
    conn.on('open', () => {
      console.log('Connected to:', conn.peer);
      setConnections(prev => [...prev, conn]);
      
      // If we are host (have data), send initial sync
      // Simple heuristic: if we have strokes or nodes, send them
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
    // Determine if we need to update state
    switch (msg.type) {
      case 'SYNC_FULL':
        setStrokes(msg.payload.strokes);
        setNodes(msg.payload.nodes);
        setEdges(msg.payload.edges);
        break;
      case 'ADD_STROKE':
        setStrokes(prev => {
          // Avoid duplicates if ID exists
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

  // --- STATE MUTATORS WITH BROADCAST ---
  
  const addStroke = (stroke: Stroke) => {
    setStrokes(prev => [...prev, stroke]);
    broadcast({ type: 'ADD_STROKE', payload: stroke });
  };

  const deleteStrokes = (idsToDelete: string[]) => {
    setStrokes(prev => prev.filter(s => !idsToDelete.includes(s.id)));
    idsToDelete.forEach(id => {
       broadcast({ type: 'DELETE_STROKE', payload: id });
    });
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

  // Convert Screen coordinates to World coordinates
  const toWorld = (screenX: number, screenY: number): Point => {
    return {
      x: (screenX - transform.x) / transform.k,
      y: (screenY - transform.y) / transform.k
    };
  };

  const getScreenPoint = (e: React.MouseEvent | React.TouchEvent | WheelEvent): Point => {
    // Handle generic event types
    const clientX = 'touches' in e ? (e as any).touches[0].clientX : (e as any).clientX;
    const clientY = 'touches' in e ? (e as any).touches[0].clientY : (e as any).clientY;
    return { x: clientX, y: clientY };
  };

  // --- EVENT HANDLERS ---

  // Key Down Handler for Deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          // Delete node
          const newNodes = nodes.filter(n => n.id !== selectedNodeId);
          const newEdges = edges.filter(edge => edge.from !== selectedNodeId && edge.to !== selectedNodeId);
          updateNodes(newNodes);
          updateEdges(newEdges);
          setSelectedNodeId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, nodes, edges]); // Dep needed for sync wrappers

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomIntensity = 0.1;
      const delta = -Math.sign(e.deltaY);
      const scaleBy = 1 + zoomIntensity * delta;
      
      const oldK = transform.k;
      const newK = Math.min(Math.max(oldK * scaleBy, 0.1), 5); // Limit zoom
      
      const mouse = getScreenPoint(e);
      const mouseWorld = toWorld(mouse.x, mouse.y);
      
      // Calculate new position to keep mouse pointer fixed
      const newX = mouse.x - mouseWorld.x * newK;
      const newY = mouse.y - mouseWorld.y * newK;

      setTransform({ x: newX, y: newY, k: newK });
    } else {
      // Pan
      setTransform(prev => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
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

    // Deselect if clicking on empty space
    if (target.id === 'canvas-container' || target.tagName === 'CANVAS' || target.tagName === 'SVG') {
      setSelectedNodeId(null);
    }

    // 1. PAN Tool or Middle Click
    if (tool === ToolType.PAN || (e as React.MouseEvent).button === 1) {
      setIsPanning(true);
      setLastMousePos(screen);
      return;
    }

    // 2. Interaction with Nodes (handled in handleNodeMouseDown generally, but here for creation)
    const isShapeTool = [
      ToolType.RECTANGLE, ToolType.CIRCLE, ToolType.DIAMOND, 
      ToolType.CYLINDER, ToolType.CLOUD, ToolType.ACTOR
    ].includes(tool);

    if (isShapeTool) {
      let type: DiagramNode['type'] = 'rect';
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
      
      // Adjust size for specific shapes
      if (type === 'actor') {
         newNode.width = 60;
         newNode.height = 90;
         newNode.x = world.x - 30;
      }
      if (type === 'circle' || type === 'diamond' || type === 'cloud') {
        newNode.height = 80;
        newNode.width = 120; // Ellipse-ish
      }

      updateNodes([...nodes, newNode]);
      setTool(ToolType.SELECT); // Auto-switch back
      return;
    }

    // 3. Drawing
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
      // Resize Logic
      const node = nodes.find(n => n.id === resizingNodeId);
      if (node) {
        const newWidth = Math.max(50, world.x - node.x);
        const newHeight = Math.max(50, world.y - node.y);
        // We broadcast only on mouse up to avoid flooding, but for local smoothness we update state
        // To keep it simple for this demo, we won't broadcast resize continuously
        setNodes(prev => prev.map(n => n.id === resizingNodeId ? { ...n, width: newWidth, height: newHeight } : n));
      }
    }
    else if (tool === ToolType.ERASER && (e as React.MouseEvent).buttons === 1) {
      // Eraser Logic
      // Find strokes to delete
      const toDelete: string[] = [];
      const remaining = strokes.filter(stroke => {
         const threshold = 20 / transform.k;
         const hit = stroke.points.some(p => Math.hypot(p.x - world.x, p.y - world.y) < threshold);
         if (hit) toDelete.push(stroke.id);
         return !hit;
      });
      
      if (toDelete.length > 0) {
        deleteStrokes(toDelete);
      }
    }
    else if (currentStroke) {
      setCurrentStroke(prev => {
        if (!prev) return null;
        return { ...prev, points: [...prev.points, world] };
      });
    } 
    else if (draggedNodeId) {
      setNodes(prev => prev.map(n => {
        if (n.id === draggedNodeId) {
          return { ...n, x: world.x - dragOffset.x, y: world.y - dragOffset.y };
        }
        return n;
      }));
    } 
    else if (connectingNodeId) {
      setTempConnectionEnd(world);
    }
  };

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
    
    if (currentStroke) {
      addStroke(currentStroke);
      setCurrentStroke(null);
    }
    
    if (draggedNodeId || resizingNodeId) {
      // Broadcast final position/size
      updateNodes(nodes);
    }

    setDraggedNodeId(null);
    setResizingNodeId(null);
    if (connectingNodeId) {
      setConnectingNodeId(null);
      setTempConnectionEnd(null);
    }
  };

  // Node Interactions
  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent canvas drag/draw
    
    // Select Node
    setSelectedNodeId(id);

    if (tool === ToolType.CONNECT) {
      setConnectingNodeId(id);
      const world = toWorld(getScreenPoint(e).x, getScreenPoint(e).y);
      setTempConnectionEnd(world);
      return;
    }

    if (tool === ToolType.SELECT) {
      const node = nodes.find(n => n.id === id);
      const world = toWorld(getScreenPoint(e).x, getScreenPoint(e).y);
      if (node) {
        setDraggedNodeId(id);
        setDragOffset({ x: world.x - node.x, y: world.y - node.y });
      }
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setResizingNodeId(id);
  };

  const handleNodeMouseUp = (e: React.MouseEvent, id: string) => {
    if (tool === ToolType.CONNECT && connectingNodeId && connectingNodeId !== id) {
      e.stopPropagation();
      // Create Edge
      const newEdge = {
        id: `edge-${Date.now()}`,
        from: connectingNodeId,
        to: id,
        animated: true
      };
      updateEdges([...edges, newEdge]);
    }
  };

  const deleteSelected = () => {
    if (selectedNodeId) {
       const newNodes = nodes.filter(n => n.id !== selectedNodeId);
       const newEdges = edges.filter(edge => edge.from !== selectedNodeId && edge.to !== selectedNodeId);
       updateNodes(newNodes);
       updateEdges(newEdges);
       setSelectedNodeId(null);
    }
  };

  // --- RENDERING ---

  // Canvas Drawing
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

    // Apply Transform
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    // Draw saved strokes
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

    // Draw current stroke
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

  // SVG Edges
  const renderEdges = () => {
    const renderedEdges = edges.map(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      if (!fromNode || !toNode) return null;

      const startX = fromNode.x + fromNode.width / 2;
      const startY = fromNode.y + fromNode.height / 2;
      const endX = toNode.x + toNode.width / 2;
      const endY = toNode.y + toNode.height / 2;

      return (
        <line
          key={edge.id}
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke={theme.gridColor}
          strokeWidth="2"
          className={edge.animated ? 'animate-flow' : ''}
          strokeDasharray={edge.animated ? "5" : "0"}
          markerEnd="url(#arrowhead)"
        />
      );
    });

    // Temp connection line
    let tempLine = null;
    if (connectingNodeId && tempConnectionEnd) {
      const fromNode = nodes.find(n => n.id === connectingNodeId);
      if (fromNode) {
        const startX = fromNode.x + fromNode.width / 2;
        const startY = fromNode.y + fromNode.height / 2;
        tempLine = (
           <line
             x1={startX}
             y1={startY}
             x2={tempConnectionEnd.x}
             y2={tempConnectionEnd.y}
             stroke={theme.gridColor}
             strokeWidth="2"
             strokeDasharray="5"
             className="opacity-50"
           />
        );
      }
    }

    return (
      <svg className="absolute inset-0 overflow-visible pointer-events-none z-10">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={theme.gridColor} />
          </marker>
        </defs>
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {renderedEdges}
          {tempLine}
        </g>
      </svg>
    );
  };

  const getGridStyle = () => {
    const size = 24 * transform.k;
    const color = theme.gridColor;
    
    if (theme.gridType === 'lines') {
      return {
        backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
        backgroundPosition: `${transform.x}px ${transform.y}px`,
        opacity: 0.1
      };
    } else if (theme.gridType === 'dots') {
       return {
        backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
        backgroundPosition: `${transform.x}px ${transform.y}px`,
        opacity: 0.2
      };
    }
    return {};
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
      {/* Background Grid */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={getGridStyle()}
      />

      {/* SVG Layer for Edges */}
      {renderEdges()}

      {/* Canvas Layer for Drawing */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-20 pointer-events-none"
      />

      {/* HTML Layer for Nodes (Transformed) */}
      <div 
        className="absolute inset-0 z-30 pointer-events-none origin-top-left"
        style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})` }}
      >
        {nodes.map(node => (
          <div
            key={node.id}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            onMouseUp={(e) => handleNodeMouseUp(e, node.id)}
            className={`diagram-node absolute flex items-center justify-center shadow-lg border backdrop-blur-md transition-shadow group pointer-events-auto cursor-move
              ${selectedNodeId === node.id ? 'ring-2 ring-accent shadow-accent/20 z-50' : 'z-30'}
              ${tool === ToolType.CONNECT ? 'cursor-crosshair hover:ring-2 hover:ring-accent' : ''}
              ${node.type === 'circle' ? 'rounded-full' : 'rounded-lg'}
              ${node.type === 'diamond' ? 'rotate-45' : ''}
            `}
            style={{
              left: node.x,
              top: node.y,
              width: node.width,
              height: node.height,
              backgroundColor: node.color !== 'transparent' ? node.color : undefined,
              borderColor: selectedNodeId === node.id ? '#3b82f6' : (theme.gridColor + '80')
            }}
          >
            {/* Visual Content based on Type */}
            {node.type === 'visualizer' ? (
              <div className="w-full h-full scale-[0.9]">
                 <SortingWidget data={node.data} />
              </div>
            ) : node.type === 'cylinder' ? (
               <div className="flex flex-col items-center justify-center">
                 <Database size={24} className="mb-1 opacity-70" />
                 <div className="text-sm font-medium text-center p-1 select-none pointer-events-none" style={{ color: theme.textColor }}>
                    {node.label}
                 </div>
               </div>
            ) : node.type === 'cloud' ? (
              <div className="flex flex-col items-center justify-center">
                 <Cloud size={32} className="mb-1 opacity-70" />
                 <div className="text-sm font-medium text-center p-1 select-none pointer-events-none" style={{ color: theme.textColor }}>
                    {node.label}
                 </div>
               </div>
            ) : node.type === 'actor' ? (
              <div className="flex flex-col items-center justify-center">
                 <User size={32} className="mb-1 opacity-70" />
                 <div className="text-sm font-medium text-center p-1 select-none pointer-events-none" style={{ color: theme.textColor }}>
                    {node.label}
                 </div>
               </div>
            ) : (
              <div className={`text-sm font-medium text-center p-2 select-none pointer-events-none ${node.type === 'diamond' ? '-rotate-45' : ''}`} style={{ color: theme.textColor }}>
                {node.label}
              </div>
            )}
            
            {/* Hover Handles for Connections */}
            {(tool === ToolType.SELECT || tool === ToolType.CONNECT) && (
              <>
                 <div className="absolute -top-1 left-1/2 w-2 h-2 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                 <div className="absolute -bottom-1 left-1/2 w-2 h-2 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            )}

            {/* Resize Handle (Only when selected) */}
            {selectedNodeId === node.id && (
               <>
                <div 
                  className={`absolute -bottom-2 -right-2 w-5 h-5 bg-accent rounded-full cursor-se-resize flex items-center justify-center z-50 shadow-md ${node.type === 'diamond' ? '-rotate-45 translate-x-3 translate-y-3' : ''}`}
                  onMouseDown={(e) => handleResizeMouseDown(e, node.id)}
                >
                  <Scaling size={10} className="text-white" />
                </div>
               </>
            )}
            
            {/* Delete Action (Only when selected) */}
             {selectedNodeId === node.id && (
               <button
                 className={`absolute -top-10 right-0 p-2 bg-red-500/90 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg pointer-events-auto ${node.type === 'diamond' ? '-rotate-45 translate-x-8 -translate-y-8' : ''}`}
                 onClick={(e) => { e.stopPropagation(); deleteSelected(); }}
                 title="Delete"
               >
                 <Trash2 size={14} />
               </button>
            )}
          </div>
        ))}
      </div>

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-50 pointer-events-none">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 font-mono tracking-tight">
          EduSketch<span className="text-slate-500 text-sm font-normal">.ai</span>
        </h1>
        <div className="flex gap-2 mt-1">
          <div className="px-2 py-0.5 rounded bg-slate-800/50 text-[10px] text-slate-400 border border-slate-700">
             {Math.round(transform.k * 100)}%
          </div>
          <div className="text-xs text-slate-500">
             {tool === ToolType.PAN ? 'Panning Mode' : 
              tool === ToolType.CONNECT ? 'Click & Drag to Connect' : 
              tool === ToolType.ERASER ? 'Click & Drag to Erase' :
              'Untitled Lesson'}
          </div>
        </div>
      </div>

      <Toolbar 
        currentTool={tool} 
        setTool={setTool} 
        onAIModalOpen={() => setIsAIModalOpen(true)}
        onSyncOpen={() => setIsSyncOpen(true)}
        onSettingsOpen={() => setIsSettingsOpen(true)}
      />

      <AIPanel 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        onAddDiagram={(n, e) => {
            const centerWorld = toWorld(window.innerWidth/2, window.innerHeight/2);
            const offsetN = n.map(node => ({ ...node, x: node.x + centerWorld.x - 300, y: node.y + centerWorld.y - 200, color: theme.nodeColor }));
            updateNodes([...nodes, ...offsetN]);
            updateEdges([...edges, ...e.map(ed => ({...ed, animated: true }))]);
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
             label: 'Sorter',
             color: 'transparent'
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

    </div>
  );
}

export default App;