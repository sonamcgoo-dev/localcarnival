/**
 * GraphDatabase
 * 
 * In-memory graph database for artifact relationships.
 */

import { ArtifactDNA, ArtifactType } from '@localcircus/artifact-sdk';
import { EventBus } from '@localcircus/core';
import { GraphNode, GraphEdge, DependencyNode, DependencyEdge } from '../types';

export class GraphDatabase {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: GraphEdge[] = [];
  private adjacencyList: Map<string, Set<string>> = new Map();
  private reverseAdjacency: Map<string, Set<string>> = new Map();
  private eventBus: EventBus;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus || new EventBus();
  }

  /**
   * Add an artifact to the graph
   */
  addArtifact(dna: ArtifactDNA): void {
    const node: GraphNode = {
      uuid: dna.uuid,
      name: dna.name,
      type: dna.type,
      version: dna.version,
      capabilities: dna.capabilities.map(c => c.id),
      dependencies: [],
      dependents: [],
    };

    this.nodes.set(dna.uuid, node);
    this.adjacencyList.set(dna.uuid, new Set());
    this.reverseAdjacency.set(dna.uuid, new Set());

    // Add dependency edges
    for (const dep of dna.dependencies) {
      const edge: GraphEdge = {
        from: dna.uuid,
        to: dep.reference.name, // Note: in real impl, this would resolve to UUID
        type: 'depends-on',
        versionRange: dep.versionRange,
      };
      this.edges.push(edge);
      
      // Update adjacency lists
      this.adjacencyList.get(dna.uuid)?.add(dep.reference.name);
    }

    this.eventBus.emit('graph:node:added', { uuid: dna.uuid, name: dna.name });
  }

  /**
   * Remove an artifact from the graph
   */
  removeArtifact(uuid: string): void {
    const node = this.nodes.get(uuid);
    if (!node) return;

    // Remove all edges
    this.edges = this.edges.filter(e => e.from !== uuid && e.to !== uuid);

    // Update adjacency lists
    for (const [key, set] of this.adjacencyList) {
      set.delete(uuid);
    }
    for (const [key, set] of this.reverseAdjacency) {
      set.delete(uuid);
    }

    // Remove reverse dependencies
    for (const edge of this.edges) {
      if (edge.to === node.name) {
        const depNode = this.nodes.get(edge.from);
        if (depNode) {
          depNode.dependents = depNode.dependents.filter(d => d !== node.name);
        }
      }
    }

    // Remove node
    this.nodes.delete(uuid);
    this.adjacencyList.delete(uuid);
    this.reverseAdjacency.delete(uuid);

    this.eventBus.emit('graph:node:removed', { uuid, name: node.name });
  }

  /**
   * Update an artifact in the graph
   */
  updateArtifact(dna: ArtifactDNA): void {
    this.removeArtifact(dna.uuid);
    this.addArtifact(dna);
  }

  /**
   * Get a node by UUID
   */
  getNode(uuid: string): GraphNode | undefined {
    return this.nodes.get(uuid);
  }

  /**
   * Get a node by name
   */
  getNodeByName(name: string): GraphNode | undefined {
    for (const node of this.nodes.values()) {
      if (node.name === name) return node;
    }
    return undefined;
  }

  /**
   * Get all nodes
   */
  getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get nodes by type
   */
  getNodesByType(type: ArtifactType): GraphNode[] {
    return Array.from(this.nodes.values()).filter(n => n.type === type);
  }

  /**
   * Get dependencies of a node
   */
  getDependencies(uuid: string): GraphNode[] {
    const node = this.nodes.get(uuid);
    if (!node) return [];

    const deps: GraphNode[] = [];
    for (const depName of node.dependencies) {
      const depNode = this.getNodeByName(depName);
      if (depNode) deps.push(depNode);
    }
    return deps;
  }

  /**
   * Get dependents of a node
   */
  getDependents(uuid: string): GraphNode[] {
    const node = this.nodes.get(uuid);
    if (!node) return [];

    const deps: GraphNode[] = [];
    for (const depName of node.dependents) {
      const depNode = this.getNodeByName(depName);
      if (depNode) deps.push(depNode);
    }
    return deps;
  }

  /**
   * Get all edges
   */
  getAllEdges(): GraphEdge[] {
    return [...this.edges];
  }

  /**
   * Find path between two nodes
   */
  findPath(fromUuid: string, toUuid: string): string[] | null {
    const from = this.getNodeByName(fromUuid);
    const to = this.getNodeByName(toUuid);

    if (!from || !to) return null;

    const queue: string[][] = [[from.name]];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const path = queue.shift()!;
      const current = path[path.length - 1];

      if (current === to.name) {
        return path;
      }

      if (visited.has(current)) continue;
      visited.add(current);

      const neighbors = this.adjacencyList.get(current);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push([...path, neighbor]);
          }
        }
      }
    }

    return null;
  }

  /**
   * Get all ancestors (transitive dependencies)
   */
  getAncestors(uuid: string): GraphNode[] {
    const ancestors = new Set<string>();
    const queue = [uuid];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const node = this.getNodeByName(current);

      if (node) {
        for (const dep of node.dependencies) {
          if (!ancestors.has(dep)) {
            ancestors.add(dep);
            queue.push(dep);
          }
        }
      }
    }

    const result: GraphNode[] = [];
    for (const name of ancestors) {
      const node = this.getNodeByName(name);
      if (node) result.push(node);
    }
    return result;
  }

  /**
   * Get all descendants (transitive dependents)
   */
  getDescendants(uuid: string): GraphNode[] {
    const descendants = new Set<string>();
    const queue = [uuid];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const node = this.getNodeByName(current);

      if (node) {
        for (const dep of node.dependents) {
          if (!descendants.has(dep)) {
            descendants.add(dep);
            queue.push(dep);
          }
        }
      }
    }

    const result: GraphNode[] = [];
    for (const name of descendants) {
      const node = this.getNodeByName(name);
      if (node) result.push(node);
    }
    return result;
  }

  /**
   * Find nodes with capability
   */
  findByCapability(capability: string): GraphNode[] {
    return Array.from(this.nodes.values()).filter(node =>
      node.capabilities.includes(capability)
    );
  }

  /**
   * Get statistics
   */
  getStats(): {
    nodeCount: number;
    edgeCount: number;
    types: Record<string, number>;
    avgDependencies: number;
  } {
    const types: Record<string, number> = {};
    let totalDeps = 0;

    for (const node of this.nodes.values()) {
      types[node.type] = (types[node.type] || 0) + 1;
      totalDeps += node.dependencies.length;
    }

    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.length,
      types,
      avgDependencies: this.nodes.size > 0 ? totalDeps / this.nodes.size : 0,
    };
  }

  /**
   * Clear the graph
   */
  clear(): void {
    this.nodes.clear();
    this.edges = [];
    this.adjacencyList.clear();
    this.reverseAdjacency.clear();
    this.eventBus.emit('graph:cleared', {});
  }

  /**
   * Get event bus
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }
}

export default GraphDatabase;
