/**
 * LocalCircus Registry
 * 
 * Artifact registry with graph database, search, and recommendations.
 */

export * from './types';
export { GraphDatabase } from './graph/GraphDatabase';
export { SearchEngine } from './search/SearchEngine';
export { CompatibilityEngine } from './compatibility/CompatibilityEngine';
export { RecommendationsEngine } from './recommendations/RecommendationsEngine';

import { ArtifactDNA, ArtifactType } from '@localcircus/artifact-sdk';
import { EventBus } from '@localcircus/core';
import { GraphDatabase } from './graph/GraphDatabase';
import { SearchEngine } from './search/SearchEngine';
import { CompatibilityEngine } from './compatibility/CompatibilityEngine';
import { RecommendationsEngine } from './recommendations/RecommendationsEngine';
import { RegistryEntry, SearchQuery, SearchResult, Recommendation, TrustLevel } from './types';

/**
 * LocalCircus Registry
 */
export class Registry {
  private eventBus: EventBus;
  private graph: GraphDatabase;
  private search: SearchEngine;
  private compatibility: CompatibilityEngine;
  private recommendations: RecommendationsEngine;

  constructor() {
    this.eventBus = new EventBus();
    this.graph = new GraphDatabase(this.eventBus);
    this.search = new SearchEngine(this.eventBus);
    this.compatibility = new CompatibilityEngine();
    this.recommendations = new RecommendationsEngine(this.eventBus);
  }

  /**
   * Register an artifact
   */
  register(dna: ArtifactDNA, options?: {
    displayName?: string;
    shortDescription?: string;
    category?: string;
    tags?: string[];
    rating?: number;
    trustLevel?: TrustLevel;
    featured?: boolean;
  }): RegistryEntry {
    const entry: RegistryEntry = {
      uuid: dna.uuid,
      name: dna.name,
      type: dna.type,
      version: dna.version,
      versions: [{ version: dna.version, dna, publishedAt: Date.now() }],
      displayName: options?.displayName || dna.displayName || dna.name,
      shortDescription: options?.shortDescription || dna.metadata.description,
      icon: this.getIcon(dna.type),
      category: options?.category || this.getCategory(dna.type),
      tags: options?.tags || dna.metadata.keywords,
      rating: options?.rating || 0,
      ratingCount: 0,
      downloads: 0,
      trustLevel: options?.trustLevel || 'unverified',
      publisher: { id: '', name: '', verified: false, trustScore: 0 },
      createdAt: dna.createdAt || Date.now(),
      updatedAt: dna.updatedAt || Date.now(),
      publishedAt: Date.now(),
      verified: !!dna.signatures?.creator,
      featured: options?.featured || false,
      deprecated: false,
    };

    // Add to graph
    this.graph.addArtifact(dna);

    // Add to search index
    this.search.index(entry);

    // Add to recommendations
    this.recommendations.addEntry(entry);

    this.eventBus.emit('registry:registered', { uuid: entry.uuid, name: entry.name });

    return entry;
  }

  /**
   * Get artifact entry
   */
  get(uuid: string): RegistryEntry | undefined {
    const node = this.graph.getNode(uuid);
    if (!node) return undefined;

    const entries = this.search.getAll();
    return entries.find(e => e.uuid === uuid);
  }

  /**
   * Get artifact by name
   */
  getByName(name: string): RegistryEntry | undefined {
    const node = this.graph.getNodeByName(name);
    if (!node) return undefined;

    const entries = this.search.getAll();
    return entries.find(e => e.name === name);
  }

  /**
   * Search artifacts
   */
  search(query: SearchQuery, limit?: number): SearchResult[] {
    return this.search.search(query, limit);
  }

  /**
   * Get recommendations
   */
  recommend(uuid: string, limit?: number): Recommendation[] {
    return this.recommendations.getForArtifact(uuid, limit);
  }

  /**
   * Get general recommendations
   */
  getGeneralRecommendations(limit?: number): Recommendation[] {
    return this.recommendations.getGeneral(limit);
  }

  /**
   * Check compatibility
   */
  checkCompatibility(dna: ArtifactDNA) {
    return this.compatibility.check(dna);
  }

  /**
   * Get dependencies
   */
  getDependencies(uuid: string) {
    return this.graph.getDependencies(uuid);
  }

  /**
   * Get dependents
   */
  getDependents(uuid: string) {
    return this.graph.getDependents(uuid);
  }

  /**
   * Get trending
   */
  getTrending(limit = 10): RegistryEntry[] {
    return this.search.getTrending(limit);
  }

  /**
   * Get recent
   */
  getRecent(limit = 10): RegistryEntry[] {
    return this.search.getRecent(limit);
  }

  /**
   * Get all entries
   */
  getAll(): RegistryEntry[] {
    return this.search.getAll();
  }

  /**
   * Get entries by type
   */
  getByType(type: ArtifactType): RegistryEntry[] {
    return this.search.search({ type }, 1000).map(r => r.entry);
  }

  /**
   * Get entries by category
   */
  getByCategory(category: string): RegistryEntry[] {
    return this.search.search({ category }, 1000).map(r => r.entry);
  }

  /**
   * Record download
   */
  recordDownload(uuid: string): void {
    const entry = this.get(uuid);
    if (entry) {
      entry.downloads++;
    }
  }

  /**
   * Record rating
   */
  recordRating(uuid: string, rating: number): void {
    const entry = this.get(uuid);
    if (entry) {
      entry.ratingCount++;
      entry.rating = ((entry.rating * (entry.ratingCount - 1)) + rating) / entry.ratingCount;
      this.recommendations.recordRating(uuid, rating);
    }
  }

  /**
   * Get icon for type
   */
  private getIcon(type: ArtifactType): string {
    const icons: Record<string, string> = {
      'model': '🦄',
      'agent': '🤖',
      'workflow': '🔗',
      'tool': '🔧',
      'plugin': '🎭',
      'extension': '🔌',
      'mcp-server': '🖥️',
      'acp-tool': '⚡',
      'api-connector': '🔌',
      'dataset': '📊',
      'knowledge-pack': '📚',
      'prompt-pack': '💬',
      'memory-pack': '🧠',
      'theme': '🎨',
      'workspace': '🏠',
      'project-template': '📋',
      'benchmark': '🏆',
      'evaluation': '📏',
      'documentation': '📖',
    };
    return icons[type] || '📦';
  }

  /**
   * Get category for type
   */
  private getCategory(type: ArtifactType): string {
    const categories: Record<string, string> = {
      'model': 'models',
      'agent': 'ai-agents',
      'workflow': 'workflows',
      'tool': 'tools',
      'plugin': 'plugins',
      'extension': 'plugins',
      'mcp-server': 'servers',
      'acp-tool': 'servers',
      'api-connector': 'connectors',
      'dataset': 'data',
      'knowledge-pack': 'data',
      'prompt-pack': 'prompts',
      'memory-pack': 'prompts',
      'theme': 'themes',
    };
    return categories[type] || 'other';
  }

  /**
   * Get event bus
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * Get graph database
   */
  getGraph(): GraphDatabase {
    return this.graph;
  }
}

// Factory
export function createRegistry(): Registry {
  return new Registry();
}

export default Registry;
