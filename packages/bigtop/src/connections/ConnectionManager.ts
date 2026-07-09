/**
 * ConnectionManager
 * 
 * Manages connections between nodes.
 */

import { v4 as uuidv4 } from 'uuid';
import { EventBus } from '@localcircus/core';
import { Position } from '../canvas/types';
import { 
  Connection, 
  ConnectionConfig,
  ConnectionEndpoint,
  ConnectionPath,
  ConnectionStyle 
} from './types';

export class ConnectionManager {
  private connections: Map<string, Connection> = new Map();
  private eventBus: EventBus;
  private defaultStyle: ConnectionStyle = {
    color: '#6366f1',
    width: 2,
    dashed: false,
    animated: false,
  };

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus || new EventBus();
  }

  /**
   * Create a connection
   */
  createConnection(config: ConnectionConfig): Connection {
    const connection: Connection = {
      id: config.id || uuidv4(),
      source: config.source,
      target: config.target,
      data: config.data,
    };

    // Validate connection
    if (connection.source.nodeId === connection.target.nodeId) {
      throw new Error('Cannot connect node to itself');
    }

    // Check for duplicate
    const existing = this.findConnection(config.source, config.target);
    if (existing) {
      throw new Error('Connection already exists');
    }

    this.connections.set(connection.id, connection);
    this.emit('connection:created', { connection });

    return connection;
  }

  /**
   * Delete a connection
   */
  deleteConnection(id: string): boolean {
    const connection = this.connections.get(id);
    if (!connection) return false;

    this.connections.delete(id);
    this.emit('connection:deleted', { connectionId: id, connection });
    return true;
  }

  /**
   * Delete connections for a node
   */
  deleteConnectionsForNode(nodeId: string): string[] {
    const toDelete: string[] = [];

    for (const connection of this.connections.values()) {
      if (connection.source.nodeId === nodeId || connection.target.nodeId === nodeId) {
        toDelete.push(connection.id);
      }
    }

    for (const id of toDelete) {
      this.deleteConnection(id);
    }

    return toDelete;
  }

  /**
   * Delete connections for a port
   */
  deleteConnectionsForPort(nodeId: string, portId: string): string[] {
    const toDelete: string[] = [];

    for (const connection of this.connections.values()) {
      if (
        (connection.source.nodeId === nodeId && connection.source.portId === portId) ||
        (connection.target.nodeId === nodeId && connection.target.portId === portId)
      ) {
        toDelete.push(connection.id);
      }
    }

    for (const id of toDelete) {
      this.deleteConnection(id);
    }

    return toDelete;
  }

  /**
   * Get connection by ID
   */
  getConnection(id: string): Connection | undefined {
    return this.connections.get(id);
  }

  /**
   * Get all connections
   */
  getAllConnections(): Connection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get connections for a node
   */
  getConnectionsForNode(nodeId: string): Connection[] {
    return Array.from(this.connections.values()).filter(
      c => c.source.nodeId === nodeId || c.target.nodeId === nodeId
    );
  }

  /**
   * Get connections for a port
   */
  getConnectionsForPort(nodeId: string, portId: string): Connection[] {
    return Array.from(this.connections.values()).filter(
      c =>
        (c.source.nodeId === nodeId && c.source.portId === portId) ||
        (c.target.nodeId === nodeId && c.target.portId === portId)
    );
  }

  /**
   * Find connection between endpoints
   */
  findConnection(
    source: ConnectionEndpoint,
    target: ConnectionEndpoint
  ): Connection | undefined {
    return Array.from(this.connections.values()).find(
      c =>
        c.source.nodeId === source.nodeId &&
        c.source.portId === source.portId &&
        c.target.nodeId === target.nodeId &&
        c.target.portId === target.portId
    );
  }

  /**
   * Check if connection exists
   */
  connectionExists(source: ConnectionEndpoint, target: ConnectionEndpoint): boolean {
    return !!this.findConnection(source, target);
  }

  /**
   * Get connection count
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Validate connection
   */
  canConnect(
    source: ConnectionEndpoint,
    target: ConnectionEndpoint
  ): { valid: boolean; error?: string } {
    // Same node check
    if (source.nodeId === target.nodeId) {
      return { valid: false, error: 'Cannot connect node to itself' };
    }

    // Same connection check
    if (this.connectionExists(source, target)) {
      return { valid: false, error: 'Connection already exists' };
    }

    // Circular dependency check (simple version)
    if (this.wouldCreateCycle(source, target)) {
      return { valid: false, error: 'Connection would create a cycle' };
    }

    return { valid: true };
  }

  /**
   * Check if connection would create a cycle
   */
  private wouldCreateCycle(source: ConnectionEndpoint, target: ConnectionEndpoint): boolean {
    // BFS to check if target can reach source
    const visited = new Set<string>();
    const queue = [target];

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.nodeId === source.nodeId) {
        return true;
      }

      if (visited.has(`${current.nodeId}:${current.portId}`)) continue;
      visited.add(`${current.nodeId}:${current.portId}`);

      // Find all outgoing connections from current
      for (const conn of this.connections.values()) {
        if (conn.source.nodeId === current.nodeId && conn.source.portId === current.portId) {
          queue.push(conn.target);
        }
      }
    }

    return false;
  }

  /**
   * Generate path for connection
   */
  getPath(
    start: Position,
    end: Position,
    animated = false
  ): ConnectionPath {
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // Simple straight line for close points
    if (Math.abs(dx) < 100) {
      return { start, end };
    }

    // Bezier curve for longer connections
    const controlDistance = Math.min(Math.abs(dx) / 2, 100);
    const cp1: Position = { x: start.x + controlDistance, y: start.y };
    const cp2: Position = { x: end.x - controlDistance, y: end.y };

    return {
      start,
      end,
      controlPoints: [cp1, cp2],
    };
  }

  /**
   * Set default style
   */
  setDefaultStyle(style: ConnectionStyle): void {
    this.defaultStyle = { ...this.defaultStyle, ...style };
  }

  /**
   * Get default style
   */
  getDefaultStyle(): ConnectionStyle {
    return { ...this.defaultStyle };
  }

  /**
   * Clear all connections
   */
  clear(): void {
    const ids = Array.from(this.connections.keys());
    this.connections.clear();
    
    for (const id of ids) {
      this.emit('connection:deleted', { connectionId: id });
    }
    
    this.emit('connections:cleared', {});
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    bySourceType: Record<string, number>;
    byTargetType: Record<string, number>;
  } {
    const bySourceType: Record<string, number> = {};
    const byTargetType: Record<string, number> = {};

    for (const connection of this.connections.values()) {
      const sourceKey = `${connection.source.nodeId}:${connection.source.portId}`;
      const targetKey = `${connection.target.nodeId}:${connection.target.portId}`;
      
      bySourceType[sourceKey] = (bySourceType[sourceKey] || 0) + 1;
      byTargetType[targetKey] = (byTargetType[targetKey] || 0) + 1;
    }

    return {
      total: this.connections.size,
      bySourceType,
      byTargetType,
    };
  }

  /**
   * Export connections
   */
  export(): Connection[] {
    return this.getAllConnections();
  }

  /**
   * Import connections
   */
  import(connections: Connection[]): void {
    for (const conn of connections) {
      this.connections.set(conn.id, conn);
    }
    this.emit('connections:imported', { count: connections.length });
  }

  private emit(type: string, data: any): void {
    this.eventBus.emit(type, { ...data, timestamp: Date.now() });
  }

  on(event: string, handler: (data: any) => void): () => void {
    this.eventBus.on(event, handler);
    return () => this.eventBus.off(event, handler);
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }
}

export default ConnectionManager;
