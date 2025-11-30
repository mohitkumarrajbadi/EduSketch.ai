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

export type DiagramNode = {
  id: string;
  type: 'rect' | 'circle' | 'diamond' | 'cylinder' | 'cloud' | 'actor' | 'text' | 'visualizer';
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: string;
  data?: any; // For visualizers
};

export type DiagramEdge = {
  id: string;
  from: string;
  to: string;
  animated?: boolean;
  label?: string;
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
  | { type: 'DELETE_STROKE'; payload: string } // stroke id
  | { type: 'UPDATE_NODES'; payload: DiagramNode[] }
  | { type: 'UPDATE_EDGES'; payload: DiagramEdge[] };
