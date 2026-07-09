/**
 * Canvas Types
 * 
 * Core types for the infinite canvas system.
 */

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Viewport {
  offset: Position;
  zoom: number;
}

export interface CanvasConfig {
  width?: number;
  height?: number;
  backgroundColor?: string;
  gridSize?: number;
  snapToGrid?: boolean;
  minZoom?: number;
  maxZoom?: number;
}

export interface CanvasEvent {
  type: string;
  timestamp: number;
  position?: Position;
  target?: string;
  data?: any;
}

export interface SelectionBox {
  start: Position;
  end: Position;
}

export interface Transform {
  translate: Position;
  scale: number;
  rotate: number;
}

export type CanvasMode = 
  | 'select'    // Default selection mode
  | 'pan'       // Pan the canvas
  | 'connect'   // Creating connections
  | 'rect'      // Drawing rectangles
  | 'text';     // Text editing

export interface GridOptions {
  size: number;
  color: string;
  opacity: number;
  enabled: boolean;
}
