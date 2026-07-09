/**
 * NodeManager
 * 
 * Manages nodes on the canvas.
 */

import { v4 as uuidv4 } from 'uuid';
import { EventBus } from '@localcircus/core';
import { Position, Size } from '../canvas/types';
import { 
  Node, 
  NodeConfig, 
  NodeType, 
  NodePort, 
  NodeData,
  NodeDefinition,
  BUILT_IN_NODES 
} from './types';

const DEFAULT_NODE_SIZE: Size = { width: 180, height: 80 };

export class NodeManager {
  private nodes: Map<string, Node> = new Map();
  private eventBus: EventBus;
  private definitions: Map<NodeType, NodeDefinition> = new Map();

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus || new EventBus();
    
    for (const [type, definition] of Object.entries(BUILT_IN_NODES)) {
      this.registerDefinition(type as NodeType, definition);
    }
  }

  createNode(config: NodeConfig): Node {
    const definition = this.definitions.get(config.type);
    if (!definition) throw new Error(`Unknown node type: ${config.type}`);

    const ports = this.generatePorts(definition, config.ports);

    const node: Node = {
      id: config.id || uuidv4(),
      type: config.type,
      name: config.name || definition.name,
      position: { ...config.position },
      size: config.size || { ...DEFAULT_NODE_SIZE },
      ports,
      style: config.style || {},
      data: { ...definition.defaults, ...config.data },
      selected: false,
      locked: false,
    };

    this.nodes.set(node.id, node);
    this.emit('node:created', { node });
    return node;
  }

  private generatePorts(definition: NodeDefinition, customPorts?: NodePort[]): NodePort[] {
    if (customPorts) return customPorts;

    const ports: NodePort[] = [];
    let portIndex = 0;

    for (const input of definition.inputs) {
      ports.push({ id: `input-${portIndex++}`, ...input, type: 'input' });
    }

    portIndex = 0;
    for (const output of definition.outputs) {
      ports.push({ id: `output-${portIndex++}`, ...output, type: 'output' });
    }

    return ports;
  }

  cloneNode(nodeId: string, offset?: Position): Node | null {
    const original = this.nodes.get(nodeId);
    if (!original) return null;

    return this.createNode({
      type: original.type,
      name: `${original.name} (copy)`,
      position: {
        x: original.position.x + (offset?.x || 50),
        y: original.position.y + (offset?.y || 50),
      },
      ports: original.ports.map(p => ({ ...p })),
      style: { ...original.style },
      data: { ...original.data },
    });
  }

  getNode(id: string): Node | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  updateNode(id: string, changes: Partial<Node>): Node | null {
    const node = this.nodes.get(id);
    if (!node) return null;

    const updated: Node = { ...node, ...changes, id: node.id };
    this.nodes.set(id, updated);
    this.emit('node:updated', { node: updated });
    return updated;
  }

  moveNode(id: string, position: Position): Node | null {
    return this.updateNode(id, { position });
  }

  resizeNode(id: string, size: Size): Node | null {
    return this.updateNode(id, { size });
  }

  deleteNode(id: string): boolean {
    const node = this.nodes.get(id);
    if (!node) return false;

    this.nodes.delete(id);
    this.emit('node:deleted', { nodeId: id, node });
    return true;
  }

  selectNode(id: string, addToSelection = false): void {
    if (!addToSelection) this.deselectAll();

    const node = this.nodes.get(id);
    if (node) {
      node.selected = true;
      this.emit('node:selected', { node });
    }
  }

  deselectNode(id: string): void {
    const node = this.nodes.get(id);
    if (node && node.selected) {
      node.selected = false;
      this.emit('node:deselected', { node });
    }
  }

  deselectAll(): void {
    for (const node of this.nodes.values()) {
      if (node.selected) node.selected = false;
    }
    this.emit('selection:cleared', {});
  }

  getSelectedNodes(): Node[] {
    return Array.from(this.nodes.values()).filter(n => n.selected);
  }

  lockNode(id: string): Node | null {
    return this.updateNode(id, { locked: true });
  }

  unlockNode(id: string): Node | null {
    return this.updateNode(id, { locked: false });
  }

  setNodeData(id: string, data: Partial<NodeData>): Node | null {
    const node = this.nodes.get(id);
    if (!node) return null;

    return this.updateNode(id, { data: { ...node.data, ...data } });
  }

  registerDefinition(type: NodeType, definition: NodeDefinition): void {
    this.definitions.set(type, definition);
    this.emit('definition:registered', { type, definition });
  }

  getDefinition(type: NodeType): NodeDefinition | undefined {
    return this.definitions.get(type);
  }

  getAllDefinitions(): NodeDefinition[] {
    return Array.from(this.definitions.values());
  }

  addPort(nodeId: string, port: Omit<NodePort, 'id'>): NodePort | null {
    const node = this.nodes.get(nodeId);
    if (!node) return null;

    const newPort: NodePort = {
      id: `${port.type}-${node.ports.filter(p => p.type === port.type).length}`,
      ...port,
    };

    node.ports.push(newPort);
    this.emit('node:port:added', { nodeId, port: newPort });
    return newPort;
  }

  removePort(nodeId: string, portId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    const index = node.ports.findIndex(p => p.id === portId);
    if (index === -1) return false;

    node.ports.splice(index, 1);
    this.emit('node:port:removed', { nodeId, portId });
    return true;
  }

  getPortPosition(nodeId: string, portId: string): { x: number; y: number } | null {
    const node = this.nodes.get(nodeId);
    const port = node?.ports.find(p => p.id === portId);
    if (!node || !port) return null;

    const inputPorts = node.ports.filter(p => p.type === 'input');
    const outputPorts = node.ports.filter(p => p.type === 'output');

    if (port.type === 'input') {
      const index = inputPorts.indexOf(port);
      const spacing = node.size.height / (inputPorts.length + 1);
      return { x: node.position.x, y: node.position.y + spacing * (index + 1) };
    } else {
      const index = outputPorts.indexOf(port);
      const spacing = node.size.height / (outputPorts.length + 1);
      return { x: node.position.x + node.size.width, y: node.position.y + spacing * (index + 1) };
    }
  }

  getBounds(): { minX: number; minY: number; maxX: number; maxY: number } | null {
    const nodes = this.getAllNodes();
    if (nodes.length === 0) return null;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const node of nodes) {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + node.size.width);
      maxY = Math.max(maxY, node.position.y + node.size.height);
    }

    return { minX, minY, maxX, maxY };
  }

  clear(): void {
    this.nodes.clear();
    this.emit('canvas:cleared', {});
  }

  getStats(): { total: number; byType: Record<string, number>; selected: number } {
    const byType: Record<string, number> = {};
    let selected = 0;

    for (const node of this.nodes.values()) {
      byType[node.type] = (byType[node.type] || 0) + 1;
      if (node.selected) selected++;
    }

    return { total: this.nodes.size, byType, selected };
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

export default NodeManager;
