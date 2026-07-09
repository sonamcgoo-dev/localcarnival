/**
 * SearchEngine
 * 
 * Full-text and faceted search for artifacts.
 */

import { ArtifactDNA, ArtifactType } from '@localcircus/artifact-sdk';
import { EventBus } from '@localcircus/core';
import { RegistryEntry, SearchQuery, SearchResult, SearchMatch } from '../types';

export class SearchEngine {
  private entries: Map<string, RegistryEntry> = new Map();
  private invertedIndex: Map<string, Set<string>> = new Map();
  private eventBus: EventBus;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus || new EventBus();
  }

  /**
   * Index an artifact
   */
  index(entry: RegistryEntry): void {
    this.entries.set(entry.uuid, entry);
    
    // Index searchable fields
    this.indexField('uuid', entry.uuid, entry.uuid);
    this.indexField('name', entry.name, entry.uuid);
    this.indexField('displayName', entry.displayName, entry.uuid);
    this.indexField('description', entry.shortDescription, entry.uuid);
    
    // Index tags
    for (const tag of entry.tags) {
      this.indexField('tag', tag.toLowerCase(), entry.uuid);
    }
    
    // Index type
    this.indexField('type', entry.type, entry.uuid);
    
    // Index category
    this.indexField('category', entry.category, entry.uuid);

    this.eventBus.emit('search:indexed', { uuid: entry.uuid, name: entry.name });
  }

  /**
   * Index a field
   */
  private indexField(field: string, value: string, entryUuid: string): void {
    const key = `${field}:${value.toLowerCase()}`;
    
    if (!this.invertedIndex.has(key)) {
      this.invertedIndex.set(key, new Set());
    }
    this.invertedIndex.get(key)!.add(entryUuid);
  }

  /**
   * Remove from index
   */
  remove(uuid: string): void {
    const entry = this.entries.get(uuid);
    if (!entry) return;

    // Remove from all index entries
    for (const [key, uuids] of this.invertedIndex) {
      uuids.delete(uuid);
      if (uuids.size === 0) {
        this.invertedIndex.delete(key);
      }
    }

    this.entries.delete(uuid);
    this.eventBus.emit('search:removed', { uuid });
  }

  /**
   * Search artifacts
   */
  search(query: SearchQuery, limit = 20): SearchResult[] {
    const results: SearchResult[] = [];

    // Get matching UUIDs
    let matchingUuids: Set<string> | null = null;

    // Text search
    if (query.text) {
      const textMatches = this.searchText(query.text);
      matchingUuids = this.intersectSets(matchingUuids, textMatches);
    }

    // Type filter
    if (query.type) {
      const typeMatches = this.getByField('type', query.type);
      matchingUuids = this.intersectSets(matchingUuids, typeMatches);
    }

    // Category filter
    if (query.category) {
      const categoryMatches = this.getByField('category', query.category);
      matchingUuids = this.intersectSets(matchingUuids, categoryMatches);
    }

    // Tag filter
    if (query.tags && query.tags.length > 0) {
      for (const tag of query.tags) {
        const tagMatches = this.getByField('tag', tag.toLowerCase());
        matchingUuids = this.intersectSets(matchingUuids, tagMatches);
      }
    }

    // Trust level filter
    if (query.trustLevel) {
      const trustMatches = this.getByTrustLevel(query.trustLevel);
      matchingUuids = this.intersectSets(matchingUuids, trustMatches);
    }

    // Verified filter
    if (query.verified !== undefined) {
      const verifiedMatches = this.getByVerified(query.verified);
      matchingUuids = this.intersectSets(matchingUuids, verifiedMatches);
    }

    // Deprecated filter
    if (query.deprecated !== undefined) {
      const deprecatedMatches = this.getByDeprecated(query.deprecated);
      matchingUuids = this.intersectSets(matchingUuids, deprecatedMatches);
    }

    // Build results
    const uuids = matchingUuids || new Set(this.entries.keys());
    
    for (const uuid of uuids) {
      const entry = this.entries.get(uuid);
      if (!entry) continue;

      const score = this.calculateScore(entry, query);
      const matches = this.getMatches(entry, query);
      const highlights = this.getHighlights(entry, query);

      results.push({
        entry,
        score,
        matches,
        highlights,
      });
    }

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  /**
   * Search text across fields
   */
  private searchText(text: string): Set<string> {
    const terms = text.toLowerCase().split(/\s+/);
    const matches = new Set<string>();

    for (const term of terms) {
      // Exact matches first
      for (const [key, uuids] of this.invertedIndex) {
        if (key.includes(term)) {
          for (const uuid of uuids) {
            matches.add(uuid);
          }
        }
      }
    }

    return matches;
  }

  /**
   * Get entries by field value
   */
  private getByField(field: string, value: string): Set<string> {
    const key = `${field}:${value.toLowerCase()}`;
    return this.invertedIndex.get(key) || new Set();
  }

  /**
   * Get entries by trust level
   */
  private getByTrustLevel(trustLevel: string): Set<string> {
    const matches = new Set<string>();
    for (const [uuid, entry] of this.entries) {
      if (entry.trustLevel === trustLevel) {
        matches.add(uuid);
      }
    }
    return matches;
  }

  /**
   * Get entries by verified status
   */
  private getByVerified(verified: boolean): Set<string> {
    const matches = new Set<string>();
    for (const [uuid, entry] of this.entries) {
      if (entry.verified === verified) {
        matches.add(uuid);
      }
    }
    return matches;
  }

  /**
   * Get entries by deprecated status
   */
  private getByDeprecated(deprecated: boolean): Set<string> {
    const matches = new Set<string>();
    for (const [uuid, entry] of this.entries) {
      if (entry.deprecated === deprecated) {
        matches.add(uuid);
      }
    }
    return matches;
  }

  /**
   * Calculate relevance score
   */
  private calculateScore(entry: RegistryEntry, query: SearchQuery): number {
    let score = 0;

    // Base popularity score
    score += Math.log10(entry.downloads + 1) * 2;
    score += entry.rating * 10;
    score += entry.ratingCount * 0.1;

    // Boost for featured
    if (entry.featured) score += 50;

    // Boost for official/trusted
    if (entry.trustLevel === 'official') score += 30;
    if (entry.trustLevel === 'trusted') score += 20;

    // Text match boost
    if (query.text) {
      const terms = query.text.toLowerCase().split(/\s+/);
      
      for (const term of terms) {
        if (entry.name.toLowerCase().includes(term)) score += 20;
        if (entry.displayName.toLowerCase().includes(term)) score += 15;
        if (entry.shortDescription.toLowerCase().includes(term)) score += 10;
        if (entry.tags.some(t => t.toLowerCase().includes(term))) score += 5;
      }
    }

    // Recency boost (newer = higher)
    const age = Date.now() - entry.updatedAt;
    const ageWeeks = age / (7 * 24 * 60 * 60 * 1000);
    score += Math.max(0, 10 - ageWeeks);

    return score;
  }

  /**
   * Get matching fields
   */
  private getMatches(entry: RegistryEntry, query: SearchQuery): SearchMatch[] {
    const matches: SearchMatch[] = [];

    if (query.text) {
      const terms = query.text.toLowerCase().split(/\s+/);
      
      for (const term of terms) {
        if (entry.name.toLowerCase().includes(term)) {
          matches.push({ field: 'name', value: entry.name, score: 20 });
        }
        if (entry.displayName.toLowerCase().includes(term)) {
          matches.push({ field: 'displayName', value: entry.displayName, score: 15 });
        }
      }
    }

    return matches;
  }

  /**
   * Get highlighted snippets
   */
  private getHighlights(entry: RegistryEntry, query: SearchQuery): string[] {
    const highlights: string[] = [];

    if (query.text && entry.shortDescription) {
      const terms = query.text.toLowerCase().split(/\s+/);
      
      for (const term of terms) {
        if (entry.shortDescription.toLowerCase().includes(term)) {
          highlights.push(entry.shortDescription);
          break;
        }
      }
    }

    return highlights;
  }

  /**
   * Intersect two sets
   */
  private intersectSets(a: Set<string> | null, b: Set<string>): Set<string> {
    if (!a) return b;
    
    const result = new Set<string>();
    for (const item of b) {
      if (a.has(item)) {
        result.add(item);
      }
    }
    return result;
  }

  /**
   * Get suggestions
   */
  getSuggestions(prefix: string, limit = 10): string[] {
    const suggestions: string[] = [];
    const lowerPrefix = prefix.toLowerCase();

    for (const entry of this.entries.values()) {
      if (entry.name.toLowerCase().startsWith(lowerPrefix)) {
        suggestions.push(entry.name);
      }
    }

    return suggestions.slice(0, limit);
  }

  /**
   * Get trending
   */
  getTrending(limit = 10): RegistryEntry[] {
    const entries = Array.from(this.entries.values());
    
    // Sort by downloads and recent activity
    entries.sort((a, b) => {
      const aScore = a.downloads + (a.updatedAt / 1000000);
      const bScore = b.downloads + (b.updatedAt / 1000000);
      return bScore - aScore;
    });

    return entries.slice(0, limit);
  }

  /**
   * Get recent
   */
  getRecent(limit = 10): RegistryEntry[] {
    const entries = Array.from(this.entries.values());
    
    entries.sort((a, b) => b.publishedAt - a.publishedAt);

    return entries.slice(0, limit);
  }

  /**
   * Get all entries
   */
  getAll(): RegistryEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Get event bus
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }
}

export default SearchEngine;
