export type Point = { x: number; y: number };

export enum ToolType {
  SELECT = 'SELECT',
  PAN = 'PAN',
  PEN = 'PEN',
  ERASER = 'ERASER',
  RECTANGLE = 'RECTANGLE',
  CIRCLE = 'CIRCLE',
  DIAMOND = 'DIAMOND',
  CYLINDER = 'CYLINDER',
  CLOUD = 'CLOUD',
  ACTOR = 'ACTOR',
  TEXT = 'TEXT',
  CONNECT = 'CONNECT',
  MAGIC = 'MAGIC' // AI Tool
}

export type Stroke = {
  id: string;
  points: Point[];
  color: string;
  width: number;
  type: 'pen';
};

// Expanded list for system design
export type NodeType = 
  | 'rect' | 'circle' | 'diamond' | 'cylinder' | 'cloud' | 'actor' 
  | 'redis' | 'kafka' | 'queue' | 'server' | 'loadbalancer' | 'k8s' | 'docker' | 'storage' | 'firewall' | 'mobile' | 'browser' | 'api'
  | 'text' | 'visualizer';

export type DiagramNode = {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: string;
  data?: any; // For visualizers
};

export type EdgeAnimation = 'none' | 'flow' | 'traffic' | 'pulse' | 'signal' | 'reverse';
export type EdgeStyle = 'solid' | 'dashed' | 'dotted';

export type DiagramEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
  animation?: EdgeAnimation;
  style?: EdgeStyle;
  color?: string;
};

export type CanvasState = {
  strokes: Stroke[];
  nodes: DiagramNode[];
  edges: DiagramEdge[];
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'model';
  text: string;
};

export type AppTheme = {
  background: string;
  gridColor: string;
  gridType: 'dots' | 'lines' | 'none';
  nodeColor: string;
  textColor: string;
};

export type SyncMessage = 
  | { type: 'SYNC_FULL'; payload: CanvasState }
  | { type: 'ADD_STROKE'; payload: Stroke }
  | { type: 'DELETE_STROKE'; payload: string }
  | { type: 'UPDATE_NODES'; payload: DiagramNode[] }
  | { type: 'UPDATE_EDGES'; payload: DiagramEdge[] };

export type VisualizerType = 'sorting' | 'bst' | 'graph';
