/**
 * BigTop
 * 
 * Infinite canvas and workflow builder for LocalCircus.
 */

export { Canvas, createCanvas } from './canvas/Canvas';
export * from './canvas/types';

export { NodeManager } from './nodes/NodeManager';
export * from './nodes/types';

export { ConnectionManager } from './connections/ConnectionManager';
export * from './connections/types';

import { Canvas } from './canvas/Canvas';
import { NodeManager } from './nodes/NodeManager';
import { ConnectionManager } from './connections/ConnectionManager';
import { EventBus } from '@localcircus/core';
import { Position } from './canvas/types';
import { NodeConfig, NodeType } from './nodes/types';
import { ConnectionConfig } from './connections/types';

/**
 * BigTop - Main workflow editor
 */
export class BigTop {
  readonly id: string;
  readonly name: string;

  private eventBus: EventBus;
  private canvas: Canvas;
  private nodes: NodeManager;
  private connections: ConnectionManager;

  private isConnecting = false;
  private connectionStart: { nodeId: string; portId: string } | null = null;

  constructor(name: string) {
    this.id = `bigtop-${Date.now()}`;
    this.name = name;
    this.eventBus = new EventBus();

    this.canvas = new Canvas(name, {}, this.eventBus);
    this.nodes = new NodeManager(this.eventBus);
    this.connections = new ConnectionManager(this.eventBus);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Forward canvas events
    this.canvas.on('canvas:click', (e) => {
      if (this.isConnecting) {
        this.cancelConnection();
      }
    });

    // Forward node events
    this.nodes.on('node:deleted', (e) => {
      this.connections.deleteConnectionsForNode(e.nodeId);
    });

    // Forward connection events
    this.connections.on('connection:deleted', (e) => {
      this.emit('connection:deleted', e);
    });
  }

  // ============================================================================
  // Canvas
  // ============================================================================

  getCanvas(): Canvas {
    return this.canvas;
  }

  setCanvasSize(width: number, height: number): void {
    this.canvas.setSize({ width, height });
  }

  // ============================================================================
  // Nodes
  // ============================================================================

  getNodes(): NodeManager {
    return this.nodes;
  }

  addNode(config: NodeConfig) {
    return this.nodes.createNode(config);
  }

  addNodeByType(type: NodeType, position: Position) {
    return this.nodes.createNode({ type, position });
  }

  removeNode(nodeId: string) {
    this.nodes.deleteNode(nodeId);
  }

  moveNode(nodeId: string, position: Position) {
    this.nodes.moveNode(nodeId, position);
  }

  // ============================================================================
  // Connections
  // ============================================================================

  getConnections(): ConnectionManager {
    return this.connections;
  }

  startConnection(nodeId: string, portId: string) {
    this.isConnecting = true;
    this.connectionStart = { nodeId, portId };
    this.emit('connection:start', { nodeId, portId });
  }

  completeConnection(targetNodeId: string, targetPortId: string) {
    if (!this.connectionStart) return null;

    const source = this.connectionStart;
    const target = { nodeId: targetNodeId, portId: targetPortId };

    // Validate
    const validation = this.connections.canConnect(source, target);
    if (!validation.valid) {
      this.emit('connection:error', { error: validation.error });
      this.cancelConnection();
      return null;
    }

    const connection = this.connections.createConnection({ source, target });
    this.cancelConnection();
    return connection;
  }

  cancelConnection() {
    this.isConnecting = false;
    this.connectionStart = null;
    this.emit('connection:cancel', {});
  }

  removeConnection(connectionId: string) {
    this.connections.deleteConnection(connectionId);
  }

  // ============================================================================
  // Selection
  // ============================================================================

  selectNode(nodeId: string, addToSelection = false) {
    this.nodes.selectNode(nodeId, addToSelection);
  }

  deselectAll() {
    this.nodes.deselectAll();
  }

  getSelectedNodes() {
    return this.nodes.getSelectedNodes();
  }

  deleteSelected() {
    const selected = this.nodes.getSelectedNodes();
    for (const node of selected) {
      this.nodes.deleteNode(node.id);
    }
  }

  // ============================================================================
  // Viewport
  // ============================================================================

  pan(delta: Position) {
    this.canvas.pan(delta);
  }

  zoomIn(center?: Position) {
    this.canvas.zoomIn(center);
  }

  zoomOut(center?: Position) {
    this.canvas.zoomOut(center);
  }

  fitToContent() {
    const bounds = this.nodes.getBounds();
    if (bounds) {
      this.canvas.fitToContent(bounds);
    }
  }

  resetView() {
    this.canvas.resetZoom();
    this.canvas.setOffset({ x: 0, y: 0 });
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  export() {
    return {
      nodes: this.nodes.getAllNodes().map(n => ({
        id: n.id,
        type: n.type,
        name: n.name,
        position: n.position,
        size: n.size,
        ports: n.ports,
        data: n.data,
      })),
      connections: this.connections.export().map(c => ({
        id: c.id,
        source: c.source,
        target: c.target,
      })),
      viewport: this.canvas.getViewport(),
    };
  }

  import(data: any) {
    this.clear();

    // Import nodes
    for (const nodeData of data.nodes || []) {
      this.nodes.createNode({
        id: nodeData.id,
        type: nodeData.type,
        name: nodeData.name,
        position: nodeData.position,
        size: nodeData.size,
        ports: nodeData.ports,
        data: nodeData.data,
      });
    }

    // Import connections
    for (const connData of data.connections || []) {
      try {
        this.connections.createConnection({
          id: connData.id,
          source: connData.source,
          target: connData.target,
        });
      } catch {
        // Skip invalid connections
      }
    }

    // Import viewport
    if (data.viewport) {
      this.canvas.setOffset(data.viewport.offset);
      this.canvas.setZoom(data.viewport.zoom);
    }
  }

  clear() {
    this.connections.clear();
    this.nodes.clear();
    this.resetView();
  }

  // ============================================================================
  // Events
  // ============================================================================

  private emit(type: string, data: any): void {
    this.eventBus.emit(type, data);
  }

  on(event: string, handler: (data: any) => void): () => void {
    this.eventBus.on(event, handler);
    return () => this.eventBus.off(event, handler);
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }
}

// Factory
export function createBigTop(name: string): BigTop {
  return new BigTop(name);
}

export default BigTop;
