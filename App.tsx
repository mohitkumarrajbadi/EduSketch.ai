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
  EdgeAnimation,
  EdgeStyle,
  VisualizerType
} from './types';
import Toolbar from './components/Toolbar';
import AIPanel from './components/Sidebar/AIPanel';
import SyncModal from './components/SyncModal';
import VisualizerContainer from './components/Visualizer/VisualizerContainer';
import SettingsPanel, { themes } from './components/SettingsPanel';
import ShapeLibrary from './components/ShapeLibrary';
import VisualizerLibrary from './components/VisualizerLibrary';
import { 
  Database, Cloud, User, Trash2, Scaling, Server, Layers, Box, Shuffle, 
  Shield, Smartphone, Monitor, HardDrive, Network as NetworkIcon, Container,
  Zap, ArrowRight, ZapOff, Activity, MoveRight, Radio, GripHorizontal,
  Wifi, ActivitySquare, Sparkles, Download, FileImage, File
} from 'lucide-react';

// Declare PeerJS and Export libs global
declare const Peer: any;
declare const html2canvas: any;
declare const jspdf: any;

const SYSTEM_NODES = ['redis', 'kafka', 'queue', 'server', 'loadbalancer', 'k8s', 'docker', 'storage', 'firewall', 'mobile', 'browser', 'api', 'cylinder', 'cloud', 'actor'];

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
  const [isVisualizerLibOpen, setIsVisualizerLibOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false); // Used to hide UI during capture
  
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

  /**
   * Calculates the intersection point between a line (from node center to target)
   * and the node's boundary.
   */
  const getIntersection = (node: DiagramNode, target: Point): Point => {
    const cx = node.x + node.width / 2;
    const cy = node.y + node.height / 2;
    const w = node.width / 2;
    const h = node.height / 2;

    const dx = target.x - cx;
    const dy = target.y - cy;

    // If target is practically center, return center
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return { x: cx, y: cy };

    if (node.type === 'circle' || node.type === 'actor') {
       // Ellipse intersection
       const angle = Math.atan2(dy, dx);
       return {
         x: cx + w * Math.cos(angle),
         y: cy + h * Math.sin(angle)
       };
    } 
    else if (node.type === 'diamond') {
       // Diamond: |x|/w + |y|/h = 1
       // Slope m = dy/dx
       // Intersection x: |x| * (1/w + |m|/h) = 1
       const m = Math.abs(dy / dx);
       const ix = 1 / (1/w + m/h);
       const xSign = dx > 0 ? 1 : -1;
       const ySign = dy > 0 ? 1 : -1;
       
       // Handle vertical line case separately if needed, but Math.abs handles infinity nicely in JS usually
       // If dx is 0, m is Infinity, ix becomes 0.
       if (dx === 0) return { x: cx, y: cy + (dy > 0 ? h : -h) };

       return {
         x: cx + ix * xSign,
         y: cy + ix * m * ySign
       };
    } 
    else {
       // Rectangle (default)
       // Check if line hits vertical or horizontal sides
       // Slope of line
       const m = dy / dx;
       // Slope of rectangle diagonal
       const mRect = h / w;
       
       if (Math.abs(m) <= mRect) {
         // Hits vertical side (Left or Right)
         if (dx > 0) return { x: cx + w, y: cy + w * m };
         else return { x: cx - w, y: cy - w * m };
       } else {
         // Hits horizontal side (Top or Bottom)
         if (dy > 0) return { x: cx + h / m, y: cy + h };
         else return { x: cx - h / m, y: cy - h };
       }
    }
  };

  // --- EXPORT FUNCTION ---
  const handleExport = async (format: 'png' | 'jpeg' | 'pdf' | 'gif') => {
    setIsExportMenuOpen(false);
    setIsExporting(true);
    
    // Wait for state to propagate and hide UI
    await new Promise(r => setTimeout(r, 200));

    try {
      const element = containerRef.current;
      if (!element) throw new Error("Canvas container not found");

      // Capture high resolution
      const canvas = await html2canvas(element, {
        useCORS: true,
        backgroundColor: theme.background,
        scale: 2, // Reting quality
        ignoreElements: (el: Element) => {
          // Double check to ignore overlay UI elements
          return el.classList.contains('no-export');
        },
        logging: false
      });

      if (format === 'pdf') {
        const jsPDF = (window as any).jspdf?.jsPDF;
        if (!jsPDF) {
          alert("PDF library not loaded. Please try again or refresh.");
          return;
        }
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'l' : 'p',
          unit: 'px',
          format: [canvas.width / 2, canvas.height / 2] // Adjust for scale 2
        });
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
        pdf.save(`edusketch-export-${Date.now()}.pdf`);
      } else {
        const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'gif' ? 'image/gif' : 'image/png';
        const link = document.createElement('a');
        link.download = `edusketch-export-${Date.now()}.${format}`;
        link.href = canvas.toDataURL(mimeType);
        link.click();
      }
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export. See console for details.");
    } finally {
      setIsExporting(false);
    }
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

    // Close export menu if clicking outside
    if (isExportMenuOpen) setIsExportMenuOpen(false);

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
        setStrokes(remaining); 
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
      color: color, 
      data: {}
    };
    // Special sizing
    if (['server', 'loadbalancer', 'redis'].includes(type)) { newNode.width = 100; newNode.height = 100; }
    updateNodes([...nodes, newNode]);
    setTool(ToolType.SELECT);
  };

  const handleInsertVisualizer = (type: VisualizerType, label: string) => {
    const centerWorld = toWorld(window.innerWidth/2, window.innerHeight/2);
    const widgetNode: DiagramNode = {
       id: `widget-${Date.now()}`,
       type: 'visualizer',
       x: centerWorld.x - 160,
       y: centerWorld.y - 120,
       width: 320,
       height: 240,
       label: label,
       color: 'transparent',
       data: { type: type, array: [50, 20, 90, 10, 30, 70, 40, 80] }
     };
     updateNodes([...nodes, widgetNode]);
     setTool(ToolType.SELECT);
  };

  const handleEdgeClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedEdgeId(id);
    setSelectedNodeId(null);
  };

  const applyEdgePreset = (preset: 'static' | 'dashed' | 'stream' | 'packets' | 'signal' | 'pulse' | 'ants' | 'neon') => {
    if (!selectedEdgeId) return;

    let anim: EdgeAnimation = 'none';
    let style: EdgeStyle = 'solid';

    if (preset === 'static') { anim = 'none'; style = 'solid'; }
    if (preset === 'dashed') { anim = 'none'; style = 'dashed'; }
    if (preset === 'stream') { anim = 'flow'; style = 'solid'; }
    if (preset === 'packets') { anim = 'traffic'; style = 'dashed'; }
    if (preset === 'signal') { anim = 'signal'; style = 'dotted'; }
    if (preset === 'pulse') { anim = 'pulse'; style = 'solid'; }
    if (preset === 'ants') { anim = 'ants'; style = 'dashed'; }
    if (preset === 'neon') { anim = 'neon'; style = 'solid'; }

    const newEdges = edges.map(edge => 
      edge.id === selectedEdgeId ? { ...edge, animation: anim, style: style } : edge
    );
    updateEdges(newEdges);
  };

  // --- RENDERING ICONS ---
  const renderNodeIcon = (node: DiagramNode) => {
    const size = 32;
    // Determine icon color: 
    // If system node, use the specific node color (e.g. Red for Redis)
    // If generic node (Rect), use white/contrast against the filled background
    const isSystem = SYSTEM_NODES.includes(node.type);
    let iconColor = theme.textColor;
    
    if (isSystem) {
       // For system nodes, background is neutral, so icon takes the color
       if (node.color && node.color !== theme.nodeColor && node.color !== 'transparent') {
         iconColor = node.color;
       }
    } else {
       // For shapes with filled background, icon should be white/contrast
       iconColor = '#fff';
    }

    const style = { color: iconColor, opacity: 0.9 };
    
    switch (node.type) {
      case 'redis': return <Database size={size} style={style} />;
      case 'kafka': return <Layers size={size} style={style} />;
      case 'server': return <Server size={size} style={style} />;
      case 'loadbalancer': return <Shuffle size={size} style={style} />;
      case 'storage': return <HardDrive size={size} style={style} />;
      case 'cloud': return <Cloud size={size} style={style} />;
      case 'k8s': return <NetworkIcon size={size} style={style} />;
      case 'docker': return <Container size={size} style={style} />;
      case 'firewall': return <Shield size={size} style={style} />;
      case 'mobile': return <Smartphone size={size} style={style} />;
      case 'browser': return <Monitor size={size} style={style} />;
      case 'api': return <Zap size={size} style={style} />;
      case 'queue': return <Box size={size} style={style} />;
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

            // Calculate exact intersection points
            const startCenter = { x: from.x + from.width/2, y: from.y + from.height/2 };
            const endCenter = { x: to.x + to.width/2, y: to.y + to.height/2 };
            
            const startPoint = getIntersection(from, endCenter);
            const endPoint = getIntersection(to, startCenter);

            const animClass = 
              edge.animation === 'traffic' ? 'animate-traffic' :
              edge.animation === 'pulse' ? 'animate-pulse' :
              edge.animation === 'signal' ? 'animate-signal' :
              edge.animation === 'reverse' ? 'animate-reverse' :
              edge.animation === 'ants' ? 'animate-ants' :
              edge.animation === 'neon' ? 'animate-neon' :
              (edge.animation === 'flow') ? 'animate-flow' : '';

            const dashArray = 
               (edge.animation === 'ants') ? '4,4' :
               (edge.style === 'dotted' || edge.animation === 'signal') ? '2,4' : 
               (edge.style === 'dashed' || edge.animation === 'traffic') ? '8,8' : 
               '0';

            return (
              <g key={edge.id} className="pointer-events-auto cursor-pointer group" onClick={(e) => handleEdgeClick(e, edge.id)}>
                 {/* Hit area */}
                 <line x1={startPoint.x} y1={startPoint.y} x2={endPoint.x} y2={endPoint.y} stroke="transparent" strokeWidth="20" />
                 {/* Visible line */}
                 <line 
                   x1={startPoint.x} y1={startPoint.y} x2={endPoint.x} y2={endPoint.y} 
                   stroke={selectedEdgeId === edge.id ? '#3b82f6' : theme.gridColor} 
                   strokeWidth={selectedEdgeId === edge.id ? 3 : 2}
                   strokeDasharray={animClass && edge.animation !== 'ants' && edge.animation !== 'neon' ? undefined : dashArray}
                   className={animClass}
                   markerEnd="url(#arrowhead)"
                 />
              </g>
            );
          })}
          {connectingNodeId && tempConnectionEnd && (
             <line 
                x1={getIntersection(nodes.find(n => n.id === connectingNodeId)!, tempConnectionEnd).x}
                y1={getIntersection(nodes.find(n => n.id === connectingNodeId)!, tempConnectionEnd).y}
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
        {nodes.map(node => {
          // Calculate background color: neutral for system nodes, filled for shapes
          const isSystem = SYSTEM_NODES.includes(node.type);
          const bgCol = node.type === 'visualizer' ? 'transparent' : 
                         (isSystem ? theme.nodeColor : 
                         (node.color !== 'transparent' ? node.color : undefined));
          const borderCol = selectedNodeId === node.id ? '#3b82f6' : 
                            (isSystem && node.color && node.color !== theme.nodeColor ? node.color : theme.gridColor + '80');

          return (
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
              backgroundColor: bgCol,
              borderColor: borderCol
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
        )})}
      </div>

      {/* EDGE CONTROLS POPUP (Labeled Presets) */}
      {selectedEdgeId && !isExporting && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-panel border border-slate-700 p-3 rounded-xl shadow-xl flex flex-col gap-2 z-50 animate-fade-in pointer-events-auto min-w-[220px] no-export">
           <div className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-1">Connection Type</div>
           <div className="grid grid-cols-2 gap-2">
             <button onClick={() => applyEdgePreset('static')} className="px-3 py-2 hover:bg-slate-700 rounded text-slate-300 text-xs flex items-center gap-2 border border-slate-700">
                <MoveRight size={14} /> Simple
             </button>
             <button onClick={() => applyEdgePreset('dashed')} className="px-3 py-2 hover:bg-slate-700 rounded text-slate-300 text-xs flex items-center gap-2 border border-slate-700">
                <GripHorizontal size={14} /> Dashed
             </button>
             <button onClick={() => applyEdgePreset('stream')} className="px-3 py-2 hover:bg-slate-700 rounded text-slate-300 text-xs flex items-center gap-2 border border-slate-700">
                <ArrowRight size={14} /> Data Flow
             </button>
             <button onClick={() => applyEdgePreset('packets')} className="px-3 py-2 hover:bg-slate-700 rounded text-slate-300 text-xs flex items-center gap-2 border border-slate-700">
                <Container size={14} /> Packets
             </button>
             <button onClick={() => applyEdgePreset('signal')} className="px-3 py-2 hover:bg-slate-700 rounded text-slate-300 text-xs flex items-center gap-2 border border-slate-700">
                <Wifi size={14} /> Signal
             </button>
             <button onClick={() => applyEdgePreset('pulse')} className="px-3 py-2 hover:bg-slate-700 rounded text-slate-300 text-xs flex items-center gap-2 border border-slate-700">
                <ActivitySquare size={14} /> Pulse
             </button>
             <button onClick={() => applyEdgePreset('ants')} className="px-3 py-2 hover:bg-slate-700 rounded text-slate-300 text-xs flex items-center gap-2 border border-slate-700">
                <MoveRight size={14} className="stroke-dashed" /> Ants
             </button>
             <button onClick={() => applyEdgePreset('neon')} className="px-3 py-2 hover:bg-slate-700 rounded text-slate-300 text-xs flex items-center gap-2 border border-slate-700">
                <Sparkles size={14} /> Neon
             </button>
           </div>
           
           <div className="w-full h-px bg-slate-700 my-1"></div>
           
           <button 
             onClick={() => { updateEdges(edges.filter(e => e.id !== selectedEdgeId)); setSelectedEdgeId(null); }} 
             className="w-full py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded text-xs font-semibold flex items-center justify-center gap-2"
           >
             <Trash2 size={14} /> Delete Connection
           </button>
        </div>
      )}

      {/* EXPORT MENU */}
      {isExportMenuOpen && (
        <div className="absolute bottom-24 left-1/2 ml-20 -translate-x-1/2 bg-panel border border-slate-700 p-2 rounded-xl shadow-xl z-50 flex flex-col gap-1 min-w-[150px] animate-fade-in no-export">
           <div className="text-[10px] text-slate-500 font-bold uppercase px-2 py-1">Export As</div>
           <button onClick={() => handleExport('png')} className="px-3 py-2 hover:bg-slate-700 rounded text-slate-200 text-xs flex items-center gap-2 text-left">
              <FileImage size={14} className="text-blue-400" /> PNG Image
           </button>
           <button onClick={() => handleExport('jpeg')} className="px-3 py-2 hover:bg-slate-700 rounded text-slate-200 text-xs flex items-center gap-2 text-left">
              <FileImage size={14} className="text-yellow-400" /> JPEG Image
           </button>
           <button onClick={() => handleExport('pdf')} className="px-3 py-2 hover:bg-slate-700 rounded text-slate-200 text-xs flex items-center gap-2 text-left">
              <File size={14} className="text-red-400" /> PDF Document
           </button>
           <button onClick={() => handleExport('gif')} className="px-3 py-2 hover:bg-slate-700 rounded text-slate-200 text-xs flex items-center gap-2 text-left">
              <FileImage size={14} className="text-purple-400" /> GIF Image
           </button>
        </div>
      )}

      {/* UI Overlay */}
      {!isExporting && (
        <div className="absolute top-4 left-4 z-50 pointer-events-none no-export">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 font-mono tracking-tight">
            EduSketch<span className="text-slate-500 text-sm font-normal">.ai</span>
          </h1>
          <div className="flex gap-2 mt-1">
            <div className="px-2 py-0.5 rounded bg-slate-800/50 text-[10px] text-slate-400 border border-slate-700">
               {Math.round(transform.k * 100)}%
            </div>
          </div>
        </div>
      )}

      {!isExporting && (
        <Toolbar 
          currentTool={tool} 
          setTool={setTool} 
          onAIModalOpen={() => setIsAIModalOpen(true)}
          onSyncOpen={() => setIsSyncOpen(true)}
          onSettingsOpen={() => setIsSettingsOpen(true)}
          onShapeLibraryOpen={() => setIsShapeLibOpen(true)}
          onVisualizerLibraryOpen={() => setIsVisualizerLibOpen(true)}
          onExportOpen={() => setIsExportMenuOpen(!isExportMenuOpen)}
        />
      )}

      <div className={isExporting ? 'hidden' : ''}>
        <AIPanel 
          isOpen={isAIModalOpen} 
          onClose={() => setIsAIModalOpen(false)} 
          onAddDiagram={(n, e) => {
              const centerWorld = toWorld(window.innerWidth/2, window.innerHeight/2);
              const offsetN = n.map(node => ({ ...node, x: node.x + centerWorld.x - 300, y: node.y + centerWorld.y - 200, color: theme.nodeColor }));
              updateNodes([...nodes, ...offsetN]);
              updateEdges([...edges, ...e.map(ed => ({...ed, animation: 'flow' as EdgeAnimation}))]);
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

        <VisualizerLibrary
          isOpen={isVisualizerLibOpen}
          onClose={() => setIsVisualizerLibOpen(false)}
          onSelectVisualizer={handleInsertVisualizer}
        />
      </div>

    </div>
  );
}

export default App;