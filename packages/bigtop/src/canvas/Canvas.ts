/**
 * Canvas
 * 
 * Infinite canvas implementation for LocalCircus Big Top.
 */

import { v4 as uuidv4 } from 'uuid';
import { EventBus } from '@localcircus/core';
import { 
  Position, 
  Size, 
  Viewport, 
  CanvasConfig, 
  CanvasEvent,
  CanvasMode,
  GridOptions 
} from './types';

export class Canvas {
  readonly id: string;
  readonly name: string;
  
  private eventBus: EventBus;
  
  // Viewport state
  private viewport: Viewport = { offset: { x: 0, y: 0 }, zoom: 1 };
  
  // Canvas dimensions
  private size: Size;
  
  // Configuration
  private config: Required<CanvasConfig>;
  
  // Grid
  private grid: GridOptions;
  
  // Mode
  private mode: CanvasMode = 'select';
  
  // Interaction state
  private isDragging = false;
  private isPanning = false;
  private lastMousePosition: Position = { x: 0, y: 0 };
  
  // Listeners
  private listeners: Map<string, Set<(event: CanvasEvent) => void>> = new Map();

  constructor(name: string, config: CanvasConfig = {}, eventBus?: EventBus) {
    this.id = uuidv4();
    this.name = name;
    this.eventBus = eventBus || new EventBus();
    
    this.size = { width: config.width || 0, height: config.height || 0 };
    
    this.config = {
      backgroundColor: config.backgroundColor || '#1a1a2e',
      gridSize: config.gridSize || 20,
      snapToGrid: config.snapToGrid ?? true,
      minZoom: config.minZoom || 0.1,
      maxZoom: config.maxZoom || 4,
    };
    
    this.grid = {
      size: this.config.gridSize,
      color: '#ffffff15',
      opacity: 1,
      enabled: true,
    };
  }

  // ============================================================================
  // Viewport
  // ============================================================================

  /**
   * Get current viewport
   */
  getViewport(): Viewport {
    return { ...this.viewport };
  }

  /**
   * Set viewport offset
   */
  setOffset(offset: Position): void {
    this.viewport.offset = { ...offset };
    this.emit('viewport:change', { viewport: this.getViewport() });
  }

  /**
   * Pan the viewport
   */
  pan(delta: Position): void {
    this.viewport.offset.x += delta.x;
    this.viewport.offset.y += delta.y;
    this.emit('viewport:change', { viewport: this.getViewport() });
  }

  /**
   * Set zoom level
   */
  setZoom(zoom: number, center?: Position): void {
    const newZoom = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, zoom));
    
    if (center) {
      // Zoom towards center point
      const scale = newZoom / this.viewport.zoom;
      this.viewport.offset.x = center.x - (center.x - this.viewport.offset.x) * scale;
      this.viewport.offset.y = center.y - (center.y - this.viewport.offset.y) * scale;
    }
    
    this.viewport.zoom = newZoom;
    this.emit('viewport:change', { viewport: this.getViewport() });
  }

  /**
   * Zoom in
   */
  zoomIn(center?: Position): void {
    this.setZoom(this.viewport.zoom * 1.2, center);
  }

  /**
   * Zoom out
   */
  zoomOut(center?: Position): void {
    this.setZoom(this.viewport.zoom / 1.2, center);
  }

  /**
   * Reset zoom to 100%
   */
  resetZoom(): void {
    this.setZoom(1);
  }

  /**
   * Fit to content
   */
  fitToContent(bounds: { minX: number; minY: number; maxX: number; maxY: number }): void {
    if (this.size.width === 0 || this.size.height === 0) return;
    
    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;
    
    const scaleX = this.size.width / (contentWidth + 100);
    const scaleY = this.size.height / (contentHeight + 100);
    const scale = Math.min(scaleX, scaleY, 1);
    
    this.viewport.zoom = scale;
    this.viewport.offset = {
      x: (this.size.width - contentWidth * scale) / 2 - bounds.minX * scale,
      y: (this.size.height - contentHeight * scale) / 2 - bounds.minY * scale,
    };
    
    this.emit('viewport:change', { viewport: this.getViewport() });
  }

  // ============================================================================
  // Canvas State
  // ============================================================================

  /**
   * Set canvas size
   */
  setSize(size: Size): void {
    this.size = { ...size };
    this.emit('canvas:resize', { size: this.size });
  }

  /**
   * Get canvas size
   */
  getSize(): Size {
    return { ...this.size };
  }

  /**
   * Set mode
   */
  setMode(mode: CanvasMode): void {
    this.mode = mode;
    this.emit('canvas:mode', { mode });
  }

  /**
   * Get current mode
   */
  getMode(): CanvasMode {
    return this.mode;
  }

  // ============================================================================
  // Coordinate Transforms
  // ============================================================================

  /**
   * Convert screen coordinates to canvas coordinates
   */
  screenToCanvas(screenPos: Position): Position {
    return {
      x: (screenPos.x - this.viewport.offset.x) / this.viewport.zoom,
      y: (screenPos.y - this.viewport.offset.y) / this.viewport.zoom,
    };
  }

  /**
   * Convert canvas coordinates to screen coordinates
   */
  canvasToScreen(canvasPos: Position): Position {
    return {
      x: canvasPos.x * this.viewport.zoom + this.viewport.offset.x,
      y: canvasPos.y * this.viewport.zoom + this.viewport.offset.y,
    };
  }

  /**
   * Snap position to grid
   */
  snapToGrid(pos: Position): Position {
    if (!this.config.snapToGrid) return pos;
    
    return {
      x: Math.round(pos.x / this.grid.size) * this.grid.size,
      y: Math.round(pos.y / this.grid.size) * this.grid.size,
    };
  }

  // ============================================================================
  // Interaction
  // ============================================================================

  /**
   * Handle mouse down
   */
  handleMouseDown(event: CanvasEvent): void {
    this.lastMousePosition = event.position || { x: 0, y: 0 };
    
    if (this.mode === 'pan' || event.data?.button === 2) {
      this.isPanning = true;
      this.emit('canvas:pan:start', { position: event.position });
      return;
    }
    
    this.isDragging = true;
    this.emit('canvas:click', event);
  }

  /**
   * Handle mouse move
   */
  handleMouseMove(event: CanvasEvent): void {
    if (!event.position) return;
    
    const delta = {
      x: event.position.x - this.lastMousePosition.x,
      y: event.position.y - this.lastMousePosition.y,
    };
    
    if (this.isPanning) {
      this.pan(delta);
    }
    
    if (this.isDragging) {
      this.emit('canvas:drag', { 
        ...event, 
        delta,
        position: event.position 
      });
    }
    
    this.lastMousePosition = event.position;
  }

  /**
   * Handle mouse up
   */
  handleMouseUp(event: CanvasEvent): void {
    if (this.isPanning) {
      this.emit('canvas:pan:end', { position: event.position });
    }
    
    if (this.isDragging) {
      this.emit('canvas:drag:end', event);
    }
    
    this.isDragging = false;
    this.isPanning = false;
  }

  /**
   * Handle wheel (zoom)
   */
  handleWheel(event: { deltaY: number; position: Position }): void {
    const zoom = event.deltaY > 0 ? -1 : 1;
    this.setZoom(this.viewport.zoom * (1 + zoom * 0.1), event.position);
  }

  // ============================================================================
  // Grid
  // ============================================================================

  /**
   * Get grid options
   */
  getGrid(): GridOptions {
    return { ...this.grid };
  }

  /**
   * Set grid options
   */
  setGrid(options: Partial<GridOptions>): void {
    this.grid = { ...this.grid, ...options };
    this.emit('canvas:grid', { grid: this.grid });
  }

  /**
   * Toggle grid
   */
  toggleGrid(): void {
    this.grid.enabled = !this.grid.enabled;
    this.emit('canvas:grid', { grid: this.grid });
  }

  // ============================================================================
  // Event System
  // ============================================================================

  /**
   * Subscribe to canvas events
   */
  on(event: string, handler: (event: CanvasEvent) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(handler);
    
    // Also forward to eventBus
    const wrapper = (e: any) => handler(e);
    this.eventBus.on(event, wrapper);
    
    return () => {
      this.listeners.get(event)?.delete(handler);
      this.eventBus.off(event, wrapper);
    };
  }

  /**
   * Emit an event
   */
  private emit(type: string, data?: any): void {
    const event: CanvasEvent = {
      type,
      timestamp: Date.now(),
      data,
    };
    
    this.listeners.get(type)?.forEach(handler => handler(event));
    this.eventBus.emit(type, event);
  }

  /**
   * Get event bus
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }
}

// Factory
export function createCanvas(name: string, config?: CanvasConfig, eventBus?: EventBus): Canvas {
  return new Canvas(name, config, eventBus);
}
